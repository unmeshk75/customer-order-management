# Frontend

React 18 single-page application built with Vite. Communicates with the FastAPI backend via Axios.

## Running

```bash
# From the project root (node_modules are shared via npm workspaces)
npm run dev          # dev server → http://localhost:5173
npm run build        # production build → dist/
npm run preview      # preview production build locally
```

Or directly from this folder:

```bash
cd frontend
npm run dev
```

Requires the backend running on port 8000. Vite proxies all `/api/*` requests to `http://localhost:8000` automatically.

## File Overview

```
frontend/
├── package.json           # Scripts and dependencies
├── vite.config.js         # Dev server + /api proxy to :8000
├── index.html
└── src/
    ├── main.jsx                # Entry point
    ├── App.jsx                 # Root component, view routing, shared state
    ├── api.js                  # Axios instance (baseURL: /api)
    └── components/
        ├── Navigation.jsx      # Top nav (Dashboard / Customers / Products / Orders)
        ├── Dashboard.jsx       # Summary cards: customers, orders, revenue, low stock
        ├── Modal.jsx           # Reusable confirmation modal (delete actions)
        ├── CustomerList.jsx    # Customer table: search, expand rows, edit/delete
        ├── CustomerForm.jsx    # Create/edit form with dynamic country→state logic
        ├── ProductList.jsx     # Product table with type filter, edit/delete
        ├── ProductForm.jsx     # Create/edit form
        ├── OrderList.jsx       # Order table with filter sidebar, expand rows, edit/delete
        └── OrderForm.jsx       # 3-step wizard: customer → products → review
```

## Component Details

### Navigation
Top bar with four buttons: Dashboard, Customers, Products, Orders. The active button has the `active` class.

### Dashboard
Four summary cards:
- **Customers** — total count + breakdown by type (Consumer / SMB / Enterprise)
- **Orders** — total count + breakdown by status (Active / Completed / Cancelled)
- **Revenue** — total across all orders
- **Low Stock** — products with `stock_quantity < 10`

### CustomerList / CustomerForm
- Search input filters by name in real time
- Expand button shows a detail row with the customer's orders sub-table
- Conditional address logic: country = `US` → state dropdown with all 50 US states; any other country → state field disabled

### ProductList / ProductForm
- Type filter dropdown (All / Basic / Professional / Teams / Ultra-Enterprise)
- Stock quantity field; products in use cannot be deleted

### OrderList / OrderForm
- Filter sidebar with status and priority checkboxes; active filters shown as removable chips
- Expand button shows product line items (seats, subtotals)
- 3-step creation wizard:
  1. Select customer + set status, priority, discount, notes
  2. Add products (filtered by customer type) + seat counts
  3. Review summary → Submit

## Test ID Conventions

Every interactive element has both an `id` attribute and a `data-testid` attribute:

| Pattern | Example |
|---|---|
| Form inputs | `data-testid="customer-name-input"` |
| Action buttons | `data-testid="create-customer-btn"` |
| Dynamic row cells | `data-testid="customer-name-{id}"` |
| Navigation buttons | `data-testid="nav-customers"` |
| Modal confirm | `data-testid="modal-confirm"` |

The full naming scheme is `{entity}-{element}[-{id}]` (e.g. `product-price-input`, `edit-order-42`). The LLM generator reads these attributes directly from JSX source — see [automation/generator/README.md](../automation/generator/README.md).

## Dependencies

| Package | Purpose |
|---|---|
| react / react-dom | UI framework |
| axios | HTTP client |
| vite | Build tool + dev server |
| @vitejs/plugin-react | JSX transform |
