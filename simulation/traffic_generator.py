"""
Traffic Demand Generator

Generates heterogeneous Indian traffic patterns for SUMO simulation.
Creates vehicle types (car, motorcycle, bus, truck) with realistic Indian characteristics.
"""

import json
import random
from pathlib import Path
from typing import Dict, List
import xml.etree.ElementTree as ET
from xml.dom import minidom


class TrafficGenerator:
    """Generate realistic Indian traffic demand for SUMO."""
    
    def __init__(self, junction_config_path: str, vadodara_context_path: str):
        """
        Initialize traffic generator.
        
        Args:
            junction_config_path: Path to junction_config.json
            vadodara_context_path: Path to vadodara_context.json
        """
        self.junction_config_path = Path(junction_config_path)
        self.vadodara_context_path = Path(vadodara_context_path)
        
        # Load configurations
        with open(self.junction_config_path, 'r') as f:
            self.junction_config = json.load(f)
        
        with open(self.vadodara_context_path, 'r') as f:
            self.vadodara_context = json.load(f)
        
        self.junctions = self.junction_config['junctions']
        self.pcu_factors = self.vadodara_context['pcu_factors']
    
    def generate_demand(
        self,
        output_dir: str,
        scenario: str = "peak",
        duration_s: int = 3600,
        seed: int = 42
    ) -> Dict[str, str]:
        """
        Generate traffic demand files.
        
        Args:
            output_dir: Directory to save demand files
            scenario: "peak", "offpeak", or "night"
            duration_s: Simulation duration in seconds
            seed: Random seed for reproducibility
            
        Returns:
            Dict with paths to generated files
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        random.seed(seed)
        
        print(f"Generating {scenario} traffic demand for {duration_s}s simulation...")
        
        # Create files
        vtype_file = output_dir / f"vtypes.rou.xml"
        route_file = output_dir / f"vadodara_{scenario}.rou.xml"
        
        self._create_vehicle_types_file(vtype_file)
        self._create_routes_file(route_file, scenario, duration_s)
        
        print(f"\n[OK] Traffic demand generated for {scenario} scenario")
        
        return {
            "vtypes": str(vtype_file),
            "routes": str(route_file)
        }
    
    def _create_vehicle_types_file(self, output_file: Path):
        """Create SUMO vehicle types XML file with Indian characteristics."""
        routes = ET.Element("routes")
        
        # Car (60% of traffic in most areas)
        car = ET.SubElement(routes, "vType")
        car.set("id", "car")
        car.set("vClass", "passenger")
        car.set("length", "4.5")
        car.set("width", "1.8")
        car.set("height", "1.5")
        car.set("accel", "2.6")
        car.set("decel", "4.5")
        car.set("maxSpeed", "50")
        car.set("sigma", "0.5")  # Driver imperfection
        car.set("color", "1,1,0")  # Yellow
        
        # Motorcycle (25-50% depending on area)
        motorcycle = ET.SubElement(routes, "vType")
        motorcycle.set("id", "motorcycle")
        motorcycle.set("vClass", "motorcycle")
        motorcycle.set("length", "2.0")
        motorcycle.set("width", "0.8")
        motorcycle.set("height", "1.2")
        motorcycle.set("accel", "3.0")
        motorcycle.set("decel", "5.0")
        motorcycle.set("maxSpeed", "40")
        motorcycle.set("sigma", "0.6")  # More aggressive
        motorcycle.set("color", "0,1,1")  # Cyan
        
        # Bus (5-10%)
        bus = ET.SubElement(routes, "vType")
        bus.set("id", "bus")
        bus.set("vClass", "bus")
        bus.set("length", "12.0")
        bus.set("width", "2.5")
        bus.set("height", "3.0")
        bus.set("accel", "1.2")
        bus.set("decel", "3.5")
        bus.set("maxSpeed", "40")
        bus.set("sigma", "0.3")  # More careful
        bus.set("color", "0,0,1")  # Blue
        
        # Truck (5-25% depending on corridor)
        truck = ET.SubElement(routes, "vType")
        truck.set("id", "truck")
        truck.set("vClass", "truck")
        truck.set("length", "10.0")
        truck.set("width", "2.4")
        truck.set("height", "3.5")
        truck.set("accel", "1.0")
        truck.set("decel", "3.0")
        truck.set("maxSpeed", "35")
        truck.set("sigma", "0.4")
        truck.set("color", "1,0,0")  # Red
        
        # Auto-rickshaw (treated as car variant)
        auto = ET.SubElement(routes, "vType")
        auto.set("id", "auto_rickshaw")
        auto.set("vClass", "passenger")
        auto.set("length", "3.0")
        auto.set("width", "1.4")
        auto.set("height", "1.8")
        auto.set("accel", "2.0")
        auto.set("decel", "4.0")
        auto.set("maxSpeed", "35")
        auto.set("sigma", "0.7")  # Quite aggressive
        auto.set("color", "0,1,0")  # Green
        
        self._write_xml(routes, output_file)
        print(f"  Created: {output_file.name}")
    
    def _create_routes_file(self, output_file: Path, scenario: str, duration_s: int):
        """Create routes and vehicle flows."""
        routes = ET.Element("routes")
        
        # Include vehicle types
        include = ET.SubElement(routes, "include")
        include.set("href", "vtypes.rou.xml")
        
        # Get demand multiplier for scenario
        demand_multiplier = self._get_demand_multiplier(scenario)
        
        # Create routes and flows for each junction
        vehicle_id_counter = 0
        
        for junction_key, junction in self.junctions.items():
            junction_id = junction['id']
            junction_name = junction.get('name', junction_key)
            
            # Get traffic mix for this junction
            traffic_mix = self._get_traffic_mix(junction_name)
            
            # Base vehicles per hour for this junction
            base_vph = 1200  # Peak hour baseline
            actual_vph = int(base_vph * demand_multiplier)
            
            # Create routes (4 directions, 3 movements each = 12 routes per junction)
            directions = ['north', 'south', 'east', 'west']
            
            for from_dir in directions:
                if from_dir not in junction['approaches']:
                    continue
                
                for to_dir in directions:
                    if to_dir == from_dir or to_dir not in junction['approaches']:
                        continue
                    
                    route_id = f"route_{junction_id}_{from_dir}_to_{to_dir}"
                    from_edge = f"in_{junction_id}_{from_dir}"
                    to_edge = f"out_{junction_id}_{to_dir}"
                    
                    # Create route
                    route = ET.SubElement(routes, "route")
                    route.set("id", route_id)
                    route.set("edges", f"{from_edge} {to_edge}")
                    
                    # Create vehicle flows for each type
                    # Split traffic across movements (straight=50%, right=30%, left=20%)
                    movement_type = self._classify_movement(from_dir, to_dir)
                    movement_split = {"straight": 0.50, "right": 0.30, "left": 0.20}.get(movement_type, 0.33)
                    
                    route_vph = int(actual_vph * movement_split / 3)  # Divide by 3 movements
                    
                    for vtype, percentage in traffic_mix.items():
                        type_vph = int(route_vph * percentage)
                        
                        if type_vph > 0:
                            flow = ET.SubElement(routes, "flow")
                            flow.set("id", f"flow_{junction_id}_{from_dir}_{to_dir}_{vtype}")
                            flow.set("type", vtype)
                            flow.set("route", route_id)
                            flow.set("begin", "0")
                            flow.set("end", str(duration_s))
                            flow.set("vehsPerHour", str(type_vph))
                            
                            # Add some randomness
                            flow.set("departLane", "best")
                            flow.set("departSpeed", "max")
        
        self._write_xml(routes, output_file)
        print(f"  Created: {output_file.name}")
        print(f"    Scenario: {scenario}")
        print(f"    Demand multiplier: {demand_multiplier}")
        print(f"    Duration: {duration_s}s ({duration_s/60:.1f} minutes)")
    
    def _get_demand_multiplier(self, scenario: str) -> float:
        """Get traffic demand multiplier for scenario."""
        multipliers = {
            "peak": 1.0,      # Full demand (1200 veh/hr per junction)
            "offpeak": 0.65,  # 65% of peak (780 veh/hr)
            "night": 0.15     # 15% of peak (180 veh/hr)
        }
        return multipliers.get(scenario, 1.0)
    
    def _get_traffic_mix(self, junction_name: str) -> Dict[str, float]:
        """Get vehicle type mix for junction based on characteristics."""
        junction_lower = junction_name.lower()
        
        # NH-48 - Heavy freight corridor
        if 'nh-48' in junction_lower or 'nh48' in junction_lower or 'vishwamitri' in junction_lower:
            return {
                'car': 0.50,
                'motorcycle': 0.20,
                'bus': 0.05,
                'truck': 0.25  # High truck percentage
            }
        
        # Old city - Narrow lanes, more two-wheelers
        elif 'mandvi' in junction_lower or 'nyay' in junction_lower or 'raopura' in junction_lower:
            return {
                'car': 0.35,
                'motorcycle': 0.55,  # High motorcycle percentage
                'bus': 0.08,
                'truck': 0.02
            }
        
        # Standard urban junction (Alkapuri, etc.)
        else:
            return {
                'car': 0.60,
                'motorcycle': 0.25,
                'bus': 0.10,
                'truck': 0.05
            }
    
    def _classify_movement(self, from_dir: str, to_dir: str) -> str:
        """Classify turn movement type."""
        opposites = {'north': 'south', 'south': 'north', 'east': 'west', 'west': 'east'}
        right_turns = {
            'north': 'west', 'south': 'east',
            'east': 'north', 'west': 'south'
        }
        
        if to_dir == opposites.get(from_dir):
            return "straight"
        elif to_dir == right_turns.get(from_dir):
            return "right"
        else:
            return "left"
    
    def _write_xml(self, root: ET.Element, output_file: Path):
        """Write XML with pretty formatting."""
        xml_str = ET.tostring(root, encoding='unicode')
        
        # Pretty print
        dom = minidom.parseString(xml_str)
        pretty_xml = dom.toprettyxml(indent="  ")
        
        # Remove extra blank lines
        lines = [line for line in pretty_xml.split('\n') if line.strip()]
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))


def main():
    """Generate traffic demand for all scenarios."""
    import sys
    
    # Get project root
    project_root = Path(__file__).parent.parent
    
    # Paths
    junction_config = project_root / "config" / "junction_config.json"
    vadodara_context = project_root / "config" / "vadodara_context.json"
    output_dir = project_root / "simulation" / "demand"
    
    if not junction_config.exists():
        print(f"Error: Junction config not found: {junction_config}")
        sys.exit(1)
    
    # Generate traffic for all scenarios
    generator = TrafficGenerator(str(junction_config), str(vadodara_context))
    
    scenarios = ["peak", "offpeak", "night"]
    
    for scenario in scenarios:
        print(f"\n{'='*50}")
        files = generator.generate_demand(str(output_dir), scenario=scenario)
    
    print(f"\n{'='*50}")
    print("=== Traffic Demand Generation Complete ===")
    print(f"\nGenerated scenarios:")
    for scenario in scenarios:
        print(f"  - {scenario}: simulation/demand/vadodara_{scenario}.rou.xml")
    
    print("\nNext step:")
    print("  Run simulation: python simulation/run_simulation.py")


if __name__ == "__main__":
    main()
