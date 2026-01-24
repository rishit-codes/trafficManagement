from fastapi import APIRouter, Body
from typing import List, Dict
from backend.src.green_wave_manager import green_wave_manager

router = APIRouter(prefix="/green-wave", tags=["Green Wave"])

@router.post("/optimize")
async def optimize_corridor(nodes: List[Dict] = Body(...)):
    """
    Calculate dynamic offsets for a list of junctions.
    Payload: [{junction_id: "J001", distance: 0, speed: 40}, ...]
    """
    return green_wave_manager.calculate_offsets(nodes)

@router.get("/status/{corridor_id}")
async def get_corridor_status(corridor_id: str):
    return green_wave_manager.get_corridor_status(corridor_id)
