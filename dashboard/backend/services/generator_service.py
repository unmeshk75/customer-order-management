import sys, os, json, asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import update, func
from database import SessionLocal
from models import Config, GenerationJob, Project

ACTIVE_PROCESSES = {}

def cancel_job(job_id: int):
    proc = ACTIVE_PROCESSES.get(job_id)
    if proc:
        try:
            proc.terminate()
        except:
            pass

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

        # Simulate work or hook to actual generation depending on job.job_type
        _append_log(db, job_id, {"type": "info", "message": f"Starting {job.job_type} job..."})
        
        gen_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "automation", "generator")
        cmd = [sys.executable, "main.py", job.job_type, "--provider", job.provider]

        if job.job_type == "e2e":
            cmd.extend(["--output", project.output_dir])
            src = os.path.join(project.source_path, project.src_subdir)
            cmd.extend(["--src", src])
            if job.only_step:
                cmd.extend(["--only", job.only_step])
        elif job.job_type == "tests":
            cmd.extend(["--output", os.path.join(project.output_dir, "tests")])
            cmd.extend(["--input", job.input_file_path])

        env = os.environ.copy()
        for c in db.query(Config).all():
            if c.value: env[c.key] = c.value
            
        env["PYTHONIOENCODING"] = "utf-8"

        import subprocess
        process = subprocess.Popen(
            cmd, cwd=gen_dir, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, 
            text=True, encoding='utf-8', errors='replace', env=env
        )
        ACTIVE_PROCESSES[job_id] = process
        
        for line in process.stdout:
            _append_log(db, job_id, {"type": "log", "message": line.strip()})
        process.wait()
        
        ACTIVE_PROCESSES.pop(job_id, None)

        if process.returncode != 0:
            raise RuntimeError(f"Generator exited with code {process.returncode}")

        job.status = "done"
        job.finished_at = datetime.now(timezone.utc)
        job.result_summary = json.dumps({"files_written": "See Logs", "errors": 0})
        _append_log(db, job_id, {"type": "info", "message": "Job finished successfully."})
        db.commit()

    except Exception as e:
        ACTIVE_PROCESSES.pop(job_id, None)
        db.rollback()
        # safe fetch
        job = db.query(GenerationJob).get(job_id)
        job.status = "error"
        job.finished_at = datetime.now(timezone.utc)
        _append_log(db, job_id, {"type": "error", "message": str(e)})
        db.commit()
    finally:
        db.close()
