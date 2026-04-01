# Developers Guide

Technical reference for contributors. For user-facing setup and usage see [README.md](README.md).

## Architecture

This repository operates entirely as an E2E orchestration dashboard. 

```
browser
  │  HTTP (Vite /api proxy)
  ▼
dashboard/frontend/     Tailwind + React SPA
  │  Axios → /api/*
  ▼
dashboard/backend/      FastAPI orchestrator DB routing
  │  (subprocess)
  ▼
automation/generator/   The core Python generator CLI
```

The frontend and backend process configurations, orchestrating tasks executed by `automation/generator/main.py`.

## Multi-Project Artifact Routing

Any target React repository can be tracked.
When a user targets a project named `Acme Corp`, the system:
1. Validates the frontend react absolute path.
2. Extracts its entities.
3. Bootstraps `automation/acme_corp/` which acts as its distinct Playwright runner folder.
4. Generates `locators/`, `pages/`, `testcases/`.
5. Outputs isolated test runs into `automation/acme_corp/test-results/` and its own `playwright-report/`.

## The Core Generator

The generator (`automation/generator/`) operates on CLI flags:

**Mode A — `e2e` — Component mapping**
```bash
python main.py e2e --only locators
python main.py e2e --only pages
```
Scans the external project path and maps `{entity}-{element}` logic into static file references using the selected LLM Provider.

**Mode B — `tests` — Generating execution specifications**
```bash
python main.py tests --input test_cases.csv
```
Reads Excel or CSV logic from the dashboard API multipart upload endpoint and structures output assertions correctly over the pre-built `Pages`.

## LLM Providers

The generator supports four backends dynamically wired from the Dashboard's **Global Configuration** page:

| Provider | Setting Key | Environment |
|---|---|---|
| Anthropic API | `ANTHROPIC_API_KEY` | Dashboard UI sets backend `.env` |
| Google Gemini API | `GEMINI_API_KEY` | Dashboard UI sets backend `.env` |
| Google Vertex AI | `GCP_CREDENTIALS_PATH` | Managed file upload endpoint securely stored in `/uploads/gcp` |
| Claude Code CLI | `sdk` | Operates on active console OAuth context without keys |

Optional Python packages required for respective backends:
```bash
pip install google-generativeai          # Gemini API
pip install google-cloud-aiplatform      # Vertex AI
pip install google-auth                  # Vertex AI service account auth
```
