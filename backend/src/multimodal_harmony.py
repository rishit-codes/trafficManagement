from typing import Dict, List, Optional
from datetime import datetime

class MultiModalEngine:
    """
    Orchestrates priority logic for different modes of transport.
    Focus: Buses (Transit Signal Priority) and Pedestrians (Safety).
    """
    
    def __init__(self):
        self.priority_requests = {} # junction_id -> request_details
        
    def analyze_frame_data(self, junction_id: str, detection_data: Dict) -> Dict:
        """
        Analyze real-time detection data to trigger priority interventions.
        
        Args:
            detection_data: {
                "vehicles": {"bus": 1, "car": 15, "truck": 0},
                "pedestrians": {"count": 8, "vulnerable": 1},
                "emergency": False
            }
        """
        intervention = {
            "active": False,
            "type": None,
            "reason": None,
            "action": None
        }
        
        # 1. Bus Priority (Transit Signal Priority)
        # If bus is detected waiting
        bus_count = detection_data.get("vehicles", {}).get("bus", 0)
        if bus_count > 0:
            intervention = {
                "active": True,
                "type": "BUS_PRIORITY",
                "reason": f"{bus_count} Bus(es) Approaching",
                "action": "EXTEND_GREEN_15S",
                "priority_level": "HIGH"
            }
            
        # 2. Pedestrian Safety (Override Bus if critical)
        peds = detection_data.get("pedestrians", {})
        count = peds.get("count", 0)
        vulnerable = peds.get("vulnerable", 0)
        
        if count > 10 or vulnerable > 0:
            # Safety trumps transit efficiency
            intervention = {
                "active": True,
                "type": "PEDESTRIAN_SAFETY",
                "reason": f"High Pedestrian Volume ({count})",
                "action": "EXTEND_WALK_TIME",
                "priority_level": "CRITICAL"
            }
            if vulnerable > 0:
                intervention["reason"] = "Vulnerable Pedestrian Detected"
                
        # Store for API access
        self.priority_requests[junction_id] = intervention
        return intervention

    def get_status(self, junction_id: str) -> Dict:
        return self.priority_requests.get(junction_id, {
            "active": False, "type": "NORMAL", "reason": "No Priority Traffic"
        })

# Global Instance
multimodal_engine = MultiModalEngine()
