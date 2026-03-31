from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from models import Config
import routers.projects, routers.generation, routers.runs, routers.config

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Test Generator Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    defaults = {
        "ANTHROPIC_API_KEY": ("", 1),
        "GEMINI_API_KEY": ("", 1),
        "GCP_PROJECT": ("", 0),
        "GCP_CREDENTIALS_PATH": ("", 0),
        "GCP_LOCATION": ("us-central1", 0),
        "GEMINI_MODEL": ("gemini-2.0-flash", 0),
        "VERTEX_MODEL": ("gemini-2.0-flash", 0),
        "FRONTEND_URL": ("http://localhost:5173", 0), # note: Vite serves our app on 5174, target app runs on whatever it wants
        "CHROME_PATH": ("", 0),
    }
    for k, (v, secret) in defaults.items():
        if not db.query(Config).filter(Config.key == k).first():
            db.add(Config(key=k, value=v, is_secret=secret, description=f"Default {k} config"))
    db.commit()
    db.close()

app.include_router(routers.projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(routers.generation.router, prefix="/api/generation", tags=["generation"])
app.include_router(routers.runs.router, prefix="/api/runs", tags=["runs"])
app.include_router(routers.config.router, prefix="/api/config", tags=["config"])

