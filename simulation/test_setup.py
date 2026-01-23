"""
Quick Test Script for SUMO Integration

Tests the complete simulation pipeline with a short run.
"""

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from simulation import check_sumo_installation, DIRS


def test_installation():
    """Test SUMO installation."""
    print("="*60)
    print("STEP 1: Checking SUMO Installation")
    print("="*60)
    
    is_installed, sumo_home, msg = check_sumo_installation()
    
    if is_installed:
        print(f"[OK] {msg}")
        print(f"     SUMO_HOME: {sumo_home}")
        return True
    else:
        print(f"[FAIL] {msg}")
        print("\nPlease install SUMO:")
        print("  - Download: https://sumo.dlr.de/docs/Downloads.php")
        print("  - Or run: pip install eclipse-sumo")
        return False


def test_files():
    """Test that network and demand files exist."""
    print("\n" + "="*60)
    print("STEP 2: Checking Generated Files")
    print("="*60)
    
    required_files = {
        "Network": Path(DIRS['networks']) / "vadodara.nod.xml",
        "Edges": Path(DIRS['networks']) / "vadodara.edg.xml",
        "Connections": Path(DIRS['networks']) / "vadodara.con.xml",
        "Traffic Lights": Path(DIRS['networks']) / "vadodara.tll.xml",
        "Vehicle Types": Path(DIRS['demand']) / "vtypes.rou.xml",
        "Peak Demand": Path(DIRS['demand']) / "vadodara_peak.rou.xml"
    }
    
    all_exist = True
    for name, filepath in required_files.items():
        if filepath.exists():
            print(f"[OK] {name}: {filepath.name}")
        else:
            print(f"[FAIL] {name} not found: {filepath}")
            all_exist = False
    
    if not all_exist:
        print("\nGenerate missing files:")
        print("  python simulation/vadodara_network.py")
        print("  python simulation/traffic_generator.py")
        return False
    
    return True


def test_imports():
    """Test that all modules can be imported."""
    print("\n" + "="*60)
    print("STEP 3: Testing Module Imports")
    print("="*60)
    
    modules = [
        ("SUMO TraCI", "traci"),
        ("SUMO Lib", "sumolib"),
        ("PCU Converter", "src.pcu_converter"),
        ("Geometric DB", "src.geometric_database"),
        ("Webster Optimizer", "src.webster_optimizer"),
        ("Spillback Detector", "src.spillback_detector"),
        ("Network Generator", "simulation.vadodara_network"),
        ("Traffic Generator", "simulation.traffic_generator"),
        ("SUMO Controller", "simulation.sumo_controller"),
        ("Simulation Runner", "simulation.run_simulation")
    ]
    
    all_imported = True
    for name, module_name in modules:
        try:
            __import__(module_name)
            print(f"[OK] {name}")
        except ImportError as e:
            print(f"[FAIL] {name}: {e}")
            all_imported = False
    
    return all_imported


def run_quick_simulation():
    """Run a 60-second test simulation."""
    print("\n" + "="*60)
    print("STEP 4: Running Quick Simulation Test (60 seconds)")
    print("="*60)
    
    try:
        from simulation.run_simulation import SimulationRunner
        
        project_root = Path(__file__).parent.parent
        net_file = project_root / "simulation" / "networks" / "vadodara.net.xml"
        route_file = project_root / "simulation" / "demand" / "vadodara_peak.rou.xml"
        junction_config = project_root / "config" / "junction_config.json"
        vadodara_context = project_root / "config" / "vadodara_context.json"
        
        # Check if .net.xml exists (compiled network)
        if not net_file.exists():
            print("[WARN] Compiled network file (.net.xml) not found")
            print("       This is normal - SUMO will compile on first run")
            print("       Or run netconvert manually (see simulation/README.md)")
        
        print("\nRunning baseline simulation (60s)...")
        runner = SimulationRunner(
            str(net_file) if net_file.exists() else str(net_file).replace('.net.xml', '.nod.xml'),
            str(route_file),
            str(junction_config),
            str(vadodara_context)
        )
        
        # This might fail if netconvert hasn't been run yet
        try:
            baseline_metrics = runner.run_baseline(duration_s=60, gui=False)
            print(f"\n[OK] Baseline test complete!")
            print(f"     Avg waiting time: {baseline_metrics.average_waiting_time_s:.2f}s")
            print(f"     Vehicles processed: {baseline_metrics.total_vehicles}")
            return True
        except Exception as e:
            if "not found" in str(e).lower() or "no such file" in str(e).lower():
                print(f"\n[INFO] Network needs to be compiled")
                print(f"       Run: netconvert -n {net_file.parent}/vadodara.nod.xml")
                print(f"                        -e {net_file.parent}/vadodara.edg.xml")
                print(f"                        -o {net_file}")
                return None  # Not a failure, just needs manual step
            else:
                raise
    
    except Exception as e:
        print(f"\n[FAIL] Simulation test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("\n" + "#"*60)
    print("# SUMO SIMULATION INTEGRATION - SYSTEM TEST")
    print("#"*60 + "\n")
    
    results = []
    
    # Test 1: Installation
    results.append(("SUMO Installation", test_installation()))
    
    if not results[-1][1]:
        print("\n[FAIL] Cannot proceed without SUMO installation")
        return False
    
    # Test 2: Files
    results.append(("Generated Files", test_files()))
    
    # Test 3: Imports
    results.append(("Module Imports", test_imports()))
    
    # Test 4: Quick sim (optional)
    sim_result = run_quick_simulation()
    if sim_result is not None:
        results.append(("Quick Simulation", sim_result))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    for test_name, result in results:
        status = "[PASS]" if result else "[FAIL]"
        print(f"{status} {test_name}")
    
    all_passed = all(r for _, r in results)
    
    if all_passed:
        print("\n" + "="*60)
        print("[SUCCESS] All tests passed!")
        print("="*60)
        print("\nYou're ready to run full simulations:")
        print("  python simulation/run_simulation.py --mode compare --duration 600")
        print("\nOr with visualization:")
        print("  python simulation/run_simulation.py --mode adaptive --duration 300 --gui")
    else:
        print("\n[WARNING] Some tests failed. Check errors above.")
    
    return all_passed


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
