"""Event system for plant operations."""
from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class PlantEvent:
    message: str
    severity: str = "info"  # info, warning, hazard, success, revenue
    station: Optional[str] = None
    battery_id: Optional[str] = None
    timestamp: float = field(default_factory=time.time)

    def to_log_string(self) -> str:
        ts = time.strftime("%H:%M:%S", time.localtime(self.timestamp))
        prefix = {
            "info": "ℹ️",
            "warning": "⚠️",
            "hazard": "🔴",
            "success": "✅",
            "revenue": "💰",
        }.get(self.severity, "•")
        return f"[{ts}] {prefix} {self.message}"


class EventBus:
    """Simple event bus for plant-wide communication."""

    def __init__(self, max_history: int = 50):
        self.history: list[PlantEvent] = []
        self.max_history = max_history

    def emit(self, message: str, severity: str = "info", station: str | None = None, battery_id: str | None = None):
        event = PlantEvent(message=message, severity=severity, station=station, battery_id=battery_id)
        self.history.append(event)
        if len(self.history) > self.max_history:
            self.history = self.history[-self.max_history:]
        return event

    def recent(self, n: int = 10) -> list[str]:
        return [e.to_log_string() for e in self.history[-n:]]

    def clear(self):
        self.history.clear()
