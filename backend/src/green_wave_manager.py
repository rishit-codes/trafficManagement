from typing import List, Dict
from dataclasses import dataclass

@dataclass
class CorridorNode:
    junction_id: str
    distance_to_next: float # meters
    avg_speed: float # km/h (real-time)

class GreenWaveManager:
    """
    Calculates dynamic signal offsets to create a 'Green Wave'.
    Adapts to real-time traffic speed.
    """
    
    def calculate_offsets(self, nodes: List[Dict]) -> List[Dict]:
        """
        Calculate offsets for a sequence of junctions.
        
        Args:
            nodes: List of {junction_id, distance, speed}
            
        Returns:
            List of {junction_id, offset_seconds, recommended_green}
        """
        offsets = []
        cumulative_time = 0.0
        
        for i, node in enumerate(nodes):
            # First junction is the start (offset 0)
            if i == 0:
                offsets.append({
                    "junction_id": node["junction_id"],
                    "offset_seconds": 0,
                    "progression_speed": node.get("speed", 40)
                })
                continue
                
            # Previous segment data
            prev_node = nodes[i-1]
            distance = prev_node.get("distance", 500) # Default 500m
            speed_kmh = prev_node.get("speed", 40)    # Default 40km/h
            
            # Helper: Avoid divide by zero
            speed_ms = max(speed_kmh, 5) * (5/18) 
            
            travel_time = distance / speed_ms
            cumulative_time += travel_time
            
            offsets.append({
                "junction_id": node["junction_id"],
                "offset_seconds": int(cumulative_time),
                "travel_time_from_prev": int(travel_time),
                "progression_speed": speed_kmh
            })
            
        return offsets

    def get_corridor_status(self, corridor_id: str) -> Dict:
        # Mock status for demo
        return {
            "id": corridor_id,
            "active": True,
            "sync_health": "OPTIMAL",
            "efficiency": "12% Faster"
        }

green_wave_manager = GreenWaveManager()
