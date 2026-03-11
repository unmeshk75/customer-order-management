# Frontend

React 18 single-page application built with Vite. Communicates with the FastAPI backend via Axios.

## Running

```bash
# From project root (node_modules are at root — npm workspaces)
cd frontend
npm run dev          # dev server on http://localhost:5173
npm run build        # production build → dist/
npm run preview      # preview production build
```

Or from project root:
```bash
npm run dev          # delegates to frontend workspace
npm run build
```

Requires the backend running on port 8000 (configured as Vite proxy in `vite.config.js`).

## File Overview

```
frontend/
├── package.json           # Frontend scripts and dependencies
├── vite.config.js         # Vite config + /api proxy to :8000
├── index.html
└── src/
    ├── main.jsx           # Entry point
    ├── App.jsx            # Root component, view routing, shared state
    ├── api.js             # Axios instance (baseURL /api)
    ├── components/
    │   ├── Navigation.jsx       # Top nav bar (Dashboard / Customers / Products / Orders)
    │   ├── Dashboard.jsx        # Summary cards: customers, orders, revenue, low stock
    │   ├── Modal.jsx            # Reusable confirmation modal (delete actions)
    │   ├── CustomerList.jsx     # Customer table with search, expand rows, edit/delete
    │   ├── CustomerForm.jsx     # Create/edit form with dynamic country→state logic
    │   ├── ProductList.jsx      # Product table with type filter, edit/delete
    │   ├── ProductForm.jsx      # Create/edit form
    │   ├── OrderList.jsx        # Order table with filter sidebar, expand rows, edit/delete
    │   └── OrderForm.jsx        # 3-step wizard: customer → products → review
    └── styles/
        └── App.css              # Global styles
```

## Component Details

### Navigation
Top bar with four buttons: Dashboard, Customers, Products, Orders. Active button has `active` class.

### Dashboard
Four summary cards:
- **Customers** — total count + breakdown by type (Consumer / SMB / Enterprise)
- **Orders** — total count + breakdown by status (Active / Completed / Cancelled)
- **Revenue** — total revenue across all orders
- **Low Stock** — products with `stock_quantity < 10`

### CustomerList / CustomerForm
- Search input filters by name in real time
- Expand button shows a detail row with the customer's orders sub-table
- Form has conditional address logic: country = "US" → state dropdown with 50 states; other countries → state field disabled

### ProductList / ProductForm
- Type filter dropdown (All / Basic / Professional / Teams / Ultra-Enterprise)
- Stock quantity field

### OrderList / OrderForm
- Filter sidebar: filter by status and priority using checkboxes; active filters shown as removable chips
- Expand button shows line items (products, seats, subtotals)
- 3-step wizard:
  1. Select customer + set status, priority, discount, notes
  2. Add products (filtered by customer type) + seats
  3. Review summary → Submit

## QA / Test IDs

Every interactive element has both an `id` attribute and a `data-testid` attribute following these patterns:

| Pattern | Example |
|---|---|
| Form inputs | `data-testid="customer-name-input"` |
| Buttons | `data-testid="create-customer-btn"` |
| Dynamic rows | `data-testid="customer-name-{id}"` |
| Nav buttons | `data-testid="nav-customers"` |
| Modal | `data-testid="modal-confirm"` |

See [automation/generator/selector_manifest.json](../automation/generator/selector_manifest.json) for the full list extracted from JSX.

## Dependencies

| Package | Purpose |
|---|---|
| react / react-dom | UI framework |
| axios | HTTP client |
| vite | Build tool + dev server |
| @vitejs/plugin-react | JSX transform |
| @playwright/test | E2E testing (shared via root node_modules) |
