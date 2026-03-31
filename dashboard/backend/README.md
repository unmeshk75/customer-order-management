# Dashboard Backend

FastAPI backend for the Test Generator Dashboard. This API manages Playwright test generation via LLM providers and test execution.

## Setup

1. Check that you are using Python 3.12+
2. Install requirements from the repository root: `pip install -r ../requirements.txt`
3. Run the development server: `uvicorn main:app --port 8001 --reload`

## Architecture

- `main.py` - Application entry point
- `models.py` / `schemas.py` / `database.py` - SQLAlchemy and Pydantic ORM
- `routers/` - FastAPI endpoints
- `services/` - Sub-process and LLM service integration
