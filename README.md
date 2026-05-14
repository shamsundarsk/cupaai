# UrbanMine Twin AI

**AI-Powered Operational Digital Twin for EV Battery & E-Waste Recycling Plants.**

UrbanMine Twin AI is a real-time industrial digital twin that mirrors the
operational workflow of an EV battery and e-waste recycling plant. It streams
simulated IoT telemetry, predicts thermal and machine hazards with an
AI engine, tracks materials through every operational stage, and reports
sustainability metrics live.

> The platform is an industrial command center for the future circular EV
> economy, not a generic dashboard.

---

## Architecture

```
 Python Sensor Generators
         ↓
   FastAPI Backend  ──►  AI Hazard Engine
         ↓
   WebSocket Stream
         ↓
   React + Tailwind
         ↓
 Live Operational Twin UI
```

| Layer        | Technology                       |
| ------------ | -------------------------------- |
| Frontend     | React 18 + Vite + TailwindCSS    |
| Animation    | Framer Motion                    |
| Charts       | Recharts                         |
| Backend      | FastAPI + Uvicorn                |
| Streaming    | Native WebSockets                |
| AI / ML      | scikit-learn (IsolationForest)   |
| Container    | Docker / docker-compose          |

---

## Project layout

```
coupai/
├── backend/                FastAPI + simulator + AI engine
│   ├── app/
│   │   ├── main.py             FastAPI + WebSocket gateway
│   │   ├── simulator.py        State-driven plant simulator
│   │   ├── hazard_engine.py    AI hazard detection
│   │   ├── plant_config.py     Plant topology + workflow nodes
│   │   └── models.py           Pydantic models
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/               React + Tailwind + Framer Motion
│   ├── src/
│   │   ├── pages/              Dashboard, Hazards, Recovery, ...
│   │   ├── components/         Plant map, tokens, alert panel, ...
│   │   ├── store/              WebSocket store
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

---

## Run locally (without Docker)

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

The frontend connects to `ws://localhost:8000/ws/twin` for the live
operational twin stream.

## Run with Docker

```bash
docker compose up --build
```

- Frontend → http://localhost:5173
- Backend  → http://localhost:8000

---

## The operational loop

1. Damaged EV batteries and mixed e-waste enter the **Intake** node.
2. Each item becomes a live **material token** with its own telemetry.
3. AI classifies it and queues it for **Inspection**.
4. The hazard engine watches temperature, voltage, gas level, vibration.
5. If the risk score crosses the threshold the token is **rerouted to
   isolation**, the hazard zone flashes red, and an alert fires.
6. Safe items continue through **Dismantling → Shredder → Separation →
   Recovery** (lead furnace, lithium / cobalt / copper recovery, plastic
   recycling).
7. Recovery counters and sustainability metrics recalculate live.

Materials only move when processing completes, the next node is free, and
the conveyor route is clear. The twin is **state-driven**, not time-scripted.

---

## Demo story

1. Battery `EV-482` enters the plant.
2. Inspection telemetry shows temperature climbing past 70 °C.
3. Risk score crosses 80%. Hazard zone goes red.
4. Battery rerouted to isolation, alert raised, event logged.
5. Other materials continue uninterrupted.
6. Lead, lithium, copper, cobalt and plastic recovery counters tick up.
7. Sustainability panel shows carbon saved and landfill diverted growing
   in real time.
