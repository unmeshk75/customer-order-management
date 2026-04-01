# E2E Test Generator Orchestrator

A powerful, standalone LLM-powered test generation dashboard. It creates Playwright locator classes, page objects, and full test cases for any external React-based project.

## Quick Start

### 1. Root Workspace Install

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac / Linux

pip install -r requirements.txt
npm install
```

### 2. Run the Dashboard

Open two terminals carefully sourced to the `venv`:

```bash
# Terminal 1 — Dashboard Backend API
venv\Scripts\activate
cd dashboard/backend
uvicorn main:app --reload --port 8001

# Terminal 2 — Dashboard Frontend
cd dashboard/frontend
npm run dev
```

| Dashboard Client | HTTP URL |
|---|---|
| Dashboard UI | http://localhost:5174 |
| Dashboard API | http://localhost:8001 |

## What It Does

This orchestrator links to your external React codebase via its absolute path. It safely extracts components via `data-testid` values, pipes them seamlessly through Claude/Gemini/Vertex AI models, and dynamically generates valid Node.js E2E configurations in output folders specific to each project.

Target projects can be completely decoupled. The generator engine supports:
- **E2E Manifest Extraction**
- **Locator and Form Entity Page Generation**
- **Multi-step Test Case CSV Execution**
- **Direct Playwright Orchestration**

## Project Structure

```
order-management/
├── automation/              # Stores Playwright E2E artifacts for mapped projects
│   ├── <project_a>/         # Unique structural output bucket
│   ├── <project_b>/
│   └── generator/           # Underlying LLM-powered Python engine
├── dashboard/               
│   ├── backend/             # Dashboard Orchestrator FastAPI
│   └── frontend/            # Dashboard React 18 + Vite + Tailwind UI
├── package.json             # Root npm workspace config
└── requirements.txt         # Root Python dependencies
```

## Sub-folder Guides

| Folder | README |
|---|---|
| `dashboard/frontend/` | [Frontend setup](dashboard/frontend/README.md) |
| `dashboard/backend/` | [API backend](dashboard/backend/README.md) |
| `automation/generator/` | [CLI execution core and prompts](automation/generator/README.md) |

For architecture details, internals, and contributor guidance see [DEVELOPERS_GUIDE.md](DEVELOPERS_GUIDE.md).
