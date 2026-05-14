"""FastAPI main application — UrbanMine Twin AI Backend."""
from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.ws.manager import ConnectionManager
from app.simulator.plant import PlantSimulator
from app.economics.prices import fetch_live_prices, get_all_prices
from app.ai.hazard_model import get_predictor


# --- Globals ---
plant: PlantSimulator | None = None
ws_manager = ConnectionManager()
sim_task: asyncio.Task | None = None


async def simulation_loop():
    """Main simulation loop — ticks the plant and broadcasts telemetry."""
    global plant
    while True:
        if plant:
            telemetry = plant.tick()
            if ws_manager.client_count > 0:
                await ws_manager.broadcast_json(telemetry.model_dump())
        await asyncio.sleep(0.5)  # 2 Hz tick rate


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan — start simulation on boot."""
    global plant, sim_task

    # Initialize AI model (trains on first run)
    get_predictor()

    # Fetch live prices (falls back to hardcoded)
    await fetch_live_prices()

    # Initialize plant
    plant = PlantSimulator()

    # Start simulation loop
    sim_task = asyncio.create_task(simulation_loop())

    yield

    # Cleanup
    if sim_task:
        sim_task.cancel()
        try:
            await sim_task
        except asyncio.CancelledError:
            pass


# --- App ---
app = FastAPI(
    title="UrbanMine Twin AI",
    description="AI-powered digital twin for EV battery and e-waste recycling",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- REST Endpoints ---

@app.get("/")
async def root():
    return {
        "name": "UrbanMine Twin AI",
        "status": "operational",
        "clients": ws_manager.client_count,
        "tick": plant.tick_count if plant else 0,
    }


@app.get("/api/prices")
async def get_prices():
    """Get current commodity prices."""
    return get_all_prices()


@app.get("/api/plant/status")
async def plant_status():
    """Get current plant status summary."""
    if not plant:
        return {"error": "Plant not initialized"}
    return {
        "tick": plant.tick_count,
        "batteries_in_system": len(plant.batteries),
        "recovery_totals": plant.recovery_totals,
        "revenue_totals": plant.revenue_totals,
        "total_revenue": sum(plant.revenue_totals.values()),
        "hazards_prevented": plant.hazards_prevented,
        "risk_score": plant.plant_risk_score,
    }


@app.post("/api/plant/inject-hazard")
async def inject_hazard():
    """Inject a damaged EV battery for demo purposes."""
    if not plant:
        return {"error": "Plant not initialized"}
    battery_id = plant.inject_hazardous_battery()
    return {"status": "injected", "battery_id": battery_id}


@app.post("/api/plant/reset")
async def reset_plant():
    """Reset the plant simulation."""
    global plant
    plant = PlantSimulator()
    return {"status": "reset", "tick": 0}


@app.get("/api/ai/predict")
async def predict_hazard(temperature: float = 35, voltage: float = 3.7, gas_ppm: float = 5, vibration: float = 3, load: float = 50):
    """Run AI hazard prediction on given sensor values."""
    predictor = get_predictor()
    result = predictor.predict_hazard(temperature, voltage, gas_ppm, vibration, load)
    return result


# --- WebSocket ---

@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    """Real-time telemetry stream."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive, listen for client commands
            data = await websocket.receive_text()
            if data == "inject_hazard":
                if plant:
                    plant.inject_hazardous_battery()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
