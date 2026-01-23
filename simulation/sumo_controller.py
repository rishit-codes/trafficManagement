"""
SUMO Controller

Manages SUMO simulation lifecycle and provides traffic detection interface.
Bridges SUMO (TraCI) with the existing Webster optimizer and signal controller.
"""

import time
import traci
import sumolib
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
import json

# Import existing modules
import sys
sys.path.append(str(Path(__file__).parent.parent))

from backend.src.pcu_converter import PCUConverter
from backend.src.geometric_database import GeometricDatabase
from backend.src.webster_optimizer import WebsterOptimizer
from backend.src.spillback_detector import SpillbackDetector


@dataclass
class TrafficState:
    """Traffic state at a junction approach."""
    vehicle_counts: Dict[str, int]  # {vtype: count}
    total_pcu: float
    queue_length_m: float
    waiting_time_s: float
    timestamp: float


class SUMOController:
    """Controls SUMO simulation via TraCI."""
    
    def __init__(self, sumo_binary: str = "sumo", gui: bool = False):
        """
        Initialize SUMO controller.
        
        Args:
            sumo_binary: Path to SUMO executable
            gui: Use SUMO-GUI for visualization
        """
        self.sumo_binary = sumo_binary
        self.gui = gui
        self.simulation_running = False
        self.current_step = 0
        
    def start(
        self,
        net_file: str,
        route_file: str,
        step_length: float = 1.0,
        start_time: int = 0
    ):
        """
        Start SUMO simulation.
        
        Args:
            net_file: Path to .net.xml file
            route_file: Path to .rou.xml file
            step_length: Simulation step length in seconds
            start_time: Start time in seconds
        """
        import simulation
        
        binary = simulation.get_sumo_binary(gui=self.gui)
        
        sumo_cmd = [
            binary,
            "-n", net_file,
            "-r", route_file,
            "--step-length", str(step_length),
            "--begin", str(start_time),
            "--quit-on-end",
            "--no-warnings",
            "--no-step-log"
        ]
        
        if not self.gui:
            sumo_cmd.append("--no-duration-log")
        
        print(f"Starting SUMO simulation...")
        print(f"  Network: {Path(net_file).name}")
        print(f"  Routes: {Path(route_file).name}")
        print(f"  GUI: {self.gui}")
        
        traci.start(sumo_cmd)
        self.simulation_running = True
        self.current_step = 0
        
        print(f"[OK] SUMO started successfully")
    
    def step(self, num_steps: int = 1) -> int:
        """
        Advance simulation by specified steps.
        
        Args:
            num_steps: Number of simulation steps
            
        Returns:
            Current simulation step
        """
        if not self.simulation_running:
            raise RuntimeError("Simulation not started")
        
        for _ in range(num_steps):
            traci.simulationStep()
            self.current_step += 1
        
        return self.current_step
    
    def close(self):
        """Close SUMO simulation."""
        if self.simulation_running:
            traci.close()
            self.simulation_running = False
            print("[OK] SUMO simulation closed")
    
    def is_running(self) -> bool:
        """Check if simulation has vehicles."""
        if not self.simulation_running:
            return False
        
        return traci.simulation.getMinExpectedNumber() > 0
    
    def get_junction_ids(self) -> List[str]:
        """Get list of traffic light junction IDs."""
        return traci.trafficlight.getIDList()
    
    def set_phase(self, junction_id: str, phase_index: int):
        """Set traffic light phase."""
        traci.trafficlight.setPhase(junction_id, phase_index)
    
    def set_phase_duration(self, junction_id: str, duration_s: float):
        """Set duration of current phase."""
        traci.trafficlight.setPhaseDuration(junction_id, duration_s)
    
    def get_current_phase(self, junction_id: str) -> int:
        """Get current traffic light phase index."""
        return traci.trafficlight.getPhase(junction_id)


class SUMOTrafficDetector:
    """Detects traffic from SUMO simulation (replaces vision module in sim mode)."""
    
    def __init__(self, junction_config_path: str):
        """
        Initialize traffic detector.
        
        Args:
            junction_config_path: Path to junction_config.json
        """
        with open(junction_config_path, 'r') as f:
            self.junction_config = json.load(f)
        
        self.junctions = self.junction_config['junctions']
        self.pcu_converter = PCUConverter()
    
    def get_traffic_state(self, junction_id: str, approach: str) -> TrafficState:
        """
        Get traffic state for a junction approach.
        
        Args:
            junction_id: Junction ID (e.g., "J001")
            approach: Approach direction ("north", "south", "east", "west")
            
        Returns:
            TrafficState object
        """
        edge_id = f"in_{junction_id}_{approach}"
        
        try:
            # Get all vehicles on this edge
            vehicle_ids = traci.edge.getLastStepVehicleIDs(edge_id)
            
            # Count by vehicle type
            vehicle_counts = {}
            for veh_id in vehicle_ids:
                vtype = traci.vehicle.getTypeID(veh_id)
                vehicle_counts[vtype] = vehicle_counts.get(vtype, 0) + 1
            
            # Convert to PCU
            total_pcu = self.pcu_converter.convert(vehicle_counts)
            
            # IMPROVED: Calculate queue length using actual vehicle lengths
            # Instead of assuming 7m per vehicle, use actual lengths from SUMO
            queue_length_m = 0.0
            halting_vehicles = 0
            
            for veh_id in vehicle_ids:
                try:
                    # Vehicle is halting if speed < 0.1 m/s
                    if traci.vehicle.getSpeed(veh_id) < 0.1:
                        veh_length = traci.vehicle.getLength(veh_id)
                        gap = 2.0  # Assume 2m gap between stopped vehicles
                        queue_length_m += veh_length + gap
                        halting_vehicles += 1
                except traci.exceptions.TraCIException:
                    # Vehicle might have left, skip it
                    pass
            
            # Remove last gap if there are halting vehicles
            if halting_vehicles > 0:
                queue_length_m -= 2.0  # Remove gap after last vehicle
            
            # Get average waiting time
            waiting_time_s = traci.edge.getWaitingTime(edge_id) if vehicle_ids else 0.0
            
            return TrafficState(
                vehicle_counts=vehicle_counts,
                total_pcu=total_pcu,
                queue_length_m=queue_length_m,
                waiting_time_s=waiting_time_s,
                timestamp=time.time()
            )
        
        except traci.exceptions.TraCIException as e:
            # Edge might not exist or have vehicles
            return TrafficState(
                vehicle_counts={},
                total_pcu=0.0,
                queue_length_m=0.0,
                waiting_time_s=0.0,
                timestamp=time.time()
            )
    
    def get_junction_state(self, junction_id: str) -> Dict[str, TrafficState]:
        """Get traffic state for all approaches of a junction."""
        # Find junction in config
        junction_data = None
        for junc_key, junc in self.junctions.items():
            if junc['id'] == junction_id:
                junction_data = junc
                break
        
        if not junction_data:
            return {}
        
        # Get state for each approach
        states = {}
        for approach in junction_data['approaches'].keys():
            states[approach] = self.get_traffic_state(junction_id, approach)
        
        return states


class AdaptiveSignalController:
    """
    Adaptive signal controller using Webster optimization.
    Integrates SUMO traffic detection with existing optimization modules.
    """
    
    def __init__(
        self,
        sumo_controller: SUMOController,
        junction_config_path: str,
        vadodara_context_path: str,
        update_interval_s: int = 5
    ):
        """
        Initialize adaptive controller.
        
        Args:
            sumo_controller: SUMO controller instance
            junction_config_path: Path to junction_config.json
            vadodara_context_path: Path to vadodara_context.json
            update_interval_s: How often to update signal timings
        """
        self.sumo_controller = sumo_controller
        self.update_interval_s = update_interval_s
        
        # Initialize modules
        self.traffic_detector = SUMOTrafficDetector(junction_config_path)
        self.geom_db = GeometricDatabase(junction_config_path, vadodara_context_path)
        
        # FIXED: WebsterOptimizer expects GeometricDatabase instance, not path
        self.optimizer = WebsterOptimizer(self.geom_db)
        
        # FIXED: SpillbackDetector also expects GeometricDatabase instance
        self.spillback_detector = SpillbackDetector(self.geom_db)
        
        # Load configs
        with open(junction_config_path, 'r') as f:
            self.junction_config = json.load(f)
        
        self.metrics = {
            'total_waiting_time': 0.0,
            'total_vehicles': 0,
            'optimization_count': 0,
            'spillback_events': 0
        }
    
    def run(self, duration_s: Optional[int] = None):
        """
        Run adaptive signal control loop.
        
        Args:
            duration_s: Simulation duration (None = until vehicles finish)
        """
        print("\n" + "="*60)
        print("ADAPTIVE SIGNAL CONTROL MODE")
        print("="*60)
        print(f"Update interval: {self.update_interval_s}s")
        print(f"Junctions: {self.sumo_controller.get_junction_ids()}")
        print()
        
        start_time = self.sumo_controller.current_step
        last_update = start_time
        
        while self.sumo_controller.is_running():
            current_step = self.sumo_controller.step()
            
            # Check if duration exceeded
            if duration_s and (current_step - start_time) >= duration_s:
                break
            
            # Update signal timings at interval
            if (current_step - last_update) >= self.update_interval_s:
                self._update_all_signals()
                last_update = current_step
                
                # Print progress every 60s
                if current_step % 60 == 0:
                    elapsed = current_step - start_time
                    print(f"[{elapsed:4d}s] Optimizations: {self.metrics['optimization_count']}, "
                          f"Spillback events: {self.metrics['spillback_events']}")
        
        print(f"\n[OK] Simulation complete ({current_step - start_time}s)")
        self._print_summary()
    
    def _update_all_signals(self):
        """Update signal timings for all junctions."""
        for junction_id in self.sumo_controller.get_junction_ids():
            try:
                self._optimize_junction(junction_id)
            except Exception as e:
                print(f"[WARN] Error optimizing {junction_id}: {e}")
    
    def _optimize_junction(self, junction_id: str):
        """Optimize signal timing for a single junction."""
        # Get traffic state
        approach_states = self.traffic_detector.get_junction_state(junction_id)
        
        if not approach_states:
            return
        
        # Prepare flow data for optimizer
        flows_pcu_per_hour = {}
        for approach, state in approach_states.items():
            # Convert from current PCU count to hourly flow rate (rough estimate)
            flows_pcu_per_hour[approach] = state.total_pcu * (3600 / self.update_interval_s)
        
        # Get geometric data
        junction_geom = self.geom_db.get_junction(junction_id)
        saturation_flows = {}
        for approach in approach_states.keys():
            sat_flow = self.geom_db.get_approach_saturation_flow(junction_id, approach)
            saturation_flows[approach] = sat_flow
        
        # Check spillback
        for approach, state in approach_states.items():
            # FIXED: Junction is a dataclass, use dot notation
            approach_data = junction_geom.approaches.get(approach)
            if approach_data:
                # FIXED: ApproachGeometry is also a dataclass
                storage_m = approach_data.storage_length_m
                
                if state.queue_length_m > storage_m * 0.85:
                    self.metrics['spillback_events'] += 1
        
        # Optimize timing
        try:
            # FIXED: Use correct method signature - optimizer.optimize(junction_id, live_flows)
            # The optimizer internally gets saturation flows from geom_db
            timing_plan = self.optimizer.optimize(junction_id, flows_pcu_per_hour)
            
            # Convert Signal Timing object to dict
            timing_dict = timing_plan.to_dict()
            
            # FIXED: Actually apply the optimized timing to SUMO!
            cycle_length = timing_dict.get('cycle_length_s', 120)
            phases = timing_dict.get('phases', [])
            
            if phases:
                # Get current phase index
                try:
                    current_phase_idx = self.sumo_controller.get_current_phase(junction_id)
                    
                    # Apply optimized green time for current phase
                    # SUMO limitation: Can only modify current phase duration dynamically
                    # Full TLS program update would require rebuilding the entire program
                    if current_phase_idx < len(phases):
                        phase_data = phases[current_phase_idx]
                        optimized_green = phase_data.get('green_s', 30)
                        
                        # Set the new phase duration
                        self.sumo_controller.set_phase_duration(junction_id, optimized_green)
                    
                    self.metrics['optimization_count'] += 1
                    
                except traci.exceptions.TraCIException as e:
                    # Junction might not have traffic light or phase doesn't exist
                    pass
            
        except Exception as e:
            # Optimization failed, continue with default timing
            pass
    
    def _print_summary(self):
        """Print simulation summary."""
        print("\n" + "="*60)
        print("ADAPTIVE CONTROL SUMMARY")
        print("="*60)
        print(f"Total optimizations: {self.metrics['optimization_count']}")
        print(f"Spillback events detected: {self.metrics['spillback_events']}")
        print()


class StabilizedAdaptiveController:
    """
    Stabilized adaptive signal controller using classical traffic engineering principles.
    
    Key stability features:
    - Cycle-level optimization (every 45s, not 5s)
    - Input smoothing via exponential moving average
    - Green time bounds (15-60s)
    - Anti-oscillation rate limiting (max ±10s change per cycle)
    - Automatic reversion to stable timing after consecutive failures
    """
    
    # Stability configuration constants
    DEFAULT_CONFIG = {
        "update_interval_s": 45,       # Cycle-level updates
        "min_green_s": 15,             # Safety minimum (pedestrian crossing)
        "max_green_s": 60,             # Coordination maximum
        "max_green_change_s": 10,      # Anti-oscillation limit
        "smoothing_alpha": 0.3,        # EMA smoothing factor (0.3 = 30% new, 70% history)
        "stability_window": 3,         # Consecutive failures before revert
        "performance_threshold": 1.1   # 10% degradation triggers concern
    }
    
    def __init__(
        self,
        sumo_controller: SUMOController,
        junction_config_path: str,
        vadodara_context_path: str,
        config: dict = None
    ):
        """
        Initialize stabilized adaptive controller.
        
        Args:
            sumo_controller: SUMO controller instance
            junction_config_path: Path to junction_config.json
            vadodara_context_path: Path to vadodara_context.json
            config: Optional stability configuration overrides
        """
        self.sumo_controller = sumo_controller
        self.config = {**self.DEFAULT_CONFIG, **(config or {})}
        
        # Initialize modules
        self.traffic_detector = SUMOTrafficDetector(junction_config_path)
        self.geom_db = GeometricDatabase(junction_config_path, vadodara_context_path)
        self.optimizer = WebsterOptimizer(self.geom_db)
        self.spillback_detector = SpillbackDetector(self.geom_db)
        
        # Load junction config
        with open(junction_config_path, 'r') as f:
            self.junction_config = json.load(f)
        
        # State tracking for stability
        self._flow_history = {}      # {junction_id: {approach: smoothed_flow}}
        self._current_greens = {}    # {junction_id: {phase_idx: green_s}}
        self._stable_timings = {}    # {junction_id: last known stable timing}
        self._performance_history = []  # Recent delay measurements
        self._failure_count = 0      # Consecutive degradation count
        
        # Metrics
        self.metrics = {
            'total_waiting_time': 0.0,
            'total_vehicles': 0,
            'optimization_count': 0,
            'spillback_events': 0,
            'reversions': 0,
            'rate_limited_changes': 0
        }
    
    def run(self, duration_s: Optional[int] = None):
        """Run stabilized adaptive signal control loop."""
        step = 0
        start_time = traci.simulation.getTime()
        last_optimization_time = start_time
        update_interval = self.config["update_interval_s"]
        
        print(f"\nStability config: interval={update_interval}s, "
              f"green bounds=[{self.config['min_green_s']},{self.config['max_green_s']}]s, "
              f"max_change={self.config['max_green_change_s']}s")
        
        while traci.simulation.getMinExpectedNumber() > 0:
            current_time = traci.simulation.getTime()
            
            # Check duration limit
            if duration_s and (current_time - start_time) >= duration_s:
                break
            
            # Collect metrics every step
            self._collect_metrics()
            
            # Cycle-level optimization (not every step!)
            if current_time - last_optimization_time >= update_interval:
                self._run_optimization_cycle()
                last_optimization_time = current_time
            
            # Progress report every 60s
            if step > 0 and step % 60 == 0:
                self._print_progress(current_time - start_time)
            
            traci.simulationStep()
            step += 1
        
        # Calculate final metrics (at end, not accumulated every step)
        self._finalize_metrics()
        self._print_summary()
    
    def _collect_metrics(self):
        """Collect current simulation metrics (called every step, so must not over-count)."""
        # Track max vehicles seen (not cumulative)
        current_vehicles = len(traci.vehicle.getIDList())
        self.metrics['total_vehicles'] = max(
            self.metrics['total_vehicles'],
            current_vehicles
        )
    
    def _finalize_metrics(self):
        """Calculate final metrics at simulation end."""
        # Sum waiting time from all vehicles currently in simulation
        total_wait = 0.0
        vehicle_count = 0
        for veh_id in traci.vehicle.getIDList():
            total_wait += traci.vehicle.getAccumulatedWaitingTime(veh_id)
            vehicle_count += 1
        
        self.metrics['total_waiting_time'] = total_wait
        # Use the larger of current vehicles or max seen
        if vehicle_count > self.metrics['total_vehicles']:
            self.metrics['total_vehicles'] = vehicle_count
    
    def _run_optimization_cycle(self):
        """Run one optimization cycle for all junctions."""
        # Calculate current average delay
        current_delay = self._get_average_delay()
        
        # Check stability - should we optimize or revert?
        if self._should_revert(current_delay):
            self._revert_to_stable()
            return
        
        # Optimize each junction
        for junction_key in self.junction_config.get("junctions", {}):
            junction_id = self.junction_config["junctions"][junction_key]["id"]
            try:
                self._optimize_junction_stable(junction_id)
            except Exception as e:
                # Silently continue on errors
                pass
        
        # Update performance history
        self._performance_history.append(current_delay)
        if len(self._performance_history) > 5:
            self._performance_history.pop(0)
    
    def _get_average_delay(self) -> float:
        """Calculate current average vehicle delay."""
        total_wait = 0.0
        count = 0
        for veh_id in traci.vehicle.getIDList():
            total_wait += traci.vehicle.getAccumulatedWaitingTime(veh_id)
            count += 1
        return total_wait / max(count, 1)
    
    def _should_revert(self, current_delay: float) -> bool:
        """Check if we should revert to stable timing."""
        if not self._performance_history:
            return False
        
        # Compare to previous delay
        prev_delay = self._performance_history[-1] if self._performance_history else current_delay
        threshold = self.config["performance_threshold"]
        
        if current_delay > prev_delay * threshold:
            self._failure_count += 1
            if self._failure_count >= self.config["stability_window"]:
                return True
        else:
            self._failure_count = 0  # Reset on improvement
        
        return False
    
    def _revert_to_stable(self):
        """Revert all junctions to last stable timing."""
        if not self._stable_timings:
            return
        
        for junction_id, timing in self._stable_timings.items():
            try:
                for phase_idx, green_s in timing.items():
                    # Apply stable timing
                    current_phase = self.sumo_controller.get_current_phase(junction_id)
                    if current_phase == phase_idx:
                        self.sumo_controller.set_phase_duration(junction_id, green_s)
            except:
                pass
        
        self.metrics['reversions'] += 1
        self._failure_count = 0
    
    def _optimize_junction_stable(self, junction_id: str):
        """Optimize signal timing with stability controls."""
        # Get traffic state
        approach_states = self.traffic_detector.get_junction_state(junction_id)
        if not approach_states:
            return
        
        # Smooth input flows using EMA
        alpha = self.config["smoothing_alpha"]
        smoothed_flows = {}
        
        if junction_id not in self._flow_history:
            self._flow_history[junction_id] = {}
        
        for approach, state in approach_states.items():
            raw_flow = state.total_pcu * (3600 / self.config["update_interval_s"])
            
            # Exponential moving average
            if approach in self._flow_history[junction_id]:
                prev_flow = self._flow_history[junction_id][approach]
                smoothed_flow = alpha * raw_flow + (1 - alpha) * prev_flow
            else:
                smoothed_flow = raw_flow
            
            self._flow_history[junction_id][approach] = smoothed_flow
            smoothed_flows[approach] = smoothed_flow
        
        # Check spillback
        junction_geom = self.geom_db.get_junction(junction_id)
        for approach, state in approach_states.items():
            approach_data = junction_geom.approaches.get(approach)
            if approach_data:
                storage_m = approach_data.storage_length_m
                if state.queue_length_m > storage_m * 0.85:
                    self.metrics['spillback_events'] += 1
        
        # Run Webster optimization with smoothed inputs
        try:
            timing_plan = self.optimizer.optimize(junction_id, smoothed_flows)
            timing_dict = timing_plan.to_dict()
            phases = timing_dict.get('phases', [])
            
            if not phases:
                return
            
            # Initialize current greens tracking
            if junction_id not in self._current_greens:
                self._current_greens[junction_id] = {}
            
            # Apply with rate limiting and bounds
            current_phase_idx = self.sumo_controller.get_current_phase(junction_id)
            
            for phase_idx, phase_data in enumerate(phases):
                target_green = phase_data.get('green_s', 30)
                
                # Apply bounds
                target_green = max(self.config["min_green_s"], 
                                  min(self.config["max_green_s"], target_green))
                
                # Rate limiting
                current_green = self._current_greens[junction_id].get(phase_idx, target_green)
                delta = target_green - current_green
                max_change = self.config["max_green_change_s"]
                
                if abs(delta) > max_change:
                    # Limit the change
                    target_green = current_green + (max_change if delta > 0 else -max_change)
                    self.metrics['rate_limited_changes'] += 1
                
                # Store new green time
                self._current_greens[junction_id][phase_idx] = target_green
                
                # Apply to SUMO if this is the current phase
                if phase_idx == current_phase_idx:
                    self.sumo_controller.set_phase_duration(junction_id, int(target_green))
            
            # Save as stable timing if performance is good
            if self._failure_count == 0:
                self._stable_timings[junction_id] = self._current_greens[junction_id].copy()
            
            self.metrics['optimization_count'] += 1
            
        except Exception as e:
            pass
    
    def _print_progress(self, elapsed_s: float):
        """Print progress update."""
        avg_wait = self.metrics['total_waiting_time'] / max(1, self.metrics['total_vehicles'])
        print(f"[{int(elapsed_s):4d}s] Vehicles: {self.metrics['total_vehicles']}, "
              f"Avg Wait: {avg_wait:.1f}s, "
              f"Optimizations: {self.metrics['optimization_count']}, "
              f"Reversions: {self.metrics['reversions']}")
    
    def _print_summary(self):
        """Print simulation summary."""
        print("\n" + "="*60)
        print("STABILIZED ADAPTIVE CONTROL SUMMARY")
        print("="*60)
        print(f"Total optimizations: {self.metrics['optimization_count']}")
        print(f"Rate-limited changes: {self.metrics['rate_limited_changes']}")
        print(f"Stability reversions: {self.metrics['reversions']}")
        print(f"Spillback events: {self.metrics['spillback_events']}")
        print()


def main():
    """Run a simple test simulation."""
    import argparse
    
    parser = argparse.ArgumentParser(description="SUMO Controller Test")
    parser.add_argument("--gui", action="store_true", help="Use SUMO-GUI")
    parser.add_argument("--scenario", default="peak", choices=["peak", "offpeak", "night"],
                        help="Traffic scenario")
    parser.add_argument("--duration", type=int, default=600, help="Simulation duration (seconds)")
    
    args = parser.parse_args()
    
    # Paths
    project_root = Path(__file__).parent.parent
    net_file = project_root / "simulation" / "networks" / "vadodara.net.xml"
    route_file = project_root / "simulation" / "demand" / f"vadodara_{args.scenario}.rou.xml"
    junction_config =project_root / "config" / "junction_config.json"
    vadodara_context = project_root / "config" / "vadodara_context.json"
    
    # Check files exist
    if not net_file.exists():
        print(f"Error: Network file not found: {net_file}")
        print("Run: python simulation/vadodara_network.py")
        return
    
    if not route_file.exists():
        print(f"Error: Route file not found: {route_file}")
        print("Run: python simulation/traffic_generator.py")
        return
    
    # Start SUMO
    controller = SUMOController(gui=args.gui)
    controller.start(str(net_file), str(route_file))
    
    # Run adaptive control
    adaptive = AdaptiveSignalController(
        controller,
        str(junction_config),
        str(vadodara_context),
        update_interval_s=5
    )
    
    try:
        adaptive.run(duration_s=args.duration)
    finally:
        controller.close()


if __name__ == "__main__":
    main()
