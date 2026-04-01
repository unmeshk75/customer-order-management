from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
from models import Config, AuditLog
import os, shutil, uuid

def update_env_file(key: str, value: str):
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "automation", "generator", ".env"))
    if not os.path.exists(env_path):
        open(env_path, "w").close()
    
    with open(env_path, "r") as f:
        lines = f.readlines()
        
    updated = False
    for i, line in enumerate(lines):
        if line.startswith(f"{key}="):
            lines[i] = f"{key}={value}\n"
            updated = True
            break
            
    if not updated:
        lines.append(f"{key}={value}\n")
        
    with open(env_path, "w") as f:
        f.writelines(lines)

router = APIRouter()

class BulkConfigUpdate(BaseModel):
    key: str
    value: str

@router.get("/")
def get_configs(db: Session = Depends(get_db)):
    res = []
    for c in db.query(Config).all():
        val = "***" if c.is_secret and c.value else c.value
        res.append({
            "id": c.id, 
            "key": c.key, 
            "value": val, 
            "description": c.description, 
            "is_secret": c.is_secret
        })
    return res

@router.post("/bulk")
def update_bulk(data: List[BulkConfigUpdate], db: Session = Depends(get_db)):
    for item in data:
        if item.value == "***": 
            continue
        c = db.query(Config).filter(Config.key == item.key).first()
        if c:
            c.value = item.value
            update_env_file(item.key, item.value)
            db.add(AuditLog(action_type="CONFIG_UPDATED", description=f"Updated config {item.key}"))
    db.commit()
    return {"status": "saved"}

@router.get("/provider-status")
def provider_status(db: Session = Depends(get_db)):
    def has_val(key):
        c = db.query(Config).filter(Config.key == key).first()
        return bool(c and c.value)
    
    return {
        "anthropic": has_val("ANTHROPIC_API_KEY"),
        "gemini": has_val("GEMINI_API_KEY"),
        "vertexai": has_val("GCP_CREDENTIALS_PATH") and has_val("GCP_PROJECT"),
        "sdk": True
    }

@router.post("/upload-gcp-credentials")
async def upload_gcp_credentials(file: UploadFile = File(...), db: Session = Depends(get_db)):
    upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "gcp")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.abspath(os.path.join(upload_dir, f"{uuid.uuid4()}_{file.filename}"))
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    c = db.query(Config).filter(Config.key == "GCP_CREDENTIALS_PATH").first()
    if c:
        c.value = file_path
        update_env_file("GCP_CREDENTIALS_PATH", file_path)
        db.add(AuditLog(action_type="GCP_KEY_UPLOADED", description="Uploaded new GCP credentials JSON"))
        db.commit()
        
    return {"status": "ok", "path": file_path}
