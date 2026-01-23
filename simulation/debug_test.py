import sys
sys.path.insert(0, r'c:\Users\Rishtz\Desktop\traffic-anti')

try:
    from simulation.run_simulation import SimulationRunner
    from pathlib import Path
    
    project_root = Path(r'c:\Users\Rishtz\Desktop\traffic-anti')
    net_file = project_root / "simulation" / "networks" / "vadodara.net.xml"
    route_file = project_root / "simulation" / "demand" / "vadodara_peak.rou.xml"
    junction_config = project_root / "config" / "junction_config.json"
    vadodara_context = project_root / "config" / "vadodara_context.json"
    
    runner = SimulationRunner(
        str(net_file),
        str(route_file),
        str(junction_config),
        str(vadodara_context)
    )
    
    print("Testing adaptive mode...")
    runner.run_adaptive(duration_s=60, gui=False)
    
except Exception as e:
    import traceback
    print(f"\n\nFULL ERROR:")
    print("="*70)
    traceback.print_exc()
