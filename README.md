# HomeGuardian AI

The Autonomous Home Purchase & Lifecycle Intelligence Agent.

## What's in this folder

```
HomeGuardian_AI_Project/
├── frontend/
│   ├── index.html       → Landing page (product overview, agents, sample report preview)
│   └── dashboard.html    → Full Home Intelligence Report (dashboard mockup)
├── backend/
│   ├── server.js          → Express API entry point
│   ├── agents.js           → The 8-agent orchestration pipeline (mock logic, real-AI swap points documented)
│   ├── routes/api.js       → REST routes
│   └── README.md           → Backend setup + API reference
├── docs/
│   └── HomeGuardian_AI_PRD.docx   → Full Product Requirements Document
├── assets/               → Reserved for future images/exports
└── README.md
```

## How to run the frontend

No build step required — it's plain HTML/CSS.

1. Unzip the project folder.
2. Open `frontend/index.html` directly in any browser, **or**
3. Serve it locally for the full experience (recommended, avoids any local file restrictions):
   ```
   cd frontend
   python3 -m http.server 8000
   ```
   Then visit `http://localhost:8000` in your browser.

You can also drag the whole `frontend/` folder into any static hosting service (Netlify, Vercel, GitHub Pages, Cloudflare Pages) to deploy it live — no configuration needed.

## How to run the backend

```cmd
cd backend
npm install
npm start
```
Runs at `http://localhost:4000`. See `backend/README.md` for the full API reference, example requests, and how to connect it to the frontend (currently the frontend uses static placeholder data — wiring it to this API is a small `fetch()` change documented there).

## Design system

- **Palette:** deep ink navy (`#12222E`), blueprint blue (`#2C5F7C`), brass/amber accent (`#C08A3E`), paper (`#F1F3EF`), risk red (`#B14A3D`).
- **Typography:** Fraunces (display/serif headings), Inter (body/UI), IBM Plex Mono (data, labels, annotations) — evoking architectural blueprint annotation.
- **Signature element:** the blueprint house cross-section with live score annotations on the landing page hero.

## Pages

- **`index.html`** — Marketing/overview page: hero, problem framing, the 8-agent system, and a condensed report preview.
- **`dashboard.html`** — The actual Home Intelligence Report a buyer would see: Home Health Score, system-by-system breakdown, repair priority table, 5-year cost forecast, negotiation brief, and vendor matches.

## Next steps for a working product

This ships with a working mock backend and a static frontend. To make it fully live end-to-end:
1. Connect the frontend upload flow to `POST /api/upload` and `POST /api/analyze`.
2. Replace mock agent logic in `backend/agents.js` with real models/APIs (swap points documented inline).
3. Replace static dashboard values in `frontend/dashboard.html` with a `fetch()` call to the backend (see `backend/README.md`).
4. Add a database (reports currently live in memory), auth, and PDF export.

See `docs/HomeGuardian_AI_PRD.docx` for full product scope, architecture, and phased roadmap.
