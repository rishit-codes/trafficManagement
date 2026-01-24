from datetime import datetime
from typing import Dict, List, Optional
import math

class EventModeManager:
    """
    Detects special traffic events and applies appropriate signal profiles.
    Events: Stadium exit, school hours, festivals, rain, accidents.
    """
    
    # Event profiles (timing adjustments)
    EVENT_PROFILES = {
        "STADIUM_EXIT": {
            "description": "Major event ending, high egress traffic",
            "green_time_multiplier": 1.5,  # 50% longer green on exit routes
            "cycle_length": 120,  # longer cycle for high volume
            "duration_minutes": 60,
            "priority_approaches": ["north", "east"]  # away from stadium
        },
        "SCHOOL_HOURS": {
            "description": "School start/end times",
            "pedestrian_green_multiplier": 1.67,  # 15s -> 25s
            "vehicle_speed_limit": 30,  # kmph
            "duration_minutes": 60,
            "active_times": ["07:30-08:30", "14:00-15:00"]
        },
        "RAIN_MODE": {
            "description": "Wet road conditions",
            "yellow_time_multiplier": 1.67,  # 3s -> 5s (longer stopping distance)
            "cycle_length_multiplier": 1.1,  # 10% longer cycles
            "speed_adjustment": 0.8,  # expect 20% slower traffic
            "duration_minutes": "auto"  # until rain stops
        }
    }
    
    def detect_event_type(self, traffic_data: Dict, weather_data: Dict = None,
                         current_time: datetime = None) -> str:
        """
        Analyze conditions to detect active event type.
        """
        if current_time is None:
            current_time = datetime.now()
            
        # 1. School Hours
        if self.is_school_hours(current_time):
            return "SCHOOL_HOURS"
            
        # 2. Stadium Exit (Traffic Spike)
        if traffic_data and self.is_stadium_exit(traffic_data):
            return "STADIUM_EXIT"
            
        # 3. Rain Mode
        if weather_data and self.is_rain_mode(weather_data):
            return "RAIN_MODE"
            
        return "NORMAL"
    
    def apply_event_profile(self, junction_id: str, event_type: str) -> Dict:
        """
        Get signal timing adjustments for the event.
        """
        if event_type not in self.EVENT_PROFILES:
            return {}
        return self.EVENT_PROFILES[event_type]
    
    def is_stadium_exit(self, traffic_data: Dict) -> bool:
        """
        Detect stadium exit pattern:
        - Sudden spike (3x volume in 10 min)
        """
        if 'recent_counts' not in traffic_data:
            return False
            
        recent = traffic_data['recent_counts'] # List of last 10 mins
        if len(recent) < 2:
            return False
            
        current_volume = sum(recent[-2:]) 
        # Hardcoded historical avg for demo
        historical_avg = 150 # vehicles per 10 mins
        
        spike_ratio = current_volume / max(historical_avg, 1)
        
        return spike_ratio > 3.0
    
    def is_school_hours(self, current_time: datetime) -> bool:
        """Check if current time is within school start/end windows."""
        time_str = current_time.strftime("%H:%M")
        
        # Morning School
        if "07:30" <= time_str <= "08:30":
            return True
        # Afternoon School
        if "14:00" <= time_str <= "15:00":
            return True
            
        return False

    def is_rain_mode(self, weather_data: Dict) -> bool:
        return weather_data.get('precipitation', 0) > 0.1 or weather_data.get('condition') == 'Rain'

event_manager = EventModeManager()
