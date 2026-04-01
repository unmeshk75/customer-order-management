from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Project, AuditLog, TestCaseResult, TestRun
from schemas import ProjectResponse, ProjectCreateFolder
from services.project_service import link_folder, handle_zip_upload, extract_manifest_for_project
import shutil, os, uuid

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()

@router.get("/dialog")
def open_folder_dialog():
    import tkinter as tk
    from tkinter import filedialog
    # On Windows, local dashboards can pop native dialogs safely
    root = tk.Tk()
    root.withdraw()
    root.attributes('-topmost', True)
    folder_path = filedialog.askdirectory(parent=root, title="Select React Target Project Folder")
    root.destroy()
    return {"path": folder_path or ""}

@router.get("/{id}", response_model=ProjectResponse)
def get_project(id: int, db: Session = Depends(get_db)):
    p = db.query(Project).get(id)
    if not p: raise HTTPException(404, "Project not found")
    return p

@router.get("/{id}/testcases")
def get_project_testcases(id: int, db: Session = Depends(get_db)):
    p = db.query(Project).get(id)
    if not p: raise HTTPException(404, "Project not found")
    
    tests_dir = os.path.join(p.output_dir, "tests")
    if not os.path.exists(tests_dir):
        return []
        
    tests = sorted([f for f in os.listdir(tests_dir) if f.endswith('.spec.js')])
    
    res = []
    for t in tests:
        # Find the most recent run result
        latest = db.query(TestCaseResult).join(TestRun).filter(
            TestRun.project_id == id,
            TestCaseResult.spec_file == t
        ).order_by(TestRun.created_at.desc()).first()
        
        res.append({
            "file": t,
            "status": latest.status if latest else None
        })
        
    return res

@router.post("/link", response_model=ProjectResponse)
def create_link(data: ProjectCreateFolder, db: Session = Depends(get_db)):
    try:
        p = link_folder(db, data)
        db.add(AuditLog(action_type="PROJECT_LINKED", description=f"Linked project {p.name} at {p.source_path}"))
        db.commit()
        return p
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.post("/upload-zip", response_model=ProjectResponse)
async def upload_zip(file: UploadFile = File(...), name: str = Form(...), src_subdir: str = Form(None), db: Session = Depends(get_db)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{uuid.uuid4()}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    p = handle_zip_upload(db, file_path, file.filename, name, src_subdir)
    db.add(AuditLog(action_type="PROJECT_UPLOADED", description=f"Uploaded project ZIP {name}"))
    db.commit()
    return p

@router.post("/{id}/extract-manifest", response_model=ProjectResponse)
def extract_manifest(id: int, db: Session = Depends(get_db)):
    project = db.query(Project).get(id)
    if not project: raise HTTPException(404, "Project not found")
    try:
        return extract_manifest_for_project(db, project)
    except Exception as e:
        raise HTTPException(500, str(e))

@router.delete("/{id}")
def delete_project(id: int, db: Session = Depends(get_db)):
    project = db.query(Project).get(id)
    if project:
        db.delete(project)
        db.commit()
    return {"status": "ok"}
