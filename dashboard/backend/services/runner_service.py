import os, subprocess, json, asyncio
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import update, func
from database import SessionLocal
from models import TestRun, TestCaseResult, Project
from services.generator_service import _inject_config

def _append_run_log(db: Session, run_id: int, line: str):
    # Simplistic log append, in prod batch this
    db.execute(update(TestRun).where(TestRun.id == run_id)
               .values(log=func.coalesce(TestRun.log, '') + line + "\n"))
    db.commit()

async def execute_playwright_run(run_id: int):
    db: Session = SessionLocal()
    try:
        run = db.query(TestRun).get(run_id)
        project = run.project
        
        run.status = "running"
        run.started_at = datetime.now(timezone.utc)
        db.commit()

        # Check npm install
        nm_path = os.path.join(project.output_dir, "node_modules")
        if not os.path.exists(nm_path):
            _append_run_log(db, run_id, "Installing dependencies for Playwright...\n")
            proc_npm = subprocess.Popen(['npm', 'install'], cwd=project.output_dir, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            for line in proc_npm.stdout:
                _append_run_log(db, run_id, line.strip())
            proc_npm.wait()

        cmd = ['npx', 'playwright', 'test',
               '--reporter=list',
               '--reporter=json:test-results/pw-results.json',
               '--config=playwright.config.cjs']
        
        if run.spec_filter:
            cmd.append(run.spec_filter)
            
        env = os.environ.copy()
        if run.base_url:
            env['FRONTEND_URL'] = run.base_url
            
        _inject_config(db)

        process = subprocess.Popen(cmd, cwd=project.output_dir,
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            text=True, encoding='utf-8', env=env)
            
        # Synchronous read logic for simple stub, blocks async loop
        # in prod use asyncio.create_subprocess_exec
        for line in process.stdout:
            _append_run_log(db, run_id, line.strip())
        process.wait()

        run.status = "passed" if process.returncode == 0 else "failed"

        # Parse JSON results
        pw_res = os.path.join(project.output_dir, "test-results", "pw-results.json")
        if os.path.exists(pw_res):
            with open(pw_res, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            for suite in data.get('suites', []):
                for spec in suite.get('specs', []):
                    for test in spec.get('tests', []):
                        if not test.get('results'): continue
                        result = test['results'][0]
                        
                        db.add(TestCaseResult(
                            run_id=run.id, 
                            spec_file=suite.get('title', ''),
                            test_title=spec.get('title', ''), 
                            status=result.get('status', 'unknown'),
                            duration_ms=result.get('duration', 0),
                            error_message=result.get('error',{}).get('message',''),
                            error_stack=result.get('error',{}).get('stack','')
                        ))
        
        run.finished_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as e:
        db.rollback()
        # safe fetch
        run = db.query(TestRun).get(run_id)
        if run:
            run.status = "error"
            run.finished_at = datetime.now(timezone.utc)
            _append_run_log(db, run_id, f"ERROR: {str(e)}\n")
            db.commit()
    finally:
        db.close()
