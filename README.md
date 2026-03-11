# Customer Order Management

A full-stack application for managing customers, products, and orders. Built with QA automation in mind — every element has stable `id` and `data-testid` attributes, and the project includes an LLM-powered Playwright test generator.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy, SQLite, Pydantic |
| Frontend | React 18, Vite, Axios |
| E2E Testing | Playwright (Node) |
| Test Generator | Python, Anthropic Claude API / Claude Code CLI |

## Project Structure

```
customer_order_management/
├── backend/               # FastAPI + SQLAlchemy API
├── frontend/              # React 18 + Vite UI
├── automation/            # Playwright tests + LLM generator
├── docs/                  # Additional documentation
├── venv/                  # Shared Python virtual environment
├── node_modules/          # Shared Node modules (npm workspaces)
├── package.json           # Root npm workspace config
└── requirements.txt       # Combined Python dependencies
```

## Quick Start

### 1. Python (backend + generator)

```bash
# From project root
python -m venv venv            # skip if present
venv/Scripts/activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
```

### 2. Node (frontend + Playwright)

```bash
# From project root
npm install                    # installs for both frontend/ and automation/
```

### 3. Run the application

```bash
# Terminal 1 — backend
venv/Scripts/activate
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — frontend
cd frontend
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:8000
- API docs (Swagger): http://localhost:8000/docs

### 4. Run E2E tests

```bash
# From project root
npm test                        # headless
npm run test:headed             # with browser visible
npm run test:ui                 # Playwright UI mode
```

Refer to [automation](automation) for further docs on testing.

## Business Rules

**Customer types and allowed products:**

| Customer Type | Allowed Products |
|---|---|
| Consumer | Basic, Professional |
| SMB | Professional, Teams |
| Enterprise | Basic, Teams, Ultra-Enterprise |

**Order rules:**
- One order → one customer, many products
- Each product line has a seat count (minimum 1)
- Product availability is validated on both frontend and backend
- Discount is a percentage (0–100) applied to the order total

**Data constraints:**
- Customer email must be unique
- Products cannot be deleted if referenced in existing orders
- Deleting a customer cascades to all their orders

## API Overview

| Resource | Endpoints |
|---|---|
| Customers | `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/{id}` |
| Products | `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}` |
| Orders | `GET/POST /api/orders`, `GET/PUT/DELETE /api/orders/{id}` |
| Utilities | `GET /api/products/available/{customer_type}`, `GET /api/health` |
| Dashboard | `GET /api/dashboard` |

See [backend/README.md](backend/README.md) for full request/response schemas.

## Sub-project READMEs

- [backend/README.md](backend/README.md) — API details, models, running the server
- [frontend/README.md](frontend/README.md) — Components, scripts, dev setup
- [automation/README.md](automation/README.md) — Running tests, Playwright config
- [automation/generator/README.md](automation/generator/README.md) — LLM test generator CLI

## Troubleshooting

| Problem | Fix |
|---|---|
| Backend won't start | Activate venv, run `pip install -r requirements.txt` |
| Frontend blank/error | Ensure backend is on port 8000; check CORS |
| Database errors | Delete `backend/app.db` — it recreates automatically |
| Playwright can't find elements | Regenerate locators: `python automation/generator/main.py e2e --only locators` |
