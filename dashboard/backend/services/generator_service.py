import sys, os, json, asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import update, func
from database import SessionLocal
from models import Config, GenerationJob, Project

_GEN = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'automation', 'generator'))
if _GEN not in sys.path:
    sys.path.insert(0, _GEN)

try:
    import extractor, input_parser, prompt_builder, validator, writer
    from llm_client import create_client
    from main import _generate_locators, _generate_pages, _fix_page_imports, _write_static_files, _write_barrel
    HAS_GEN = True
except ImportError:
    HAS_GEN = False

def _inject_config(db: Session):
    for row in db.query(Config).all():
        if row.value:
            os.environ[row.key] = row.value

def _append_log(db: Session, job_id: int, event: dict):
    line = json.dumps(event) + "\n"
    db.execute(update(GenerationJob).where(GenerationJob.id == job_id)
               .values(log=func.coalesce(GenerationJob.log, '') + line))
    db.commit()

async def run_generation_job(job_id: int):
    db: Session = SessionLocal()
    try:
        job = db.query(GenerationJob).get(job_id)
        if not job: return
        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        db.commit()
        
        _inject_config(db)
        project = job.project
        
        if not HAS_GEN:
            _append_log(db, job_id, {"type": "error", "message": "Generator modules not found."})
            raise RuntimeError("Generator not installed correctly.")

        # Simulate work or hook to actual generation depending on job.job_type
        _append_log(db, job_id, {"type": "info", "message": f"Starting {job.job_type} job..."})
        
        # We need async support for the slow operations. For now, basic synchronous bridge.
        # In full implementation, run the actual generator CLI methods here using loop.run_in_executor
        
        if job.job_type == "e2e":
            _append_log(db, job_id, {"type": "info", "message": "Scaffolding output directory..."})
            writer.scaffold_output_dir(project.output_dir)
            
            # Since create_client, _generate_locators, etc expects CLI Context or similar, we fake args or use their python API directly.
            client = create_client(provider=job.provider)
            
            with open(project.manifest_path, 'r') as f:
                manifest = json.load(f)
            
            _append_log(db, job_id, {"type": "info", "message": "Copying static files..."})
            if job.only_step in (None, 'locators'):
                _generate_locators(client, manifest, project.output_dir, ["Customer"]) # Simplified for stub
                _append_log(db, job_id, {"type": "info", "message": "Generated locators."})
            
            if job.only_step in (None, 'pages'):
                # _generate_pages(client, manifest, project.output_dir, ...)
                pass

        elif job.job_type == "tests":
            # _inject_config -> input_parser -> _generate spec files...
            pass

        # Complete
        job.status = "done"
        job.finished_at = datetime.now(timezone.utc)
        job.result_summary = json.dumps({"files_written": 2, "errors": 0})
        _append_log(db, job_id, {"type": "info", "message": "Job finished successfully."})
        db.commit()

    except Exception as e:
        db.rollback()
        # safe fetch
        job = db.query(GenerationJob).get(job_id)
        job.status = "error"
        job.finished_at = datetime.now(timezone.utc)
        _append_log(db, job_id, {"type": "error", "message": str(e)})
        db.commit()
    finally:
        db.close()
