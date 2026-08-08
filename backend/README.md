# HomeGuardian AI — Backend

A Node.js/Express API implementing the 8-agent orchestration pipeline described in the PRD.
Agent logic is currently **mock/rule-based** (deterministic, no external AI calls) so the
whole API runs standalone with zero API keys — see `agents.js` for where to plug in real models.

## Setup

```cmd
cd backend
npm install
npm start
```

Server runs at `http://localhost:4000`.

For auto-restart on file changes during development:
```cmd
npm run dev
```

## Folder structure

```
backend/
├── server.js          → Express app entry point
├── agents.js           → The 8 agents + orchestrator (mock logic, swap-in points documented)
├── routes/
│   └── api.js           → REST routes
├── uploads/             → Uploaded property photos/video land here
└── package.json
```

## API reference

| Method | Route | Description |
|---|---|---|
| GET | `/` | Health check + endpoint list |
| POST | `/api/upload` | Upload photos/video/docs (`multipart/form-data`, field name `files`) |
| POST | `/api/analyze` | Runs full orchestration → returns Home Intelligence Report |
| GET | `/api/reports/:id` | Fetch a previously generated report |
| GET | `/api/reports/:id/health` | Poll the live Home Health Score |
| POST | `/api/agents/vision-inspection` | Call the Vision Inspection agent directly |
| POST | `/api/agents/structural-risk` | Call the Structural Risk agent directly |
| POST | `/api/agents/property-health` | Call the Property Health agent directly |
| POST | `/api/agents/cost-intelligence` | Call the Cost Intelligence agent directly |
| POST | `/api/agents/vendor-intelligence` | Call the Vendor Intelligence agent directly |

## Example: run the full pipeline

```cmd
curl -X POST http://localhost:4000/api/analyze ^
  -H "Content-Type: application/json" ^
  -d "{\"address\":\"1418 Alder Court\",\"budgetCap\":10000}"
```

Response shape (trimmed):
```json
{
  "reportId": "…",
  "homeHealthScore": 80,
  "systemScores": { "roof": 82, "structure": 76, "plumbing": 82, "electrical": 72, "hvac": 88, "exterior": 79 },
  "visionInspection": { "defects": [...] },
  "structuralRisk": { "risks": [...] },
  "costForecast": { "items": [...], "fiveYearForecast": [...], "totalFiveYear": 18200 },
  "maintenancePlan": [...],
  "negotiationBrief": { "leveragePoints": [...], "totalLeverage": 11900 },
  "vendorMatches": [...],
  "repairPriority": [...]
}
```

This matches the data shape the `frontend/dashboard.html` mockup already displays with static
placeholder values — connecting the two just means having the frontend `fetch()` this endpoint
instead of using hardcoded numbers (see "Connecting frontend to backend" below).

## Connecting the frontend to this backend

The frontend is currently static HTML with placeholder data. To wire it up:

```js
// In dashboard.html, replace the static values with a fetch on page load:
fetch('http://localhost:4000/api/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: '1418 Alder Court', budgetCap: 10000 })
})
  .then(res => res.json())
  .then(report => {
    // populate the score ring, KPI cards, bar chart, tables, etc. from `report`
  });
```

You'll also need to enable CORS for your frontend's origin (already enabled for all origins
via the `cors` package — restrict this in production).

## Moving from mock to real AI agents

Each function in `agents.js` has a docstring at the top of the file describing what to swap in.
In short:
- **Vision Inspection** → send uploaded images to a vision-capable model (e.g. Claude with image input) for defect classification.
- **Structural Risk** → replace heuristics with a trained model or an LLM reasoning step over the vision findings.
- **Cost Intelligence** → connect to a real regional cost-estimation dataset/API.
- **Vendor Intelligence** → connect to a contractor directory / quote API.
- All others can be implemented as LLM calls with the same input/output shape, so `routes/api.js` doesn't need to change.

## Notes

- Reports are stored in-memory (`Map`) for this prototype — swap in a real database (Postgres, MongoDB, etc.) for persistence across server restarts.
- No authentication is implemented — add before deploying publicly.
