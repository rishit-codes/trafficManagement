import sys
sys.path.insert(0, r'c:\Users\Rishtz\Desktop\traffic-anti')

try:
    from simulation.sumo_controller import SUMOController, AdaptiveSignalController
    from pathlib import Path
    
    project_root = Path(r'c:\Users\Rishtz\Desktop\traffic-anti')
    junction_config = project_root / "config" / "junction_config.json"
    vadodara_context = project_root / "config" / "vadodara_context.json"
    
    controller = SUMOController(gui=False)
    
    print("Creating AdaptiveSignalController...")
    adaptive = AdaptiveSignalController(
        controller,
        str(junction_config),
        str(vadodara_context),
        update_interval_s=5
    )
    
    print("[OK] AdaptiveSignalController created!")
    
except Exception as e:
    import traceback
    print(f"\n\nFULL ERROR:")
    print("="*70)
    traceback.print_exc()
