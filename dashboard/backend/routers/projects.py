from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Project
from schemas import ProjectResponse, ProjectCreateFolder
from services.project_service import link_folder, handle_zip_upload, extract_manifest_for_project
import shutil, os, uuid

router = APIRouter()

@router.get("/", response_model=List[ProjectResponse])
def get_projects(db: Session = Depends(get_db)):
    return db.query(Project).all()

@router.get("/{id}", response_model=ProjectResponse)
def get_project(id: int, db: Session = Depends(get_db)):
    p = db.query(Project).get(id)
    if not p: raise HTTPException(404, "Project not found")
    return p

@router.post("/link", response_model=ProjectResponse)
def create_link(data: ProjectCreateFolder, db: Session = Depends(get_db)):
    try:
        return link_folder(db, data)
    except ValueError as e:
        raise HTTPException(400, str(e))

@router.post("/upload-zip", response_model=ProjectResponse)
async def upload_zip(file: UploadFile = File(...), name: str = Form(...), src_subdir: str = Form(None), db: Session = Depends(get_db)):
    os.makedirs("uploads", exist_ok=True)
    file_path = f"uploads/{uuid.uuid4()}_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return handle_zip_upload(db, file_path, file.filename, name, src_subdir)

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
