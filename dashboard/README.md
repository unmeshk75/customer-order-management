# Dashboard

Web UI for the LLM-powered Playwright test generator.

## Stack

- **Backend:** FastAPI on port 8001 (`dashboard/backend/`)
- **Frontend:** React + Vite on port 5174 (`dashboard/frontend/`)

## Start

```bash
# Backend
cd dashboard/backend
uvicorn main:app --reload --port 8001

# Frontend
cd dashboard/frontend
npm install
npm run dev
```

See [DASHBOARD_PLAN.md](../DASHBOARD_PLAN.md) for full architecture and implementation spec.
