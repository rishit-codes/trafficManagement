"""
Webster Optimizer Module
Calculates optimal signal timing using Webster's method with geometry-aware saturation flows.

Webster's Formula:
C_opt = (1.5L + 5) / (1 - Y)

Where:
- C_opt = Optimal cycle length (seconds)
- L = Total lost time per cycle (seconds)
- Y = Sum of critical flow ratios

Green time distribution:
G_i = (y_i / Y) × (C_opt - L)
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from pathlib import Path

# Import sibling modules
try:
    from .geometric_database import GeometricDatabase, Junction
    from .pcu_converter import PCUConverter
except ImportError:
    from geometric_database import GeometricDatabase, Junction
    from pcu_converter import PCUConverter


@dataclass
class PhaseConfig:
    """Configuration for a signal phase."""
    name: str
    approaches: List[str]  # List of directions in this phase
    min_green_s: int = 10
    max_green_s: int = 60


@dataclass
class SignalTiming:
    """Optimized signal timing result."""
    cycle_length: int
    phases: List[Dict]  # [{name, green_s, yellow_s, red_s}]
    total_lost_time: int
    sum_flow_ratios: float
    is_oversaturated: bool
    
    def to_dict(self) -> Dict:
        return {
            "cycle_length_s": self.cycle_length,
            "phases": self.phases,
            "total_lost_time_s": self.total_lost_time,
            "sum_flow_ratios": round(self.sum_flow_ratios, 3),
            "is_oversaturated": self.is_oversaturated
        }


class WebsterOptimizer:
    """
    Calculate optimal signal timing using Webster's method.
    Integrates geometry-aware saturation flows from GeometricDatabase.
    """
    
    # Default timing constraints
    MIN_CYCLE = 30
    MAX_CYCLE = 120
    YELLOW_TIME = 3
    ALL_RED_TIME = 2
    MIN_RED_TIME = 5  # Minimum safe red time
    LOST_TIME_PER_PHASE = 4  # Start-up + clearance
    
    def __init__(self, geo_db: GeometricDatabase):
        """
        Initialize optimizer with geometric database.
        
        Args:
            geo_db: GeometricDatabase instance with junction data
        """
        self.geo_db = geo_db
        self.pcu_converter = PCUConverter()
        
        # Load constraints from context if available
        hcm = geo_db.context.get("hcm_parameters", {})
        self.MIN_CYCLE = hcm.get("min_cycle_length_s", 30)
        self.MAX_CYCLE = hcm.get("max_cycle_length_s", 120)
        self.YELLOW_TIME = hcm.get("yellow_time_s", 3)
        self.ALL_RED_TIME = hcm.get("all_red_time_s", 2)
        self.LOST_TIME_PER_PHASE = hcm.get("lost_time_per_phase_s", 4)
    
    def optimize(
        self,
        junction_id: str,
        live_flows: Dict[str, float],  # {direction: PCU/hr}
        phase_config: Optional[List[PhaseConfig]] = None
    ) -> SignalTiming:
        """
        Calculate optimal signal timing for a junction.
        
        Args:
            junction_id: ID of the junction to optimize
            live_flows: Current traffic flows in PCU/hr per approach
            phase_config: Optional custom phase configuration
        
        Returns:
            SignalTiming object with optimized timing
        """
        junction = self.geo_db.get_junction(junction_id)
        if not junction:
            raise ValueError(f"Junction not found: {junction_id}")
        
        # Use default 2-phase config if not provided
        if phase_config is None:
            phase_config = self._default_phase_config(junction)
        
        # Calculate flow ratios for each phase
        flow_ratios = []
        for phase in phase_config:
            y = self._calculate_phase_flow_ratio(junction_id, phase, live_flows)
            flow_ratios.append(y)
        
        # Sum of critical flow ratios
        Y = sum(flow_ratios)
        
        # Check for oversaturation
        is_oversaturated = Y >= 0.90
        if Y >= 1.0:
            Y = 0.95  # Cap to prevent negative cycle
        
        # Total lost time
        L = len(phase_config) * self.LOST_TIME_PER_PHASE
        
        # Webster's optimal cycle length
        C_opt = (1.5 * L + 5) / (1 - Y)
        
        # Constrain cycle length
        C_opt = max(self.MIN_CYCLE, min(self.MAX_CYCLE, C_opt))
        C_opt = int(round(C_opt))
        
        # Available green time
        available_green = C_opt - L
        
        # Distribute green time proportionally
        phases = []
        for i, phase in enumerate(phase_config):
            if Y > 0:
                green = (flow_ratios[i] / Y) * available_green
            else:
                green = available_green / len(phase_config)
            
            # Constrain green time
            green = max(phase.min_green_s, min(phase.max_green_s, green))
            green = int(round(green))
            
            # Calculate red time and ensure it's safe
            red = C_opt - green - self.YELLOW_TIME
            if red < self.MIN_RED_TIME:
                # Adjust green time to ensure minimum safe red time
                green = C_opt - self.MIN_RED_TIME - self.YELLOW_TIME
                red = self.MIN_RED_TIME
            
            phases.append({
                "name": phase.name,
                "green_s": max(0, green),
                "yellow_s": self.YELLOW_TIME,
                "red_s": max(self.MIN_RED_TIME, red),
                "flow_ratio": round(flow_ratios[i], 3)
            })
        
        return SignalTiming(
            cycle_length=C_opt,
            phases=phases,
            total_lost_time=L,
            sum_flow_ratios=Y,
            is_oversaturated=is_oversaturated
        )
    
    def _calculate_phase_flow_ratio(
        self,
        junction_id: str,
        phase: PhaseConfig,
        live_flows: Dict[str, float]
    ) -> float:
        """
        Calculate critical flow ratio for a phase.
        y = max(q_i / s_i) for all approaches in phase
        """
        max_ratio = 0.0
        for direction in phase.approaches:
            flow = live_flows.get(direction, 0)
            saturation = self.geo_db.get_approach_saturation_flow(junction_id, direction)
            if saturation > 0:
                ratio = flow / saturation
                max_ratio = max(max_ratio, ratio)
        return max_ratio
    
    def _default_phase_config(self, junction: Junction) -> List[PhaseConfig]:
        """Generate default 2-phase config (NS/EW) from junction approaches."""
        ns_approaches = [d for d in junction.approaches.keys() if d in ["north", "south"]]
        ew_approaches = [d for d in junction.approaches.keys() if d in ["east", "west"]]
        
        return [
            PhaseConfig(name="NS", approaches=ns_approaches, min_green_s=15, max_green_s=60),
            PhaseConfig(name="EW", approaches=ew_approaches, min_green_s=15, max_green_s=60),
        ]
    
    def check_spillback_risk(
        self,
        junction_id: str,
        queue_lengths: Dict[str, int]  # {direction: vehicles in queue}
    ) -> Dict[str, str]:
        """
        Check spillback risk for each approach.
        
        Returns:
            Dict with status: "OK", "WARNING", or "CRITICAL"
        """
        results = {}
        thresholds = self.geo_db.context.get("spillback_prevention", {})
        warning_pct = thresholds.get("warning_occupancy_threshold", 0.70)
        critical_pct = thresholds.get("critical_occupancy_threshold", 0.85)
        
        for direction, queue in queue_lengths.items():
            capacity = self.geo_db.get_storage_capacity(junction_id, direction)
            occupancy = queue / capacity if capacity > 0 else 1.0
            
            if occupancy >= critical_pct:
                results[direction] = "CRITICAL"
            elif occupancy >= warning_pct:
                results[direction] = "WARNING"
            else:
                results[direction] = "OK"
        
        return results
    
    def compare_with_fixed(
        self,
        junction_id: str,
        live_flows: Dict[str, float]
    ) -> Dict:
        """Compare optimized timing with current fixed timing."""
        junction = self.geo_db.get_junction(junction_id)
        if not junction:
            return {}
        
        optimized = self.optimize(junction_id, live_flows)
        
        return {
            "fixed": {
                "cycle_length_s": junction.current_cycle_length,
                "phases": junction.phases
            },
            "optimized": optimized.to_dict(),
            "cycle_reduction_s": junction.current_cycle_length - optimized.cycle_length,
            "improvement_potential": "HIGH" if optimized.cycle_length < junction.current_cycle_length * 0.8 else "MODERATE"
        }


if __name__ == "__main__":
    # Test the optimizer
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    optimizer = WebsterOptimizer(geo_db)
    
    # Simulate live traffic flows (PCU/hr)
    sample_flows = {
        "north": 800,
        "south": 750,
        "east": 1200,
        "west": 1100
    }
    
    for jid in geo_db.list_junctions():
        print(f"\n=== Optimizing {jid} ===")
        result = optimizer.optimize(jid, sample_flows)
        print(f"Cycle length: {result.cycle_length}s")
        print(f"Sum of flow ratios (Y): {result.sum_flow_ratios:.3f}")
        print(f"Oversaturated: {result.is_oversaturated}")
        for phase in result.phases:
            print(f"  {phase['name']}: G={phase['green_s']}s, Y={phase['yellow_s']}s (y={phase['flow_ratio']})")
        
        # Compare with fixed
        comparison = optimizer.compare_with_fixed(jid, sample_flows)
        print(f"\nFixed cycle: {comparison['fixed']['cycle_length_s']}s → Optimized: {comparison['optimized']['cycle_length_s']}s")
        print(f"Improvement potential: {comparison['improvement_potential']}")
