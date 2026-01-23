"""
Vadodara Network Generator

Converts junction_config.json to SUMO network files (.nod.xml, .edg.xml, .con.xml, .net.xml).
Uses existing junction geometry data to create realistic simulation networks.
"""

import json
import math
from pathlib import Path
from typing import Dict, List, Tuple
import xml.etree.ElementTree as ET
from xml.dom import minidom


class VadodaraNetworkGenerator:
    """Generate SUMO network from junction configuration."""
    
    def __init__(self, junction_config_path: str, vadodara_context_path: str):
        """
        Initialize network generator.
        
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
        self.hcm_params = self.vadodara_context['hcm_parameters']
    
    def generate_network(self, output_dir: str, network_name: str = "vadodara") -> Dict[str, str]:
        """
        Generate complete SUMO network.
        
        Args:
            output_dir: Directory to save network files
            network_name: Base name for network files
            
        Returns:
            Dict with paths to generated files
        """
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"Generating SUMO network for {len(self.junctions)} junctions...")
        
        # Generate XML files
        nodes_file = output_dir / f"{network_name}.nod.xml"
        edges_file = output_dir / f"{network_name}.edg.xml"
        connections_file = output_dir / f"{network_name}.con.xml"
        tls_file = output_dir / f"{network_name}.tll.xml"
        net_file = output_dir / f"{network_name}.net.xml"
        
        self._create_nodes_file(nodes_file)
        self._create_edges_file(edges_file)
        self._create_connections_file(connections_file)
        self._create_traffic_lights_file(tls_file)
        
        print(f"[OK] Generated node, edge, connection, and TLS files")

        
        # Build network using netconvert (if available)
        try:
            import subprocess
            import simulation
            
            # Find netconvert
            sumo_binary = simulation.get_sumo_binary()
            sumo_home = sumo_binary.replace("sumo.exe", "").replace("sumo", "")
            netconvert = sumo_home + "netconvert" + (".exe" if "win" in str(sumo_home) else "")
            
            cmd = [
                netconvert,
                "--node-files", str(nodes_file),
                "--edge-files", str(edges_file),
                "--connection-files", str(connections_file),
                "--tllogic-files", str(tls_file),
                "--output-file", str(net_file),
                "--no-turnarounds", "false",
                "--junctions.corner-detail", "5",
                "--rectangular-lane-cut"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"[OK] Network compiled: {net_file}")
            else:
                print(f"[WARN] netconvert warning: {result.stderr[:200]}")
                print(f"  Manual build: netconvert -n {nodes_file} -e {edges_file} -x {connections_file} -i {tls_file} -o {net_file}")
        except Exception as e:
            print(f"[WARN] Could not run netconvert automatically: {e}")
            print(f"  Run manually: netconvert -n {nodes_file} -e {edges_file} -o {net_file}")
        
        return {
            "nodes": str(nodes_file),
            "edges": str(edges_file),
            "connections": str(connections_file),
            "tls": str(tls_file),
            "network": str(net_file)
        }
    
    def _create_nodes_file(self, output_file: Path):
        """Create SUMO nodes XML file."""
        nodes = ET.Element("nodes")
        
        for junction_key, junction in self.junctions.items():
            junction_id = junction['id']
            coords = junction['coordinates']
            approaches = junction['approaches']
            
            # Convert lat/lon to local coordinates (simplified projection)
            x, y = self._latlon_to_xy(coords['lat'], coords['lon'])
            
            # Create central junction node
            node = ET.SubElement(nodes, "node")
            node.set("id", junction_id)
            node.set("x", f"{x:.2f}")
            node.set("y", f"{y:.2f}")
            node.set("type", "traffic_light")
            
            # FIXED: Create external nodes for each approach (entry/exit points)
            # These are where vehicles spawn and despawn
            edge_length = 200  # meters
            
            for direction in approaches.keys():
                # Calculate positions for external nodes
                offset_x, offset_y = 0, 0
                if direction == "north":
                    offset_y = edge_length
                elif direction == "south":
                    offset_y = -edge_length
                elif direction == "east":
                    offset_x = edge_length
                elif direction == "west":
                    offset_x = -edge_length
                
                # Create entry node (from this direction)
                entry_node = ET.SubElement(nodes, "node")
                entry_node.set("id", f"ext_{junction_id}_{direction}")
                entry_node.set("x", f"{x + offset_x:.2f}")
                entry_node.set("y", f"{y + offset_y:.2f}")
                entry_node.set("type", "priority")
                
                # Create exit node (to this direction)
                exit_node = ET.SubElement(nodes, "node")
                exit_node.set("id", f"ext_{junction_id}_{direction}_out")
                exit_node.set("x", f"{x + offset_x:.2f}")
                exit_node.set("y", f"{y + offset_y:.2f}")
                exit_node.set("type", "priority")
        
        self._write_xml(nodes, output_file)
        print(f"  Created: {output_file.name}")
    
    def _create_edges_file(self, output_file: Path):
        """Create SUMO edges XML file."""
        edges = ET.Element("edges")
        
        for junction_key, junction in self.junctions.items():
            junction_id = junction['id']
            approaches = junction['approaches']
            
            for direction, approach in approaches.items():
                # Create incoming edge for each approach
                edge_id = f"in_{junction_id}_{direction}"
                from_node = f"ext_{junction_id}_{direction}"
                to_node = junction_id
                
                # Create external node for this approach (not in nodes.xml, SUMO will handle)
                edge = ET.SubElement(edges, "edge")
                edge.set("id", edge_id)
                edge.set("from", from_node)
                edge.set("to", to_node)
                edge.set("numLanes", str(approach['lanes']))
                edge.set("speed", self._get_speed_limit(junction))
                
                # Set lane width in meters
                width = approach['width_m']
                edge.set("width", f"{width:.2f}")
                
                # Create outgoing edge
                out_edge_id = f"out_{junction_id}_{direction}"
                out_edge = ET.SubElement(edges, "edge")
                out_edge.set("id", out_edge_id)
                out_edge.set("from", to_node)
                out_edge.set("to", f"ext_{junction_id}_{direction}_out")
                out_edge.set("numLanes", str(approach['lanes']))
                out_edge.set("speed", self._get_speed_limit(junction))
                out_edge.set("width", f"{width:.2f}")
        
        self._write_xml(edges, output_file)
        print(f"  Created: {output_file.name}")
    
    def _create_connections_file(self, output_file: Path):
        """Create SUMO connections XML file (turn movements)."""
        connections = ET.Element("connections")
        
        for junction_key, junction in self.junctions.items():
            junction_id = junction['id']
            approaches = junction['approaches']
            
            # Define turn movements for 4-way intersection
            # North can go: straight (south), right (west), left (east)
            turn_mappings = {
                'north': ['south', 'west', 'east'],
                'south': ['north', 'east', 'west'],
                'east': ['west', 'north', 'south'],
                'west': ['east', 'south', 'north']
            }
            
            for from_dir, to_dirs in turn_mappings.items():
                # FIXED: Check if from approach exists (handles T-junctions)
                if from_dir not in approaches:
                    continue
                
                from_edge = f"in_{junction_id}_{from_dir}"
                
                for to_dir in to_dirs:
                    # FIXED: Check if to approach exists
                    if to_dir not in approaches:
                        continue
                    
                    to_edge = f"out_{junction_id}_{to_dir}"
                    
                    # Create connection for each lane
                    num_lanes = approaches[from_dir]['lanes']
                    for lane_idx in range(num_lanes):
                        conn = ET.SubElement(connections, "connection")
                        conn.set("from", from_edge)
                        conn.set("to", to_edge)
                        conn.set("fromLane", str(lane_idx))
                        conn.set("toLane", str(min(lane_idx, approaches[to_dir]['lanes'] - 1)))
                        
                        # Set turn radius (affects speed)
                        radius = approaches[from_dir]['turn_radius_m']
                        if from_dir in ['north', 'south'] and to_dir in ['north', 'south']:
                            conn.set("shape", "")  # Straight
                        else:
                            conn.set("radius", f"{radius:.2f}")
        
        self._write_xml(connections, output_file)
        print(f"  Created: {output_file.name}")
    
    def _create_traffic_lights_file(self, output_file: Path):
        """Create SUMO traffic light logic XML file."""
        tlLogics = ET.Element("tlLogics")
        
        for junction_key, junction in self.junctions.items():
            junction_id = junction['id']
            current_timing = junction.get('current_timing', {})
            
            if not current_timing:
                continue
            
            # Create traffic light logic
            tlLogic = ET.SubElement(tlLogics, "tlLogic")
            tlLogic.set("id", junction_id)
            tlLogic.set("type", "static")
            tlLogic.set("programID", "baseline")
            tlLogic.set("offset", "0")
            
            cycle_length = current_timing.get('cycle_length_s', 120)
            phases_config = current_timing.get('phases', [])
            
            # Create phases
            # Phase 0: NS green, EW red
            if len(phases_config) >= 1:
                ns_phase = phases_config[0]
                green_duration = ns_phase.get('green_s', 45)
                yellow_duration = ns_phase.get('yellow_s', 3)
                
                # Green phase
                phase_green = ET.SubElement(tlLogic, "phase")
                phase_green.set("duration", str(green_duration))
                phase_green.set("state", "GGGGrrrrGGGGrrrr")  # NS green, EW red
                
                # Yellow phase
                phase_yellow = ET.SubElement(tlLogic, "phase")
                phase_yellow.set("duration", str(yellow_duration))
                phase_yellow.set("state", "yyyyrrrryyyyrrrr")  # NS yellow
            
            # Phase 1: EW green, NS red
            if len(phases_config) >= 2:
                ew_phase = phases_config[1]
                green_duration = ew_phase.get('green_s', 45)
                yellow_duration = ew_phase.get('yellow_s', 3)
                
                # Green phase
                phase_green = ET.SubElement(tlLogic, "phase")
                phase_green.set("duration", str(green_duration))
                phase_green.set("state", "rrrrGGGGrrrrGGGG")  # EW green, NS red
                
                # Yellow phase
                phase_yellow = ET.SubElement(tlLogic, "phase")
                phase_yellow.set("duration", str(yellow_duration))
                phase_yellow.set("state", "rrrryyyyrrrryyyy")  # EW yellow
        
        self._write_xml(tlLogics, output_file)
        print(f"  Created: {output_file.name}")
    
    def _latlon_to_xy(self, lat: float, lon: float) -> Tuple[float, float]:
        """
        Convert lat/lon to local XY coordinates (simplified).
        Centers around first junction.
        """
        # FIXED: Calculate reference point dynamically from first junction
        # instead of hardcoding Alkapuri coordinates
        first_junction = list(self.junctions.values())[0]
        ref_lat = first_junction['coordinates']['lat']
        ref_lon = first_junction['coordinates']['lon']
        
        # Approximate meters per degree at this latitude
        meters_per_lat = 111320  # ~111km per degree
        meters_per_lon = 111320 * math.cos(math.radians(ref_lat))
        
        x = (lon - ref_lon) * meters_per_lon
        y = (lat - ref_lat) * meters_per_lat
        
        return x, y
    
    def _get_speed_limit(self, junction: Dict) -> str:
        """Get speed limit for junction (m/s)."""
        # Default: 50 km/h = 13.89 m/s
        # NH-48: 60 km/h = 16.67 m/s
        # Old city: 40 km/h = 11.11 m/s
        
        junction_name = junction.get('name', '').lower()
        
        if 'nh-48' in junction_name or 'nh48' in junction_name:
            return "16.67"  # 60 km/h
        elif 'mandvi' in junction_name or 'old' in junction_name:
            return "11.11"  # 40 km/h
        else:
            return "13.89"  # 50 km/h
    
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
    """Generate Vadodara network from configs."""
    import sys
    import os
    
    # Get project root
    project_root = Path(__file__).parent.parent
    
    # Paths
    junction_config = project_root / "config" / "junction_config.json"
    vadodara_context = project_root / "config" / "vadodara_context.json"
    output_dir = project_root / "simulation" / "networks"
    
    if not junction_config.exists():
        print(f"Error: Junction config not found: {junction_config}")
        sys.exit(1)
    
    if not vadodara_context.exists():
        print(f"Error: Vadodara context not found: {vadodara_context}")
        sys.exit(1)
    
    # Generate network
    generator = VadodaraNetworkGenerator(str(junction_config), str(vadodara_context))
    files = generator.generate_network(str(output_dir))
    
    print("\n=== Network Generation Complete ===")
    for file_type, file_path in files.items():
        print(f"  {file_type}: {file_path}")
    
    print("\nNext steps:")
    print("  1. Generate traffic demand: python simulation/traffic_generator.py")
    print("  2. Run simulation: python simulation/run_simulation.py")


if __name__ == "__main__":
    main()
