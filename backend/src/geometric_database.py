"""
Geometric Database Module
Loads junction geometry data and calculates saturation flow factors using HCM methods.

HCM (Highway Capacity Manual) formulas:
s_geom = s₀ × N × fw × fHV × fT

Where:
- s₀ = Base saturation flow (1900 PCU/hr/lane)
- N = Number of lanes
- fw = Lane width adjustment factor
- fHV = Heavy vehicle adjustment factor  
- fT = Turn radius adjustment factor
"""

import json
from pathlib import Path
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

# HCM Base Constants
BASE_SATURATION_FLOW = 1900  # PCU/hr/lane


@dataclass
class ApproachGeometry:
    """Geometry data for a single approach to a junction."""
    direction: str
    lanes: int
    width_m: float
    turn_radius_m: float
    storage_length_m: float
    heavy_vehicle_pct: float
    
    # Calculated values (populated after init)
    fw: float = 1.0  # Lane width factor
    fHV: float = 1.0  # Heavy vehicle factor
    fT: float = 1.0   # Turn radius factor
    saturation_flow: float = 0.0


@dataclass 
class Junction:
    """Complete junction data with all approaches."""
    id: str
    name: str
    lat: float
    lon: float
    approaches: Dict[str, ApproachGeometry]
    current_cycle_length: int
    phases: List[Dict]


class GeometricDatabase:
    """
    Load and manage junction geometry data.
    Calculate HCM saturation flow factors for each approach.
    """
    
    def __init__(self, junction_config_path: str, context_config_path: str):
        """
        Initialize database with config files.
        
        Args:
            junction_config_path: Path to junction_config.json
            context_config_path: Path to vadodara_context.json
        """
        self.junctions: Dict[str, Junction] = {}
        self.context = {}
        
        self._load_context(context_config_path)
        self._load_junctions(junction_config_path)
    
    def _load_context(self, path: str) -> None:
        """Load city context and HCM parameters."""
        try:
            with open(path, 'r') as f:
                self.context = json.load(f)
        except FileNotFoundError:
            print(f"Warning: Context file not found: {path}, using defaults")
            self.context = {"hcm_parameters": {"base_saturation_flow": BASE_SATURATION_FLOW}}
        except json.JSONDecodeError as e:
            print(f"Warning: Invalid JSON in context file: {e}, using defaults")
            self.context = {"hcm_parameters": {"base_saturation_flow": BASE_SATURATION_FLOW}}
    
    def _load_junctions(self, path: str) -> None:
        """Load junction geometry and calculate factors."""
        try:
            with open(path, 'r') as f:
                data = json.load(f)
        except FileNotFoundError:
            raise FileNotFoundError(
                f"CRITICAL: Junction config not found: {path}. "
                f"This file is required for system operation."
            )
        except json.JSONDecodeError as e:
            raise ValueError(f"CRITICAL: Invalid JSON in junction config: {e}")
        
        for junc_key, junc_data in data.get("junctions", {}).items():
            approaches = {}
            for direction, approach_data in junc_data.get("approaches", {}).items():
                approach = ApproachGeometry(
                    direction=direction,
                    lanes=approach_data["lanes"],
                    width_m=approach_data["width_m"],
                    turn_radius_m=approach_data["turn_radius_m"],
                    storage_length_m=approach_data["storage_length_m"],
                    heavy_vehicle_pct=approach_data["heavy_vehicle_pct"]
                )
                # Calculate HCM factors
                self._calculate_factors(approach)
                approaches[direction] = approach
            
            timing = junc_data.get("current_timing", {})
            junction = Junction(
                id=junc_data["id"],
                name=junc_data["name"],
                lat=junc_data["coordinates"]["lat"],
                lon=junc_data["coordinates"]["lon"],
                approaches=approaches,
                current_cycle_length=timing.get("cycle_length_s", 120),
                phases=timing.get("phases", [])
            )
            self.junctions[junc_data["id"]] = junction
    
    def _calculate_factors(self, approach: ApproachGeometry) -> None:
        """Calculate HCM adjustment factors for an approach."""
        # Lane width factor (fw)
        approach.fw = self._lane_width_factor(approach.width_m)
        
        # Heavy vehicle factor (fHV)
        approach.fHV = self._heavy_vehicle_factor(approach.heavy_vehicle_pct)
        
        # Turn radius factor (fT)
        approach.fT = self._turn_radius_factor(approach.turn_radius_m)
        
        # Calculate saturation flow
        base = self.context.get("hcm_parameters", {}).get("base_saturation_flow", BASE_SATURATION_FLOW)
        approach.saturation_flow = (
            base * approach.lanes * approach.fw * approach.fHV * approach.fT
        )
    
    def _lane_width_factor(self, width_m: float) -> float:
        """
        Calculate lane width adjustment factor.
        Based on HCM Exhibit 19-13.
        """
        if width_m >= 3.65:
            return 1.00
        elif width_m >= 3.35:
            return 0.96
        elif width_m >= 3.05:
            return 0.91
        elif width_m >= 2.75:
            return 0.86
        else:
            return 0.81
    
    def _heavy_vehicle_factor(self, heavy_pct: float) -> float:
        """
        Calculate heavy vehicle adjustment factor.
        fHV = 1 / [1 + PHV(ET - 1)]
        ET = 2.5 (passenger car equivalent for heavy vehicles)
        """
        ET = 2.5
        return 1.0 / (1.0 + heavy_pct * (ET - 1.0))
    
    def _turn_radius_factor(self, radius_m: float) -> float:
        """
        Calculate turn radius adjustment factor.
        Tighter turns = slower vehicles = lower capacity.
        """
        if radius_m >= 15:
            return 0.95
        elif radius_m >= 12:
            return 0.92
        elif radius_m >= 10:
            return 0.90
        elif radius_m >= 8:
            return 0.87
        elif radius_m >= 6:
            return 0.85
        else:
            return 0.80
    
    def get_junction(self, junction_id: str) -> Optional[Junction]:
        """Get junction by ID."""
        return self.junctions.get(junction_id)
    
    def get_approach_saturation_flow(self, junction_id: str, direction: str) -> float:
        """Get saturation flow for specific approach."""
        junction = self.junctions.get(junction_id)
        if junction and direction in junction.approaches:
            return junction.approaches[direction].saturation_flow
        return BASE_SATURATION_FLOW  # Default fallback
    
    def get_storage_capacity(self, junction_id: str, direction: str) -> int:
        """
        Calculate vehicle storage capacity for an approach.
        N = (L_road × N_lanes) / (L_vehicle + L_gap)
        """
        junction = self.junctions.get(junction_id)
        if not junction or direction not in junction.approaches:
            return 20  # Default
        
        approach = junction.approaches[direction]
        avg_vehicle_length = self.context.get("spillback_prevention", {}).get("avg_vehicle_length_m", 5.0)
        avg_gap = self.context.get("spillback_prevention", {}).get("avg_gap_m", 2.0)
        
        capacity = int((approach.storage_length_m * approach.lanes) / (avg_vehicle_length + avg_gap))
        return max(capacity, 1)
    
    def list_junctions(self) -> List[str]:
        """Get list of all junction IDs."""
        return list(self.junctions.keys())
    
    def to_dict(self, junction_id: str) -> Dict:
        """Export junction data as dictionary for API/frontend."""
        junction = self.junctions.get(junction_id)
        if not junction:
            return {}
        
        return {
            "id": junction.id,
            "name": junction.name,
            "coordinates": {"lat": junction.lat, "lon": junction.lon},
            "approaches": {
                d: {
                    "lanes": a.lanes,
                    "width_m": a.width_m,
                    "turn_radius_m": a.turn_radius_m,
                    "storage_length_m": a.storage_length_m,
                    "saturation_flow": round(a.saturation_flow, 0),
                    "fw": round(a.fw, 2),
                    "fHV": round(a.fHV, 2),
                    "fT": round(a.fT, 2),
                    "storage_capacity": self.get_storage_capacity(junction_id, d)
                }
                for d, a in junction.approaches.items()
            }
        }


if __name__ == "__main__":
    # Test with config files
    import os
    base_path = Path(__file__).parent.parent / "config"
    
    db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    print("Loaded junctions:", db.list_junctions())
    
    for jid in db.list_junctions():
        print(f"\n=== {jid} ===")
        data = db.to_dict(jid)
        print(f"Name: {data['name']}")
        for direction, approach in data['approaches'].items():
            print(f"  {direction}: {approach['saturation_flow']} PCU/hr (fw={approach['fw']}, fHV={approach['fHV']}, fT={approach['fT']})")
