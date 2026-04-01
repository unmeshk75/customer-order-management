from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

def now_utc():
    return datetime.now(timezone.utc)

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    source_type = Column(String) # 'folder' or 'zip'
    source_path = Column(String)
    src_subdir = Column(String, default="src")
    output_dir = Column(String)
    manifest_path = Column(String, nullable=True)
    entities = Column(String, nullable=True) # JSON array
    status = Column(String, default="ready") # 'ready', 'extracting', 'generating', 'error'
    created_at = Column(DateTime, default=now_utc)
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

    generation_jobs = relationship("GenerationJob", back_populates="project", cascade="all, delete-orphan")
    test_runs = relationship("TestRun", back_populates="project", cascade="all, delete-orphan")
    uploaded_files = relationship("UploadedFile", back_populates="project", cascade="all, delete-orphan")

class GenerationJob(Base):
    __tablename__ = "generation_jobs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    job_type = Column(String) # 'e2e' or 'tests'
    provider = Column(String) # 'anthropic', 'sdk', 'gemini', 'vertexai'
    only_step = Column(String, nullable=True) # None, 'locators', 'pages'
    input_file_path = Column(String, nullable=True)
    status = Column(String, default="queued") # 'queued', 'running', 'done', 'error'
    log = Column(String, default="") # newline-separated JSON event strings
    result_summary = Column(String, nullable=True) # JSON
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_utc)

    project = relationship("Project", back_populates="generation_jobs")
    test_runs = relationship("TestRun", back_populates="generation_job")

class TestRun(Base):
    __tablename__ = "test_runs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    generation_job_id = Column(Integer, ForeignKey("generation_jobs.id"), nullable=True)
    spec_filter = Column(String, nullable=True)
    base_url = Column(String, nullable=True)
    status = Column(String, default="queued") # 'queued', 'running', 'passed', 'failed', 'error'
    log = Column(String, default="") # captured stdout lines
    total = Column(Integer, default=0)
    passed = Column(Integer, default=0)
    failed = Column(Integer, default=0)
    skipped = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=now_utc)

    project = relationship("Project", back_populates="test_runs")
    generation_job = relationship("GenerationJob", back_populates="test_runs")
    test_case_results = relationship("TestCaseResult", back_populates="test_run", cascade="all, delete-orphan")

class TestCaseResult(Base):
    __tablename__ = "test_case_results"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("test_runs.id"))
    spec_file = Column(String)
    test_title = Column(String)
    status = Column(String) # 'passed', 'failed', 'skipped', 'timedOut'
    duration_ms = Column(Integer, default=0)
    error_message = Column(String, nullable=True)
    error_stack = Column(String, nullable=True)

    test_run = relationship("TestRun", back_populates="test_case_results")

class Config(Base):
    __tablename__ = "config"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(String)
    description = Column(String, nullable=True)
    is_secret = Column(Integer, default=0) # 1 = mask as ***
    updated_at = Column(DateTime, default=now_utc, onupdate=now_utc)

class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    original_name = Column(String)
    stored_path = Column(String)
    file_type = Column(String) # 'zip', 'excel', 'csv', 'gcp_json'
    created_at = Column(DateTime, default=now_utc)

    project = relationship("Project", back_populates="uploaded_files")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action_type = Column(String, index=True) # 'CONFIG_UPDATED', 'TEST_HALTED', etc.
    description = Column(String)
    created_at = Column(DateTime, default=now_utc)
