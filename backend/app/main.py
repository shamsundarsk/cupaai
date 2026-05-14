"""FastAPI entrypoint and WebSocket gateway for UrbanMine Twin AI."""

from __future__ import annotations

import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import Set

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .simulator import PlantSimulator, TICK_DT

log = logging.getLogger("urbanmine")
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(name)s %(message)s")


simulator = PlantSimulator()
clients: Set[WebSocket] = set()


@asynccontextmanager
async def lifespan(app: FastAPI):
    sim_task = asyncio.create_task(simulator.run_forever(), name="simulator")
    bcast_task = asyncio.create_task(_broadcast_loop(), name="broadcast")
    log.info("UrbanMine Twin AI backend started.")
    try:
        yield
    finally:
        sim_task.cancel()
        bcast_task.cancel()
        for t in (sim_task, bcast_task):
            try:
                await t
            except asyncio.CancelledError:
                pass


app = FastAPI(
    title="UrbanMine Twin AI",
    version="1.0.0",
    description="AI-powered operational digital twin for EV battery & e-waste recycling.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
# REST endpoints                                                              #
# --------------------------------------------------------------------------- #
@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok", "tick": simulator.tick, "tokens": len(simulator.tokens)}


@app.get("/api/snapshot")
async def snapshot() -> JSONResponse:
    return JSONResponse(simulator.snapshot().model_dump())


@app.get("/api/plant")
async def plant() -> JSONResponse:
    snap = simulator.snapshot()
    # Static-ish topology view useful for the floor map renderer.
    return JSONResponse({
        "nodes": [n.model_dump() for n in snap.nodes],
        "conveyors": snap.conveyors,
        "isolation_node_id": snap.isolation_node_id,
    })


# --------------------------------------------------------------------------- #
# WebSocket gateway                                                           #
# --------------------------------------------------------------------------- #
@app.websocket("/ws/twin")
async def twin_ws(ws: WebSocket) -> None:
    await ws.accept()
    clients.add(ws)
    log.info("client connected (%d total)", len(clients))
    try:
        # Send an initial snapshot immediately for fast first paint.
        await ws.send_text(simulator.snapshot().model_dump_json())
        while True:
            # We don't need to receive anything, but keep the channel open.
            try:
                await asyncio.wait_for(ws.receive_text(), timeout=60)
            except asyncio.TimeoutError:
                # heartbeat ping
                try:
                    await ws.send_text(json.dumps({"type": "ping"}))
                except Exception:
                    break
    except WebSocketDisconnect:
        pass
    finally:
        clients.discard(ws)
        log.info("client disconnected (%d total)", len(clients))


async def _broadcast_loop() -> None:
    """Push a fresh snapshot to all clients on every simulator tick."""
    # Run a touch slower than the simulator tick to coalesce updates.
    interval = max(TICK_DT, 0.25)
    while True:
        try:
            payload = simulator.snapshot().model_dump_json()
            stale: list[WebSocket] = []
            for ws in list(clients):
                try:
                    await ws.send_text(payload)
                except Exception:
                    stale.append(ws)
            for ws in stale:
                clients.discard(ws)
        except Exception as exc:  # pragma: no cover
            log.warning("broadcast error: %s", exc)
        await asyncio.sleep(interval)
