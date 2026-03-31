from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
import json

class ConfigBase(BaseModel):
    key: str
    value: str

class ConfigCreate(ConfigBase):
    pass

class ConfigUpdate(ConfigBase):
    pass

class ConfigResponse(ConfigBase):
    id: int
    description: Optional[str] = None
    is_secret: int
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    name: str

class ProjectCreateFolder(ProjectBase):
    path: str
    src_subdir: Optional[str] = "src"
    output_dir: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    source_type: str
    source_path: str
    src_subdir: str
    output_dir: str
    manifest_path: Optional[str] = None
    entities: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class GenerationJobBase(BaseModel):
    project_id: int
    provider: str

class GenerationJobCreateE2E(GenerationJobBase):
    only_step: Optional[str] = None

class GenerationJobCreateTests(GenerationJobBase):
    # Form data params won't map perfectly to Pydantic here without explicit Form definitions
    pass

class GenerationJobResponse(BaseModel):
    id: int
    project_id: int
    job_type: str
    provider: str
    only_step: Optional[str] = None
    input_file_path: Optional[str] = None
    status: str
    log: str
    result_summary: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class TestCaseResultResponse(BaseModel):
    id: int
    run_id: int
    spec_file: str
    test_title: str
    status: str
    duration_ms: int
    error_message: Optional[str] = None
    error_stack: Optional[str] = None
    
    class Config:
        from_attributes = True

class TestRunCreate(BaseModel):
    project_id: int
    generation_job_id: Optional[int] = None
    spec_filter: Optional[str] = None

class TestRunResponse(BaseModel):
    id: int
    project_id: int
    generation_job_id: Optional[int] = None
    spec_filter: Optional[str] = None
    base_url: Optional[str] = None
    status: str
    log: str
    total: int
    passed: int
    failed: int
    skipped: int
    duration_ms: int
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime
    test_case_results: List[TestCaseResultResponse] = []

    class Config:
        from_attributes = True

class UploadedFileResponse(BaseModel):
    id: int
    project_id: Optional[int] = None
    original_name: str
    stored_path: str
    file_type: str
    created_at: datetime

    class Config:
        from_attributes = True
