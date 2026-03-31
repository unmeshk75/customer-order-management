import asyncio, json
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db, SessionLocal
from models import GenerationJob, Project
from schemas import GenerationJobResponse, GenerationJobCreateE2E
from services.generator_service import run_generation_job

router = APIRouter()

@router.get("/jobs", response_model=List[GenerationJobResponse])
def get_jobs(project_id: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(GenerationJob)
    if project_id:
        q = q.filter(GenerationJob.project_id == project_id)
    return q.order_by(GenerationJob.created_at.desc()).all()

@router.get("/jobs/{id}", response_model=GenerationJobResponse)
def get_job(id: int, db: Session = Depends(get_db)):
    job = db.query(GenerationJob).get(id)
    if not job: raise HTTPException(404, "Job not found")
    return job

@router.post("/e2e")
def create_e2e_job(data: GenerationJobCreateE2E, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Check concurrent
    running = db.query(GenerationJob).filter(GenerationJob.project_id == data.project_id, GenerationJob.status == "running").first()
    if running:
        raise HTTPException(409, "A generation job is already running for this project.")
        
    job = GenerationJob(
        project_id=data.project_id,
        job_type="e2e",
        provider=data.provider,
        only_step=data.only_step
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    
    background_tasks.add_task(asyncio.run, run_generation_job(job.id))
    return {"job_id": job.id}

@router.get("/jobs/{id}/stream")
async def stream_job_logs(id: int):
    async def event_generator():
        last_len = 0
        while True:
            db: Session = SessionLocal()
            try:
                job = db.query(GenerationJob).get(id)
                if not job: 
                    yield f"data: {json.dumps({'type':'error','text':'Job not found'})}\n\n"
                    break
                    
                current_log = job.log or ""
                if len(current_log) > last_len:
                    yield f"data: {json.dumps({'type':'log','text':current_log[last_len:]})}\n\n"
                    last_len = len(current_log)
                    
                if job.status in ('done', 'error'):
                    yield f"data: {json.dumps({'type':'done','status':job.status,'summary':job.result_summary})}\n\n"
                    break
            finally:
                db.close()
            await asyncio.sleep(0.5)

    return StreamingResponse(event_generator(), media_type="text/event-stream", headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})
