# UrbanMine Twin AI

AI-powered operational digital twin for EV battery and e-waste recycling plants.

Real-time visualization of an industrial recycling facility with thermal hazard prediction, smart material routing, lead extraction revenue tracking, and sustainability analytics.

## Stack

- **Frontend**: React + Vite + TypeScript + TailwindCSS + Pixi.js + Framer Motion + Recharts + Zustand
- **Backend**: FastAPI + WebSockets + scikit-learn
- **Persistence**: SQLite + Parquet
- **Deployment**: Docker + Docker Compose

## Quick Start

```bash
docker compose up --build
```

Frontend: http://localhost:5173
Backend:  http://localhost:8000
WS:       ws://localhost:8000/ws/telemetry

## Architecture

See `docs/ARCHITECTURE.md` for details.

## Modules

1. **Live Digital Twin Dashboard** — animated 2D plant view
2. **AI Hazard Prediction Engine** — thermal runaway detection
3. **Smart Material Routing** — classify and route incoming scrap
4. **Lead Extraction & Revenue Engine** — the money story
5. **Sustainability & Recovery Analytics** — CO₂, landfill, energy
