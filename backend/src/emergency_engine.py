from typing import List, Dict
from datetime import datetime
# Controller injected at runtime

class EmergencyEngine:
    """
    Manages high-priority overrides for emergency vehicles.
    Implements cascading green waves for cleared paths.
    """
    
    def __init__(self):
        self.active_emergencies = {} # ambulance_id -> route_details
        self.controller = None # Injected at runtime
        
    def trigger_emergency(self, ambulance_id: str, route: List[str], current_junction_index: int = 0) -> Dict:
        """
        Activate emergency path clearing.
        
        Args:
            ambulance_id: Unique ID of the vehicle
            route: List of junction IDs in order
            current_junction_index: Where the ambulance is currently
        """
        if not route:
            return {"status": "error", "message": "No route provided"}
            
        # 1. Immediate Override for Current Junction
        current_jid = route[current_junction_index]
        # Assuming ambulance is approaching from a known direction, or just force ALL RED then GREEN
        # For prototype simplicity: Force North-South Green (Assumption) or use specific API
        self.controller.trigger_emergency_preemption(current_jid, "NS") 
        
        # 2. Pre-clear Next Junction (Cascade)
        next_actions = []
        if current_junction_index + 1 < len(route):
            next_jid = route[current_junction_index + 1]
            # In a real system, we'd schedule this. Here we mark it as "PRE-WARNED"
            next_actions.append(f"Pre-warning {next_jid}")
            
        self.active_emergencies[ambulance_id] = {
            "route": route,
            "current_index": current_junction_index,
            "status": "ACTIVE",
            "timestamp": datetime.now().isoformat()
        }
        
        return {
            "status": "active", 
            "overridden_junction": current_jid,
            "cascade_plan": next_actions
        }

    def clear_emergency(self, ambulance_id: str):
        if ambulance_id in self.active_emergencies:
            del self.active_emergencies[ambulance_id]
            return {"status": "cleared"}
        return {"status": "not_found"}

    def get_status(self):
        return {
            "active_count": len(self.active_emergencies),
            "emergencies": self.active_emergencies
        }

emergency_engine = EmergencyEngine()
