"""
Simulation Runner

Runs baseline (fixed-time) vs adaptive (Webster-optimized) signal control simulations.
Collects metrics and generates comparison reports.
"""

import json
import time
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
import traci

from sumo_controller import SUMOController, SUMOTrafficDetector, AdaptiveSignalController, StabilizedAdaptiveController


@dataclass
class SimulationMetrics:
    """Metrics collected during simulation."""
    scenario: str  # "baseline" or "adaptive"
    total_duration_s: float
    total_vehicles: int
    average_waiting_time_s: float
    average_travel_time_s: float
    max_queue_length_m: float
    average_queue_length_m: float
    throughput_veh_per_hour: float
    spillback_events: int
    total_delay_veh_hours: float
    
    def to_dict(self) -> Dict:
        return asdict(self)


class SimulationRunner:
    """Runs and compares baseline vs adaptive simulations."""
    
    def __init__(
        self,
        net_file: str,
        route_file: str,
        junction_config_path: str,
        vadodara_context_path: str
    ):
        """
        Initialize simulation runner.
        
        Args:
            net_file: Path to SUMO network file (.net.xml)
            route_file: Path to route file (.rou.xml)
            junction_config_path: Path to junction_config.json
            vadodara_context_path: Path to vadodara_context.json
        """
        self.net_file = net_file
        self.route_file = route_file
        self.junction_config_path = junction_config_path
        self.vadodara_context_path = vadodara_context_path
        
        # Load configs
        with open(junction_config_path, 'r') as f:
            self.junction_config = json.load(f)
        
        with open(vadodara_context_path, 'r') as f:
            self.vadodara_context = json.load(f)
    
    def run_baseline(self, duration_s: int = 3600, gui: bool = False) -> SimulationMetrics:
        """
        Run baseline simulation with fixed-time signals.
        
        Args:
            duration_s: Simulation duration in seconds
            gui: Use SUMO-GUI for visualization
            
        Returns:
            SimulationMetrics
        """
        print("\n" + "="*70)
        print(" BASELINE SIMULATION (Fixed-Time Signals)")
        print("="*70)
        print(f"Duration: {duration_s}s ({duration_s/60:.1f} minutes)")
        print(f"Signal control: Pre-programmed timings from junction config")
        print()
        
        # Start SUMO with baseline timing (already in TLS file)
        controller = SUMOController(gui=gui)
        controller.start(self.net_file, self.route_file)
        
        # Collect metrics
        metrics_collector = MetricsCollector(controller, self.junction_config_path)
        
        start_time = controller.current_step
        last_print = start_time
        
        try:
            while controller.is_running():
                current_step = controller.step()
                
                # Collect metrics
                metrics_collector.collect(current_step)
                
                # Print progress every 60s
                if current_step % 60 == 0 and current_step != last_print:
                    elapsed = current_step - start_time
                    veh_count = traci.simulation.getDepartedNumber()
                    print(f"[{elapsed:4d}s] Vehicles: {metrics_collector.total_vehicles}, "
                          f"Avg Wait: {metrics_collector.get_avg_waiting_time():.1f}s")
                    last_print = current_step
                
                # Check duration
                if (current_step - start_time) >= duration_s:
                    break
            
            # Final metrics
            metrics = metrics_collector.finalize("baseline", current_step - start_time)
            
            print(f"\n[OK] Baseline simulation complete")
            self._print_metrics(metrics)
            
            return metrics
        
        finally:
            controller.close()
    
    def run_adaptive(self, duration_s: int = 3600, gui: bool = False) -> SimulationMetrics:
        """
        Run adaptive simulation with Webster-optimized signals.
        
        Args:
            duration_s: Simulation duration in seconds
            gui: Use SUMO-GUI for visualization
            
        Returns:
            SimulationMetrics
        """
        print("\n" + "="*70)
        print(" ADAPTIVE SIMULATION (Webster-Optimized Signals)")
        print("="*70)
        print(f"Duration: {duration_s}s ({duration_s/60:.1f} minutes)")
        print(f"Signal control: Stabilized cycle-level optimization (45s intervals)")
        print(f"Features: EMA smoothing, rate limiting, stability safeguards")
        print()
        
        # Start SUMO
        controller = SUMOController(gui=gui)
        controller.start(self.net_file, self.route_file)
        
        # Create STABILIZED adaptive controller (not the unstable version)
        adaptive = StabilizedAdaptiveController(
            controller,
            self.junction_config_path,
            self.vadodara_context_path,
            config=None  # Use default stability config
        )
        
        # The stabilized controller has its own run loop with metrics collection
        # Just delegate to it
        try:
            # Run the stabilized adaptive control loop
            adaptive.run(duration_s=duration_s)
            
            # Get final metrics from the controller
            avg_wait = adaptive.metrics['total_waiting_time'] / max(1, adaptive.metrics['total_vehicles'])
            
            # Build metrics object
            metrics = SimulationMetrics(
                scenario="ADAPTIVE",
                total_duration_s=duration_s,
                total_vehicles=adaptive.metrics['total_vehicles'],
                average_waiting_time_s=avg_wait,
                average_travel_time_s=avg_wait + 60,  # Approximate
                max_queue_length_m=adaptive.metrics.get('max_queue_length_m', 0),
                average_queue_length_m=adaptive.metrics.get('avg_queue_length_m', 0),
                throughput_veh_per_hour=int(adaptive.metrics['total_vehicles'] * 3600 / max(1, duration_s)),
                spillback_events=adaptive.metrics['spillback_events'],
                total_delay_veh_hours=adaptive.metrics['total_waiting_time'] / 3600
            )
            
            print(f"\n[OK] Adaptive simulation complete")
            self._print_metrics(metrics)
            
            return metrics
        
        finally:
            controller.close()
    
    def compare(
        self,
        duration_s: int = 3600,
        output_dir: Optional[str] = None
    ) -> Dict[str, SimulationMetrics]:
        """
        Run both baseline and adaptive simulations and compare.
        
        Args:
            duration_s: Simulation duration for each run
            output_dir: Directory to save results (optional)
            
        Returns:
            Dict with both metrics
        """
        print("\n" + "#"*70)
        print("# SIMULATION COMPARISON: Baseline vs Adaptive")
        print("#"*70)
        
        # Run baseline
        baseline_metrics = self.run_baseline(duration_s=duration_s, gui=False)
        
        time.sleep(2)  # Short pause between simulations
        
        # Run adaptive
        adaptive_metrics = self.run_adaptive(duration_s=duration_s, gui=False)
        
        # Compare results
        print("\n" + "="*70)
        print(" COMPARISON RESULTS")
        print("="*70)
        
        self._print_comparison(baseline_metrics, adaptive_metrics)
        
        # Save results
        if output_dir:
            self._save_results(baseline_metrics, adaptive_metrics, output_dir)
        
        return {
            'baseline': baseline_metrics,
            'adaptive': adaptive_metrics
        }
    
    def _print_metrics(self, metrics: SimulationMetrics):
        """Print metrics summary."""
        print(f"\n  Scenario: {metrics.scenario.upper()}")
        print(f"  Duration: {metrics.total_duration_s:.0f}s")
        print(f"  Total vehicles: {metrics.total_vehicles}")
        print(f"  Avg waiting time: {metrics.average_waiting_time_s:.2f}s")
        print(f"  Avg travel time: {metrics.average_travel_time_s:.2f}s")
        print(f"  Max queue length: {metrics.max_queue_length_m:.1f}m")
        print(f"  Throughput: {metrics.throughput_veh_per_hour:.0f} veh/hr")
        print(f"  Spillback events: {metrics.spillback_events}")
        print(f"  Total delay: {metrics.total_delay_veh_hours:.2f} veh-hours")
    
    def _print_comparison(self, baseline: SimulationMetrics, adaptive: SimulationMetrics):
        """Print comparison table."""
        def calc_improvement(baseline_val, adaptive_val, lower_is_better=True):
            if baseline_val == 0:
                return 0.0
            diff = baseline_val - adaptive_val
            if not lower_is_better:
                diff = -diff
            return (diff / baseline_val) * 100
        
        print(f"\n{'Metric':<30} {'Baseline':>12} {'Adaptive':>12} {'Change':>12}")
        print("-" * 70)
        
        # Waiting time
        wait_improvement = calc_improvement(baseline.average_waiting_time_s, adaptive.average_waiting_time_s)
        print(f"{'Avg Waiting Time (s)':<30} {baseline.average_waiting_time_s:>12.2f} "
              f"{adaptive.average_waiting_time_s:>12.2f} {wait_improvement:>11.1f}%")
        
        # Travel time
        travel_improvement = calc_improvement(baseline.average_travel_time_s, adaptive.average_travel_time_s)
        print(f"{'Avg Travel Time (s)':<30} {baseline.average_travel_time_s:>12.2f} "
              f"{adaptive.average_travel_time_s:>12.2f} {travel_improvement:>11.1f}%")
        
        # Max queue
        queue_improvement = calc_improvement(baseline.max_queue_length_m, adaptive.max_queue_length_m)
        print(f"{'Max Queue Length (m)':<30} {baseline.max_queue_length_m:>12.1f} "
              f"{adaptive.max_queue_length_m:>12.1f} {queue_improvement:>11.1f}%")
        
        # Throughput (higher is better)
        throughput_improvement = calc_improvement(baseline.throughput_veh_per_hour, 
                                                  adaptive.throughput_veh_per_hour, lower_is_better=False)
        print(f"{'Throughput (veh/hr)':<30} {baseline.throughput_veh_per_hour:>12.0f} "
              f"{adaptive.throughput_veh_per_hour:>12.0f} {throughput_improvement:>11.1f}%")
        
        # Spillback
        spillback_improvement = calc_improvement(baseline.spillback_events, adaptive.spillback_events)
        print(f"{'Spillback Events':<30} {baseline.spillback_events:>12} "
              f"{adaptive.spillback_events:>12} {spillback_improvement:>11.1f}%")
        
        # Total delay
        delay_improvement = calc_improvement(baseline.total_delay_veh_hours, adaptive.total_delay_veh_hours)
        print(f"{'Total Delay (veh-hrs)':<30} {baseline.total_delay_veh_hours:>12.2f} "
              f"{adaptive.total_delay_veh_hours:>12.2f} {delay_improvement:>11.1f}%")
        
        print("\n" + "="*70)
    
    def _save_results(self, baseline: SimulationMetrics, adaptive: SimulationMetrics, output_dir: str):
        """Save results to JSON file."""
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        results = {
            'baseline': baseline.to_dict(),
            'adaptive': adaptive.to_dict(),
            'timestamp': time.time()
        }
        
        output_file = output_path / f"comparison_{int(time.time())}.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n[OK] Results saved to: {output_file}")


class MetricsCollector:
    """Collects metrics during simulation."""
    
    def __init__(self, controller: SUMOController, junction_config_path: str):
        self.controller = controller
        self.detector = SUMOTrafficDetector(junction_config_path)
        
        self.total_vehicles = 0
        self.total_waiting_time = 0.0
        self.total_travel_time = 0.0
        self.max_queue = 0.0
        self.queue_samples = []
        self.spillback_count = 0
        
        self.departed_vehicles = set()
        self.arrived_vehicles = set()
    
    def collect(self, step: int):
        """Collect metrics at current step."""
        # Track vehicles
        departed = set(traci.simulation.getDepartedIDList())
        arrived = set(traci.simulation.getArrivedIDList())
        
        self.departed_vehicles.update(departed)
        self.arrived_vehicles.update(arrived)
        self.total_vehicles = len(self.departed_vehicles)
        
        # Collect waiting times for active vehicles
        active_vehicles = self.departed_vehicles - self.arrived_vehicles
        for veh_id in active_vehicles:
            try:
                waiting_time = traci.vehicle.getWaitingTime(veh_id)
                self.total_waiting_time += waiting_time
            except:
                pass
        
        # Collect queue lengths
        for junction_id in self.controller.get_junction_ids():
            try:
                states = self.detector.get_junction_state(junction_id)
                for approach, state in states.items():
                    if state.queue_length_m > self.max_queue:
                        self.max_queue = state.queue_length_m
                    self.queue_samples.append(state.queue_length_m)
            except:
                pass
    
    def get_avg_waiting_time(self) -> float:
        """Get current average waiting time."""
        # FIXED: Better handling of zero vehicles
        if self.total_vehicles == 0 or len(self.departed_vehicles) == 0:
            return 0.0
        return self.total_waiting_time / len(self.departed_vehicles)
    
    def finalize(self, scenario: str, duration_s: float) -> SimulationMetrics:
        """Finalize and return metrics."""
        # FIXED: Proper zero handling without max(1, ...) which gives wrong results
        avg_waiting = self.total_waiting_time / self.total_vehicles if self.total_vehicles > 0 else 0.0
        avg_queue = sum(self.queue_samples) / len(self.queue_samples) if self.queue_samples else 0.0
        
        # Estimate travel time (simplified)
        avg_travel = avg_waiting + 60  # Base travel time + waiting
        
        # Calculate throughput
        throughput = (len(self.arrived_vehicles) / duration_s) * 3600
        
        # Estimate spillback events from queue length
        spillback_events = sum(1 for q in self.queue_samples if q > 150)  # Threshold 150m
        
        # Total delay in vehicle-hours
        total_delay = (self.total_waiting_time / 3600)
        
        return SimulationMetrics(
            scenario=scenario,
            total_duration_s=duration_s,
            total_vehicles=self.total_vehicles,
            average_waiting_time_s=avg_waiting,
            average_travel_time_s=avg_travel,
            max_queue_length_m=self.max_queue,
            average_queue_length_m=avg_queue,
            throughput_veh_per_hour=throughput,
            spillback_events=spillback_events,
            total_delay_veh_hours=total_delay
        )


def main():
    """Main entry point."""
    import argparse
    from typing import Optional
    
    parser = argparse.ArgumentParser(description="Run SUMO Traffic Simulation")
    parser.add_argument("--mode", choices=["baseline", "adaptive", "compare"], default="compare",
                        help="Simulation mode")
    parser.add_argument("--scenario", default="peak", choices=["peak", "offpeak", "night"],
                        help="Traffic scenario")
    parser.add_argument("--duration", type=int, default=600,
                        help="Simulation duration (seconds)")
    parser.add_argument("--gui", action="store_true", help="Use SUMO-GUI")
    
    args = parser.parse_args()
    
    # Paths
    project_root = Path(__file__).parent.parent
    net_file = project_root / "simulation" / "networks" / "vadodara.net.xml"
    route_file = project_root / "simulation" / "demand" / f"vadodara_{args.scenario}.rou.xml"
    junction_config = project_root / "config" / "junction_config.json"
    vadodara_context = project_root / "config" / "vadodara_context.json"
    results_dir = project_root / "simulation" / "results"
    
    # Check files exist
    if not net_file.exists():
        print(f"Error: Network file not found. Run: python simulation/vadodara_network.py")
        return
    
    if not route_file.exists():
        print(f"Error: Route file not found. Run: python simulation/traffic_generator.py")
        return
    
    # Create runner
    runner = SimulationRunner(
        str(net_file),
        str(route_file),
        str(junction_config),
        str(vadodara_context)
    )
    
    # Run simulation
    if args.mode == "baseline":
        runner.run_baseline(duration_s=args.duration, gui=args.gui)
    elif args.mode == "adaptive":
        runner.run_adaptive(duration_s=args.duration, gui=args.gui)
    else:  # compare
        runner.compare(duration_s=args.duration, output_dir=str(results_dir))


if __name__ == "__main__":
    main()
