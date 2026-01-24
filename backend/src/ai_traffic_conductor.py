from typing import List, Dict
from datetime import datetime
from backend.src.prediction_engine import prediction_engine
from backend.src.event_mode_manager import event_manager
# Optimizer injected at runtime to avoid circular dependency

class AITrafficConductor:
    """
    Master orchestrator that coordinates prediction, events, and learning
    to create proactive, adaptive traffic management.
    """
    
    def __init__(self):
        self.prediction = prediction_engine
        self.events = event_manager
        self.optimizer = None # Injected at runtime
        self.active_events = {} # junction_id -> event_type
        
    def conduct_network(self, junction_ids: List[str]) -> Dict:
        """
        Main orchestration loop - runs periodically for entire network.
        """
        results = {
            "optimizations_applied": 0,
            "predictions_made": 0,
            "events_detected": 0,
            "details": {}
        }
        
        for j_id in junction_ids:
            # 1. Detect Events
            # Mock traffic data for detection - in real app, fetch from store
            mock_traffic = {'recent_counts': [50, 60, 200, 250]} if j_id == 'J001' else {'recent_counts': [50, 50]}
            event = self.events.detect_event_type(mock_traffic)
            self.active_events[j_id] = event
            
            if event != "NORMAL":
                results["events_detected"] += 1
            
            # 2. Prediction
            prediction = self.prediction.predict(j_id, "NORTH")
            
            if prediction.get("predicted_volumes"):
                results["predictions_made"] += 1
                
            # 3. Calculate Optimal Timing
            timing = self._calculate_optimal_timing(j_id, event, prediction)
            
            # 4. Apply (Simulation)
            # here we would send to controller
            if timing: 
                results["optimizations_applied"] += 1
                
            results["details"][j_id] = {
                "event": event,
                "prediction": prediction,
                "timing_action": "UPDATED" if timing else "KEPT"
            }
            
        return results

    def _calculate_optimal_timing(self, junction_id: str, event_type: str, prediction: Dict) -> Dict:
        # Base Webster
        # base = self.optimizer.optimize_junction(junction_id, ...data...) 
        # Using simplified logic for now as optimizer needs real data
        timing = {"green_time": 30} 
        
        # Event Adjustments
        if event_type != "NORMAL":
            profile = self.events.apply_event_profile(junction_id, event_type)
            if profile.get("green_time_multiplier"):
                timing["green_time"] *= profile["green_time_multiplier"]
                
        # Predictive Adjustments (Proactive)
        if prediction.get("recommendation") == "increase_green_time":
             timing["green_time"] += 5
             
        return timing
        
    def get_status(self):
        return {
            "active_mode": "AI_CONDUCTOR",
            "active_events": self.active_events,
            "prediction_engine": "ARIMA-Enabled"
        }

conductor = AITrafficConductor()
