from fastapi import APIRouter, Body
from typing import List, Dict
from backend.src.emergency_engine import emergency_engine

router = APIRouter(prefix="/emergency", tags=["Emergency Response"])

@router.post("/trigger")
async def trigger_emergency(
    ambulance_id: str = Body(..., embed=True),
    route: List[str] = Body(..., embed=True)
):
    """
    Trigger an emergency override for a specific route.
    """
    return emergency_engine.trigger_emergency(ambulance_id, route)

@router.post("/clear")
async def clear_emergency(ambulance_id: str = Body(..., embed=True)):
    return emergency_engine.clear_emergency(ambulance_id)

@router.get("/status")
async def get_emergency_status():
    return emergency_engine.get_status()
