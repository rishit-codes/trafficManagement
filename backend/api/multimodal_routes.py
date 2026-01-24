from fastapi import APIRouter, Body
from typing import Dict
from backend.src.multimodal_harmony import multimodal_engine

router = APIRouter(prefix="/multimodal", tags=["Multi-Modal Harmony"])

@router.get("/status/{junction_id}")
async def get_multimodal_status(junction_id: str):
    """Get current priority status for a junction."""
    return multimodal_engine.get_status(junction_id)

@router.post("/simulate-detection")
async def simulate_multimodal_detection(junction_id: str, data: Dict = Body(...)):
    """
    Simulate incoming vision data to test priority logic.
    Payload: {"vehicles": {"bus": 1}, "pedestrians": {"count": 5}}
    """
    result = multimodal_engine.analyze_frame_data(junction_id, data)
    return {"status": "processed", "intervention": result}
