# Dashboard Frontend

React + Vite frontend for the Test Generator Web Dashboard.

## Setup

1. `npm install`
2. `npm run dev`

The dev server will run on port `5174` and automatically proxy `/api` requests to the FastAPI backend running on `8001`.

## Structure

- `src/api.js` - Axios API client and Server-Sent Events stream managers
- `src/App.jsx` - Root layout and Router configuration
- `src/pages/` - UI views for the application (Projects, Generate, Runs, Config)
