
import json
import time
import math
import random
from pathlib import Path

def generate_mock_data(duration_s=600, output_path="frontend/src/data/simulation_output.json"):
    print(f"Generating mock simulation data for {duration_s} seconds...")
    
    junctions = ["J001", "J002", "J003", "J004", "J005"]
    timeline = []
    
    # Simulation loop
    for step in range(duration_s):
        # Time-of-day traffic curve (sine wave)
        # Peak at t=300 (mid-simulation)
        traffic_intensity = 0.5 + 0.4 * math.sin((step / duration_s) * math.pi)
        
        # System metrics
        avg_wait = 30 + (traffic_intensity * 40) + random.uniform(-5, 5)
        active_spillbacks = 0
        total_vehicles = int(1000 * traffic_intensity)
        
        junctions_data = []
        for j_id in junctions:
            # Random variance per junction
            j_variance = random.uniform(0.8, 1.2)
            queue_length = 20 + (traffic_intensity * 100 * j_variance) + random.uniform(-10, 10)
            
            status = "optimal"
            if queue_length > 120:
                status = "critical"
                active_spillbacks += 1
            elif queue_length > 80:
                status = "warning"
                
            junctions_data.append({
                "id": j_id,
                "status": status,
                "max_queue": int(max(0, queue_length))
            })
            
        step_data = {
            "time": step,
            "system_metrics": {
                "avgWaitTime": int(avg_wait),
                "activeSpillbacks": active_spillbacks,
                "totalVehicles": total_vehicles
            },
            "junctions": junctions_data
        }
        timeline.append(step_data)
        
    # Export
    export_data = {
        "metadata": {
            "generated_at": time.time(),
            "duration": duration_s,
            "scenario": "Robust Mock Simulation"
        },
        "timeline": timeline
    }
    
    # Ensure directory exists
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(export_data, f, indent=0)
        
    print(f"[OK] Mock data generated at: {output_path}")

if __name__ == "__main__":
    # Project root derived from script location
    project_root = Path(__file__).parent.parent
    frontend_data = project_root / "frontend" / "src" / "data" / "simulation_output.json"
    generate_mock_data(output_path=str(frontend_data))
