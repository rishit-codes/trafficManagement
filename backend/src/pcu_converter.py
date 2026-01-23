"""
PCU Converter Module
Converts vehicle counts to Passenger Car Units (PCU) for heterogeneous Indian traffic.

Based on IRC (Indian Roads Congress) guidelines and HCM standards.
"""

import json
from pathlib import Path
from typing import Dict, Optional

# Default PCU factors (Indian traffic standards)
DEFAULT_PCU_FACTORS = {
    "motorcycle": 0.2,
    "car": 1.0,
    "auto_rickshaw": 0.8,
    "bus": 2.5,
    "truck": 3.0,
    "bicycle": 0.2,
    "pedestrian": 0.5,  # When crossing affects traffic
}

# YOLO class names to vehicle type mapping
YOLO_TO_VEHICLE = {
    "motorcycle": "motorcycle",
    "car": "car",
    "bus": "bus",
    "truck": "truck",
    "bicycle": "bicycle",
    "person": "pedestrian",
}


class PCUConverter:
    """Convert heterogeneous vehicle counts to standardized PCU values."""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize converter with optional custom config.
        
        Args:
            config_path: Path to vadodara_context.json for custom PCU factors
        """
        self.pcu_factors = DEFAULT_PCU_FACTORS.copy()
        
        if config_path:
            self._load_config(config_path)
    
    def _load_config(self, config_path: str) -> None:
        """Load PCU factors from config file."""
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                if "pcu_factors" in config:
                    self.pcu_factors.update(config["pcu_factors"])
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Warning: Could not load config, using defaults. Error: {e}")
    
    def convert(self, vehicle_counts: Dict[str, int]) -> float:
        """
        Convert vehicle counts dictionary to total PCU.
        
        Args:
            vehicle_counts: Dict like {"car": 5, "bus": 2, "motorcycle": 8}
        
        Returns:
            Total PCU value as float
        
        Example:
            >>> converter = PCUConverter()
            >>> counts = {"car": 5, "bus": 2, "motorcycle": 8}
            >>> converter.convert(counts)
            11.6  # 5*1.0 + 2*2.5 + 8*0.2
        """
        total_pcu = 0.0
        for vehicle_type, count in vehicle_counts.items():
            if vehicle_type not in self.pcu_factors:
                print(f"Warning: Unknown vehicle type '{vehicle_type}', using default PCU=1.0")
            factor = self.pcu_factors.get(vehicle_type, 1.0)
            total_pcu += count * factor
        return round(total_pcu, 2)
    
    def convert_from_yolo(self, yolo_detections: Dict[str, int]) -> float:
        """
        Convert YOLO detection class counts to PCU.
        
        Args:
            yolo_detections: Dict with YOLO class names as keys
        
        Returns:
            Total PCU value
        """
        vehicle_counts = {}
        for yolo_class, count in yolo_detections.items():
            vehicle_type = YOLO_TO_VEHICLE.get(yolo_class, "car")
            vehicle_counts[vehicle_type] = vehicle_counts.get(vehicle_type, 0) + count
        return self.convert(vehicle_counts)
    
    def get_factor(self, vehicle_type: str) -> float:
        """Get PCU factor for a specific vehicle type."""
        return self.pcu_factors.get(vehicle_type, 1.0)


# Quick utility function for simple conversions
def calculate_pcu(vehicle_counts: Dict[str, int]) -> float:
    """Quick PCU calculation without creating converter instance."""
    converter = PCUConverter()
    return converter.convert(vehicle_counts)


if __name__ == "__main__":
    # Test the converter
    converter = PCUConverter()
    
    # Example: Typical Indian intersection traffic
    sample_counts = {
        "car": 10,
        "motorcycle": 25,
        "bus": 3,
        "auto_rickshaw": 8,
        "truck": 2
    }
    
    pcu = converter.convert(sample_counts)
    print(f"Sample vehicle counts: {sample_counts}")
    print(f"Total PCU: {pcu}")
    # Expected: 10*1.0 + 25*0.2 + 3*2.5 + 8*0.8 + 2*3.0 = 10 + 5 + 7.5 + 6.4 + 6 = 34.9
