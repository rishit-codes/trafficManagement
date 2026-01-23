"""
Spillback Detector Module
Monitors queue lengths and detects spillback risks before they cause gridlock.

Spillback occurs when downstream queues grow beyond road storage capacity,
blocking upstream junctions and causing cascading failures.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple, Deque
from enum import Enum
from collections import deque
import time

try:
    from .geometric_database import GeometricDatabase
except ImportError:
    from geometric_database import GeometricDatabase


class SpillbackStatus(Enum):
    """Spillback risk levels."""
    OK = 0               # < 70% occupancy
    WARNING = 1          # 70-85% occupancy
    CRITICAL = 2         # > 85% occupancy
    SPILLBACK = 3        # Queue exceeds storage


@dataclass
class ApproachStatus:
    """Status of a single approach."""
    direction: str
    queue_length: int
    storage_capacity: int
    occupancy_pct: float
    status: SpillbackStatus
    time_to_spillback_s: Optional[float]  # Estimated time until spillback


@dataclass
class JunctionStatus:
    """Complete junction spillback status."""
    junction_id: str
    timestamp: float
    approaches: Dict[str, ApproachStatus]
    overall_status: SpillbackStatus
    recommended_action: str


class SpillbackDetector:
    """
    Monitor queue lengths and detect spillback risks.
    Integrate with signal optimizer to prevent gridlock.
    """
    
    def __init__(self, geo_db: GeometricDatabase):
        """
        Initialize detector with geometric database.
        
        Args:
            geo_db: GeometricDatabase for storage capacity data
        """
        self.geo_db = geo_db
        
        # Load thresholds from config
        thresholds = geo_db.context.get("spillback_prevention", {})
        self.warning_threshold = thresholds.get("warning_occupancy_threshold", 0.70)
        self.critical_threshold = thresholds.get("critical_occupancy_threshold", 0.85)
        
        # Historical data for trend analysis (using deque for efficient O(1) operations)
        self.history: Dict[str, Deque[Tuple[float, int]]] = {}  # {junction_dir: [(timestamp, queue)]}
        self.history_max_len = 12  # Keep last 12 samples (1 min at 5s intervals)
    
    def analyze(
        self,
        junction_id: str,
        queue_lengths: Dict[str, int],  # {direction: vehicles in queue}
        inflow_rates: Optional[Dict[str, float]] = None  # {direction: PCU/hr}
    ) -> JunctionStatus:
        """
        Analyze spillback risk for a junction.
        
        Args:
            junction_id: Junction to analyze
            queue_lengths: Current queue lengths per approach
            inflow_rates: Optional inflow rates for time-to-spillback calc
        
        Returns:
            JunctionStatus with risk assessment
        """
        junction = self.geo_db.get_junction(junction_id)
        if not junction:
            raise ValueError(f"Junction not found: {junction_id}")
        
        approach_statuses = {}
        worst_status = SpillbackStatus.OK
        
        for direction, queue in queue_lengths.items():
            capacity = self.geo_db.get_storage_capacity(junction_id, direction)
            occupancy = queue / capacity if capacity > 0 else 1.0
            
            # Determine status
            if occupancy >= 1.0:
                status = SpillbackStatus.SPILLBACK
            elif occupancy >= self.critical_threshold:
                status = SpillbackStatus.CRITICAL
            elif occupancy >= self.warning_threshold:
                status = SpillbackStatus.WARNING
            else:
                status = SpillbackStatus.OK
            
            # Calculate time to spillback
            tts = None
            if inflow_rates and direction in inflow_rates and status != SpillbackStatus.SPILLBACK:
                inflow = inflow_rates[direction]
                remaining = capacity - queue
                if inflow > 0:
                    tts = (remaining / inflow) * 3600  # Convert to seconds
            
            approach_statuses[direction] = ApproachStatus(
                direction=direction,
                queue_length=queue,
                storage_capacity=capacity,
                occupancy_pct=round(occupancy * 100, 1),
                status=status,
                time_to_spillback_s=tts
            )
            
            # Update worst status
            if status.value > worst_status.value:
                worst_status = status
            
            # Store history (deque automatically handles max length)
            key = f"{junction_id}_{direction}"
            if key not in self.history:
                self.history[key] = deque(maxlen=self.history_max_len)
            self.history[key].append((time.time(), queue))
        
        # Generate recommendation
        action = self._generate_recommendation(approach_statuses, worst_status)
        
        return JunctionStatus(
            junction_id=junction_id,
            timestamp=time.time(),
            approaches=approach_statuses,
            overall_status=worst_status,
            recommended_action=action
        )
    
    def _generate_recommendation(
        self,
        approaches: Dict[str, ApproachStatus],
        overall: SpillbackStatus
    ) -> str:
        """Generate recommended action based on status."""
        if overall == SpillbackStatus.OK:
            return "No action needed"
        
        critical_dirs = [d for d, a in approaches.items() if a.status == SpillbackStatus.CRITICAL]
        spillback_dirs = [d for d, a in approaches.items() if a.status == SpillbackStatus.SPILLBACK]
        
        if spillback_dirs:
            return f"URGENT: Extend green for {', '.join(spillback_dirs)}. Consider blocking upstream."
        elif critical_dirs:
            return f"Extend green for {', '.join(critical_dirs)} by 10-15s"
        else:
            return "Monitor closely, consider extending green"
    
    def get_queue_trend(self, junction_id: str, direction: str) -> str:
        """
        Analyze queue trend from history.
        
        Returns: "INCREASING", "STABLE", or "DECREASING"
        """
        key = f"{junction_id}_{direction}"
        history = self.history.get(key, [])
        
        if len(history) < 3:
            return "STABLE"
        
        # Convert deque to list for slicing
        history_list = list(history)
        recent = [h[1] for h in history_list[-3:]]
        older = [h[1] for h in history_list[:3]]
        
        avg_recent = sum(recent) / len(recent)
        avg_older = sum(older) / len(older)
        
        diff = avg_recent - avg_older
        if diff > 2:
            return "INCREASING"
        elif diff < -2:
            return "DECREASING"
        return "STABLE"
    
    def should_block_upstream(self, junction_id: str, direction: str) -> bool:
        """Check if upstream junction should hold traffic."""
        key = f"{junction_id}_{direction}"
        capacity = self.geo_db.get_storage_capacity(junction_id, direction)
        
        if not self.history.get(key):
            return False
        
        current_queue = self.history[key][-1][1]
        trend = self.get_queue_trend(junction_id, direction)
        
        return current_queue >= capacity * 0.90 and trend == "INCREASING"
    
    def to_dict(self, status: JunctionStatus) -> Dict:
        """Convert status to dictionary for API/frontend."""
        return {
            "junction_id": status.junction_id,
            "timestamp": status.timestamp,
            "overall_status": status.overall_status.name,
            "recommended_action": status.recommended_action,
            "approaches": {
                d: {
                    "queue_length": a.queue_length,
                    "storage_capacity": a.storage_capacity,
                    "occupancy_pct": a.occupancy_pct,
                    "status": a.status.name,
                    "time_to_spillback_s": a.time_to_spillback_s
                }
                for d, a in status.approaches.items()
            }
        }


if __name__ == "__main__":
    from pathlib import Path
    
    base_path = Path(__file__).parent.parent / "config"
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    detector = SpillbackDetector(geo_db)
    
    # Simulate queue data
    sample_queues = {
        "north": 15,
        "south": 12,
        "east": 35,  # High queue
        "west": 8
    }
    
    for jid in geo_db.list_junctions():
        print(f"\n=== Analyzing {jid} ===")
        status = detector.analyze(jid, sample_queues)
        result = detector.to_dict(status)
        
        print(f"Overall: {result['overall_status']}")
        print(f"Action: {result['recommended_action']}")
        for d, a in result['approaches'].items():
            print(f"  {d}: {a['queue_length']}/{a['storage_capacity']} ({a['occupancy_pct']}%) - {a['status']}")
