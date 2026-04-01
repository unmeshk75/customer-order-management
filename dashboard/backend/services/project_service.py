import os, sys, json, zipfile
from sqlalchemy.orm import Session
from models import Project, UploadedFile
from schemas import ProjectCreateFolder

_GEN = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'automation', 'generator'))
if _GEN not in sys.path:
    sys.path.insert(0, _GEN)

try:
    import extractor
except ImportError:
    extractor = None

def link_folder(db: Session, data: ProjectCreateFolder):
    import re
    src_dir = os.path.join(data.path, data.src_subdir) if data.src_subdir else data.path
    if not os.path.isdir(data.path):
        raise ValueError(f"Invalid project path: {data.path}")
    if data.src_subdir and not os.path.isdir(src_dir):
        raise ValueError(f"Invalid src path: {src_dir}")
    
    project_slug = re.sub(r'[^a-zA-Z0-9_\-]', '_', data.name).lower()
    auto_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "automation"))
    out_dir = data.output_dir or os.path.join(auto_dir, project_slug)
    
    db_proj = Project(
        name=data.name,
        source_type="folder",
        source_path=data.path,
        src_subdir=data.src_subdir or "",
        output_dir=out_dir
    )
    db.add(db_proj)
    db.commit()
    db.refresh(db_proj)
    return db_proj

def extract_manifest_for_project(db: Session, project: Project):
    if not extractor:
        raise RuntimeError("Generator 'extractor' module not found.")
        
    src_dir = os.path.join(project.source_path, project.src_subdir) if project.src_subdir else project.source_path
    manifest = extractor.extract(src_dir)
    
    os.makedirs(project.output_dir, exist_ok=True)
    manifest_path = os.path.join(project.output_dir, "selector_manifest.json")
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
        
    # Extractor utilities might differ depending on version; fail gracefully if methods missing
    entities = set()
    if hasattr(extractor, 'get_all_entities'):
        entities.update(extractor.get_all_entities(manifest))
    if hasattr(extractor, 'get_page_entities'):
        try:
            pages = extractor.get_page_entities(manifest)
            entities.update(pages if isinstance(pages, list) else pages.keys())
        except Exception:
            pass
            
    project.manifest_path = manifest_path
    project.entities = json.dumps(list(entities))
    db.commit()
    return project

def handle_zip_upload(db: Session, file_path: str, original_name: str, name: str, src_subdir: str = None):
    # Extracts zip and returns a new Project
    workspaces_dir = os.path.join(os.path.dirname(__file__), "..", "workspaces")
    os.makedirs(workspaces_dir, exist_ok=True)
    
    extract_path = os.path.join(workspaces_dir, name)
    with zipfile.ZipFile(file_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
        
    # check single top-level dir (github)
    contents = os.listdir(extract_path)
    if len(contents) == 1 and os.path.isdir(os.path.join(extract_path, contents[0])):
        extract_path = os.path.join(extract_path, contents[0])
        
    # Auto-detect src_subdir
    detected_src = src_subdir
    if not detected_src:
        for possible in ['src', 'frontend/src', 'app']:
            if os.path.isdir(os.path.join(extract_path, possible)):
                detected_src = possible
    import re
    project_slug = re.sub(r'[^a-zA-Z0-9_\-]', '_', name).lower()
    auto_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "automation"))
    out_dir = os.path.join(auto_dir, project_slug)

    db_proj = Project(
        name=name,
        source_type="zip",
        source_path=extract_path,
        src_subdir=detected_src or "",
        output_dir=out_dir
    )
    db.add(db_proj)
    db.commit()
    db.refresh(db_proj)
    return db_proj
