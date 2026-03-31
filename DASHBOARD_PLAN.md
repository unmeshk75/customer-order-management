# Dashboard Plan: Standalone Test Generator Web App

## Overview

A web dashboard at `d:\order-management\dashboard\` that wraps the existing `automation/generator/` CLI tool. Users link or upload a React project, upload Excel test cases, generate Playwright specs via any LLM provider, run them, and view results — all from the browser with zero manual config file editing.

- **Backend:** FastAPI on port **8001**
- **Frontend:** React + Vite on port **5174**, plain CSS
- **Shares:** root Python venv, existing generator modules
- **Playwright runs:** user starts the target app themselves; dashboard only runs `npx playwright test`

---

## Directory Structure

```
dashboard/
├── backend/
│   ├── main.py                  # FastAPI app, CORS, startup seed
│   ├── database.py              # SQLAlchemy engine + SessionLocal
│   ├── models.py                # All ORM models
│   ├── schemas.py               # Pydantic schemas
│   ├── routers/
│   │   ├── projects.py          # Project CRUD, folder-link, zip-upload, manifest extract
│   │   ├── generation.py        # e2e + tests jobs, SSE stream, file download
│   │   ├── runs.py              # Playwright run, SSE stream, results
│   │   └── config.py            # Config CRUD, provider status
│   ├── services/
│   │   ├── generator_service.py # Imports generator modules, runs jobs in background
│   │   ├── runner_service.py    # Subprocess Playwright, JSON result parsing
│   │   └── project_service.py   # Zip extract, folder validation, src-dir detection
│   ├── uploads/                 # Uploaded Excel/CSV/zip/GCP JSON files
│   ├── workspaces/              # Extracted zip projects live here
│   ├── dashboard.db             # Auto-created SQLite
│   └── requirements.txt
├── frontend/
│   ├── index.html
│   ├── vite.config.js           # proxy /api → http://localhost:8001
│   ├── package.json             # port 5174
│   └── src/
│       ├── main.jsx
│       ├── App.jsx              # tab state: projects | generate | runs | config
│       ├── api.js               # axios instance + streamJob()/streamRun() SSE helpers
│       ├── App.css
│       └── pages/
│           ├── ProjectsPage.jsx
│           ├── GeneratePage.jsx
│           ├── RunsPage.jsx
│           └── ConfigPage.jsx
└── README.md
```

---

## Database Schema

### `projects`
| col | type | notes |
|---|---|---|
| id | INTEGER PK | |
| name | TEXT | display name |
| source_type | TEXT | `'folder'` or `'zip'` |
| source_path | TEXT | absolute path to project root |
| src_subdir | TEXT | relative path to JSX/TSX src, default `'src'` |
| output_dir | TEXT | absolute path for e2e-generated output |
| manifest_path | TEXT | absolute path to last written selector_manifest.json |
| entities | TEXT | JSON array of detected entity names |
| status | TEXT | `'ready'` `'extracting'` `'generating'` `'error'` |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `generation_jobs`
| col | type | notes |
|---|---|---|
| id | INTEGER PK | |
| project_id | INTEGER FK | |
| job_type | TEXT | `'e2e'` or `'tests'` |
| provider | TEXT | `'anthropic'` `'sdk'` `'gemini'` `'vertexai'` |
| only_step | TEXT | NULL, `'locators'`, or `'pages'` |
| input_file_path | TEXT | for tests jobs: uploaded Excel/CSV |
| status | TEXT | `'queued'` `'running'` `'done'` `'error'` |
| log | TEXT | newline-separated JSON event strings, grown incrementally |
| result_summary | TEXT | JSON: `{files_written:[...], errors:[...]}` |
| started_at | DATETIME | |
| finished_at | DATETIME | |
| created_at | DATETIME | |

### `test_runs`
| col | type | notes |
|---|---|---|
| id | INTEGER PK | |
| project_id | INTEGER FK | |
| generation_job_id | INTEGER FK NULL | |
| spec_filter | TEXT | NULL = all specs |
| base_url | TEXT | snapshot of FRONTEND_URL at run time |
| status | TEXT | `'queued'` `'running'` `'passed'` `'failed'` `'error'` |
| log | TEXT | captured stdout lines |
| total / passed / failed / skipped | INTEGER | |
| duration_ms | INTEGER | |
| started_at | DATETIME | |
| finished_at | DATETIME | |
| created_at | DATETIME | |

### `test_case_results`
| col | type | notes |
|---|---|---|
| id | INTEGER PK | |
| run_id | INTEGER FK | |
| spec_file | TEXT | |
| test_title | TEXT | |
| status | TEXT | `'passed'` `'failed'` `'skipped'` `'timedOut'` |
| duration_ms | INTEGER | |
| error_message | TEXT | |
| error_stack | TEXT | |

### `config`
| col | type | notes |
|---|---|---|
| id | INTEGER PK | |
| key | TEXT UNIQUE | e.g. `'ANTHROPIC_API_KEY'` |
| value | TEXT | |
| description | TEXT | shown in UI |
| is_secret | INTEGER | 1 = mask as `***` in GET responses |
| updated_at | DATETIME | |

### `uploaded_files`
| col | type | notes |
|---|---|---|
| id | INTEGER PK | |
| project_id | INTEGER FK NULL | |
| original_name | TEXT | |
| stored_path | TEXT | absolute path in `uploads/` |
| file_type | TEXT | `'zip'` `'excel'` `'csv'` `'gcp_json'` |
| created_at | DATETIME | |

---

## API Endpoints

### `/api/projects`
- `GET /` — list all projects
- `POST /link` — `{name, path, src_subdir?, output_dir?}` — validate folder, create project
- `POST /upload-zip` — multipart: `file` + `name`, `src_subdir?` — extract, detect src, create project
- `GET /{id}` — single project
- `DELETE /{id}` — delete project record (not files)
- `POST /{id}/extract-manifest` — run extractor, update entities + manifest_path, return entity list

### `/api/generation`
- `GET /jobs` — list jobs, `?project_id=X`
- `GET /jobs/{id}` — single job
- `POST /e2e` — `{project_id, provider, only_step?}` → `{job_id}`
- `POST /tests` — multipart: `file` + `project_id`, `provider` → `{job_id}`
- `GET /jobs/{id}/stream` — **SSE**: polls DB log every 0.5s, streams new lines until done/error
- `GET /jobs/{id}/files` — list generated output files (path + size)
- `GET /jobs/{id}/files/{file_path:path}` — download a generated file

### `/api/runs`
- `GET /` — list runs, `?project_id=X`
- `GET /{id}` — single run + test_case_results
- `POST /` — `{project_id, generation_job_id?, spec_filter?}` → start run
- `GET /{id}/stream` — **SSE**: streams subprocess output until done
- `DELETE /{id}` — delete run record

### `/api/config`
- `GET /` — list all keys (secrets masked as `***`)
- `PUT /{key}` — `{value}` — upsert
- `POST /bulk` — `[{key, value}, ...]` — upsert multiple
- `GET /provider-status` — `{anthropic: bool, sdk: bool, gemini: bool, vertexai: bool}`
- `POST /upload-gcp-credentials` — save JSON to `uploads/gcp/`, set `GCP_CREDENTIALS_PATH` to absolute path

---

## Generator Integration (`generator_service.py`)

### Path setup (module level)
```python
import sys, os
_GEN = os.path.normpath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'automation', 'generator'))
if _GEN not in sys.path:
    sys.path.insert(0, _GEN)

import extractor, input_parser, prompt_builder, validator, writer
from llm_client import create_client
from main import _generate_locators, _generate_pages, _fix_page_imports, _write_static_files, _write_barrel
```

### Config injection (before every job)
```python
def _inject_config(db):
    for row in db.query(Config).all():
        if row.value:
            os.environ[row.key] = row.value
```
DB-stored keys flow to `os.environ`, which `create_client()` reads.

### E2E job flow
1. `_inject_config(db)`
2. `extractor.extract(src_dir)` → manifest dict
3. Copy `selector_manifest.json` to `project.output_dir`; update `project.manifest_path`
4. `extractor.get_all_entities(manifest)` + `get_page_entities(manifest)`
5. `create_client(provider=job.provider)`
6. `writer.scaffold_output_dir(output_dir)`
7. `_generate_locators(...)` if `only_step != 'pages'` — log each file written
8. `_generate_pages(...)` if `only_step != 'locators'` — log each file written
9. `_write_static_files(...)` + `_write_barrel(...)` if `only_step is None`
10. Update job: `status='done'`, `finished_at`, `result_summary`

### Tests job flow
1. `_inject_config(db)`
2. `input_parser.parse(job.input_file_path)` → test case list
3. Save `parsed_test_cases.json` to `output_dir/tests/`
4. Load manifest from `project.manifest_path`
5. `create_client(provider=job.provider)`
6. `input_parser.group_by_entity(test_cases)` → grouped dict
7. For each group: `prompt_builder.build_test_prompt()` → `client.generate()` → `_fix_page_imports()` → `writer.write_file()` → `validator.validate()`
8. Log each spec written, update job

### Log appending pattern
```python
def _append_log(db, job_id, event: dict):
    line = json.dumps(event) + "\n"
    db.execute(update(GenerationJob).where(GenerationJob.id == job_id)
               .values(log=func.coalesce(GenerationJob.log, '') + line))
    db.commit()
```

---

## SSE Streaming

### Generation stream endpoint
```python
async def event_generator():
    last_len = 0
    while True:
        job = db.query(GenerationJob).get(job_id)
        current_log = job.log or ""
        if len(current_log) > last_len:
            yield f"data: {json.dumps({'type':'log','text':current_log[last_len:]})}\n\n"
            last_len = len(current_log)
        if job.status in ('done', 'error'):
            yield f"data: {json.dumps({'type':'done','status':job.status,'summary':job.result_summary})}\n\n"
            break
        await asyncio.sleep(0.5)
return StreamingResponse(event_generator(), media_type="text/event-stream",
                         headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})
```

Test run stream follows same pattern — `runner_service.py` appends subprocess stdout lines to `run.log` incrementally.

### Frontend (`api.js`)
```javascript
export function streamJob(jobId, onLine, onDone) {
    const es = new EventSource(`/api/generation/jobs/${jobId}/stream`);
    es.onmessage = (e) => {
        const d = JSON.parse(e.data);
        if (d.type === 'done') { onDone(d); es.close(); }
        else onLine(d.text);
    };
    return es;
}
```

---

## Playwright Runner (`runner_service.py`)

```python
cmd = ['npx', 'playwright', 'test',
       '--reporter=list',
       '--reporter=json:test-results/pw-results.json',
       '--config=playwright.config.cjs']
if spec_filter:
    cmd.append(spec_filter)

env = os.environ.copy()
env['FRONTEND_URL'] = run.base_url

process = subprocess.Popen(cmd, cwd=project.output_dir,
    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
    text=True, encoding='utf-8', env=env)

for line in process.stdout:
    _append_run_log(db, run_id, line.rstrip())
process.wait()
```

- Before run: check `node_modules/@playwright/test` in `output_dir`; run `npm install` if missing
- After process exits: parse `test-results/pw-results.json` → insert `test_case_results` rows, update run totals

### Playwright JSON result parsing
```python
# Schema: {suites: [{title, specs: [{title, tests: [{results:[{status,duration,error}]}]}]}]}
for suite in data['suites']:
    for spec in suite.get('specs', []):
        for test in spec.get('tests', []):
            result = test['results'][0]
            db.add(TestCaseResult(run_id=run_id, spec_file=suite['title'],
                test_title=spec['title'], status=result['status'],
                duration_ms=result['duration'],
                error_message=result.get('error',{}).get('message',''),
                error_stack=result.get('error',{}).get('stack','')))
```

---

## Zip Upload & Folder Linking

**Folder linking validation:**
1. `os.path.isdir(path)` — must exist
2. `os.path.isdir(os.path.join(path, src_subdir))` — src must exist
3. Glob for `.jsx`/`.tsx` — warn if empty
4. Default `output_dir = os.path.join(path, 'e2e-generated')`

**Zip extraction:**
1. Save to `uploads/{uuid}.zip`
2. Extract to `workspaces/{name}/` using `zipfile`
3. Strip single top-level dir if all entries share one (GitHub download pattern)
4. Auto-detect `src_subdir`: try `src/`, `frontend/src/`, `app/` — pick first with `.jsx`/`.tsx` files
5. Default `output_dir = workspaces/{name}/e2e-generated/`

---

## Frontend Pages

### ProjectsPage
- Grid of project cards: name, status badge, entity chips, source type tag
- **New Project** → modal: two tabs — **Link Folder** (path + src_subdir inputs) | **Upload Zip** (file picker + name)
- On create: POST project → POST extract-manifest → entity chips appear on card
- Card buttons: **[Generate]** (→ GeneratePage, project pre-selected) | **[Run Tests]** (→ RunsPage) | **[Delete]**

### GeneratePage
- Form: project dropdown, job type toggle (e2e / tests), provider dropdown, only-step radio (e2e), file upload (tests)
- **[Generate]** → POST job → SSE stream → live log panel (each JSON log line rendered as colored text)
- Job history table: project, type, provider, status, started, duration, files written count
- Click row → expand: log lines + download links for generated files

### RunsPage
- Top bar: project dropdown, spec filter input, FRONTEND_URL label, **[Run Tests]** button
- Runs table: project, status badge, passed/failed/total, duration, started
- Click row → expand: `test_case_results` table (spec file, test title, status, duration, error message) + historical log

### ConfigPage
- **LLM Providers** section: ANTHROPIC_API_KEY, GEMINI_API_KEY (password inputs), [Save] per key
- **Vertex AI** section: GCP_PROJECT, GCP_LOCATION (text), GCP credentials file upload button
- **Playwright** section: FRONTEND_URL, CHROME_PATH (text inputs)
- Provider status panel: green ✓ / red ✗ per provider (polls `/api/config/provider-status`)
- **[Save All]** bulk button at bottom

---

## `main.py` Startup Seed

Default config rows inserted on first start if key not present:

| key | default value | secret |
|---|---|---|
| `ANTHROPIC_API_KEY` | `""` | yes |
| `GEMINI_API_KEY` | `""` | yes |
| `GCP_PROJECT` | `""` | no |
| `GCP_CREDENTIALS_PATH` | `""` | no |
| `GCP_LOCATION` | `us-central1` | no |
| `GEMINI_MODEL` | `gemini-2.0-flash` | no |
| `VERTEX_MODEL` | `gemini-2.0-flash` | no |
| `FRONTEND_URL` | `http://localhost:5173` | no |
| `CHROME_PATH` | `""` | no |

Start command: `cd dashboard/backend && uvicorn main:app --reload --port 8001`

---

## Key Implementation Notes

1. **Background tasks use their own DB session** — create `SessionLocal()` inside each background function, close in `finally`.

2. **`extractor.py` writes `selector_manifest.json` to the generator dir** (`_HERE`). Copy it to `project.output_dir` immediately after extraction; store absolute path in `project.manifest_path`.

3. **`GCP_CREDENTIALS_PATH` must always be an absolute path** when stored in config — the generator resolves relative paths from the generator dir, so always store absolute.

4. **HTTP 409 if a project already has a `status='running'` job** — prevent concurrent jobs per project.

5. **`node_modules` check before Playwright run** — if `output_dir/node_modules` doesn't exist, run `npm install` in `output_dir` first (blocking).

6. **`_generate_locators`, `_generate_pages`, `_fix_page_imports`, `_write_static_files`, `_write_barrel` are imported directly from `automation/generator/main.py`** — they are standalone functions with no side effects outside their arguments.

---

## Verification Checklist

1. `uvicorn main:app --port 8001` → starts, creates `dashboard.db`, seeds config rows
2. `npm run dev` (frontend) → opens on port 5174, `/api` proxy works
3. ConfigPage → enter `ANTHROPIC_API_KEY` → save → provider status shows anthropic = green
4. ProjectsPage → Link Folder: `d:\order-management\frontend`, src_subdir=`src` → extract manifest → entity chips appear (Customer, Product, Order, Dashboard, Navigation, Modal)
5. GeneratePage → project selected, e2e, only locators, anthropic → Generate → SSE log streams → files list shows CustomerLocators.js etc.
6. GeneratePage → tests job → upload Excel → SSE log → spec files appear in files list
7. RunsPage → (target app running) → Run Tests → SSE streams Playwright output → test_case_results show per-test pass/fail
8. ConfigPage → upload GCP JSON → `GCP_CREDENTIALS_PATH` set to absolute path → Vertex AI = green
