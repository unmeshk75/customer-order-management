# Customer Order Management

A full-stack application for managing customers, products, and orders — built with QA automation as a first-class concern. Every interactive element has stable `data-testid` and `id` attributes, and the project ships an LLM-powered Playwright test generator.

## Quick Start

### 1. Python environment

```bash
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac / Linux

pip install -r requirements.txt
```

### 2. Node environment

```bash
npm install    # installs for both frontend/ and automation/ workspaces
```

### 3. Run the application

Open two terminals:

```bash
# Terminal 1 — backend
venv\Scripts\activate
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api |
| Swagger UI | http://localhost:8000/docs |

### 4. Run E2E tests

```bash
npm test                  # headless
npm run test:headed       # browser visible
npm run test:ui           # Playwright interactive UI
```

## What It Does

Manage three resources through a React UI backed by a FastAPI REST API:

- **Customers** — name, type (Consumer / SMB / Enterprise), contact details, address
- **Products** — name, type (Basic / Professional / Teams / Ultra-Enterprise), price per seat, stock
- **Orders** — link a customer to one or more products with seat counts; discount and status tracking

## Business Rules

**Product availability by customer type:**

| Customer Type | Allowed Products |
|---|---|
| Consumer | Basic, Professional |
| SMB | Professional, Teams |
| Enterprise | Basic, Teams, Ultra-Enterprise |

**Order constraints:**
- One order → one customer, one or more products
- Each product line requires a seat count (minimum 1)
- Discount is a percentage (0–100) applied to the total
- Availability is enforced on both frontend and backend (HTTP 400 on violation)

**Data integrity:**
- Customer email must be unique
- Products in use cannot be deleted
- Deleting a customer cascades to all their orders

## Project Structure

```
order-management/
├── backend/                 # FastAPI + SQLAlchemy API
├── frontend/                # React 18 + Vite UI
├── automation/              # Playwright E2E tests
│   └── generator/           # LLM-powered test generator CLI
├── package.json             # Root npm workspace config
└── requirements.txt         # Python dependencies (backend + generator)
```

## Sub-folder Guides

| Folder | README |
|---|---|
| `backend/` | [API reference, data models, running the server](backend/README.md) |
| `frontend/` | [Components, test IDs, dev setup](frontend/README.md) |
| `automation/` | [Running tests, Playwright config](automation/README.md) |
| `automation/generator/` | [LLM generator CLI, all providers](automation/generator/README.md) |

For architecture details, internals, and contributor guidance see [DEVELOPERS_GUIDE.md](DEVELOPERS_GUIDE.md).

## Troubleshooting

| Problem | Fix |
|---|---|
| Backend won't start | Activate venv, run `pip install -r requirements.txt` |
| Frontend blank or CORS error | Ensure backend is running on port 8000 |
| Database errors | Delete `backend/app.db` — it recreates on next start |
| `playwright install chromium` fails (SSL / corporate network) | Set `CHROME_PATH` to your system Chrome; the config falls back automatically |
| Playwright can't find elements after UI changes | Re-run `python automation/generator/main.py e2e --only locators` |
| `ImportError: cannot import name 'ToolAnnotations'` | `pip uninstall mcp -y && pip install "mcp>=1.0.0"` |
