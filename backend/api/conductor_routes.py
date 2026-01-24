from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
from datetime import datetime

from backend.src.ai_traffic_conductor import conductor
from backend.src.prediction_engine import prediction_engine
from backend.src.event_mode_manager import event_manager

router = APIRouter(prefix="/conductor", tags=["AI Traffic Conductor"])

@router.get("/status")
async def get_conductor_status():
    """Get overall status of the AI Conductor system."""
    return conductor.get_status()

@router.post("/predict")
async def predict_traffic(junction_id: str, horizon_minutes: int = 30):
    """Get ARIMA prediction for a specific junction."""
    # Default to NORTH approach for simple demo
    return prediction_engine.predict(junction_id, "NORTH", horizon_minutes)

@router.post("/run-cycle")
async def run_conductor_cycle(junction_ids: List[str]):
    """Manually trigger an orchestration cycle (useful for demo)."""
    return conductor.conduct_network(junction_ids)

@router.post("/simulate-event")
async def simulate_event(junction_id: str, event_type: str):
    """Force an event simulation."""
    event_manager.EVENT_PROFILES # just to ensure filtered
    conductor.active_events[junction_id] = event_type
    return {"status": "success", "message": f"Event {event_type} activated for {junction_id}"}
