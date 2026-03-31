import asyncio, json
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db, SessionLocal
from models import TestRun, Project
from schemas import TestRunResponse, TestRunCreate
from services.runner_service import execute_playwright_run

router = APIRouter()

@router.get("/", response_model=List[TestRunResponse])
def get_runs(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(TestRun)
    if project_id:
        q = q.filter(TestRun.project_id == project_id)
    return q.order_by(TestRun.created_at.desc()).all()

@router.get("/{id}", response_model=TestRunResponse)
def get_run(id: int, db: Session = Depends(get_db)):
    run = db.query(TestRun).get(id)
    if not run: raise HTTPException(404, "Run not found")
    return run

@router.post("/")
def create_run(data: TestRunCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    from models import Config
    base_url_conf = db.query(Config).filter(Config.key == "FRONTEND_URL").first()
    base_url = base_url_conf.value if base_url_conf else None

    run = TestRun(
        project_id=data.project_id,
        generation_job_id=data.generation_job_id,
        spec_filter=data.spec_filter,
        base_url=base_url
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    background_tasks.add_task(asyncio.run, execute_playwright_run(run.id))
    return {"run_id": run.id}

@router.get("/{id}/stream")
async def stream_run_logs(id: int):
    async def event_generator():
        last_len = 0
        while True:
            db: Session = SessionLocal()
            try:
                run = db.query(TestRun).get(id)
                if not run: 
                    yield f"data: {json.dumps({'type':'error','text':'Run not found'})}\n\n"
                    break
                    
                current_log = run.log or ""
                if len(current_log) > last_len:
                    yield f"data: {json.dumps({'type':'log','text':current_log[last_len:]})}\n\n"
                    last_len = len(current_log)
                    
                if run.status in ('passed', 'failed', 'error'):
                    yield f"data: {json.dumps({'type':'done','status':run.status})}\n\n"
                    break
            finally:
                db.close()
            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

@router.delete("/{id}")
def delete_run(id: int, db: Session = Depends(get_db)):
    run = db.query(TestRun).get(id)
    if run:
        db.delete(run)
        db.commit()
    return {"status": "ok"}
