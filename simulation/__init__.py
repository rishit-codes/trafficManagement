"""
SUMO Simulation Integration Package

Provides traffic simulation capabilities for testing and validation
of the geometry-aware traffic optimization algorithms.
"""

import os
import sys
from pathlib import Path

__version__ = "1.0.0"

# Check for SUMO installation
def check_sumo_installation():
    """
    Check if SUMO is properly installed and configured.
    
    Returns:
        tuple: (is_installed: bool, sumo_home: str or None, message: str)
    """
    try:
        import traci
        import sumolib
        
        # Check for SUMO_HOME environment variable
        sumo_home = os.environ.get("SUMO_HOME")
        
        if sumo_home and os.path.exists(sumo_home):
            return True, sumo_home, "SUMO is properly installed and configured"
        else:
            # Try to find SUMO in common locations
            common_paths = [
                r"C:\Program Files (x86)\Eclipse\Sumo",
                r"C:\Program Files\Eclipse\Sumo",
                "/usr/share/sumo",
                "/usr/local/share/sumo"
            ]
            
            for path in common_paths:
                if os.path.exists(path):
                    os.environ["SUMO_HOME"] = path
                    return True, path, f"SUMO found at {path}"
            
            # Libraries installed but SUMO binary not found
            return False, None, "traci/sumolib installed but SUMO binaries not found. Install from: https://sumo.dlr.de"
            
    except ImportError as e:
        return False, None, f"SUMO Python libraries not installed: {e}"


def get_sumo_binary(gui=False):
    """
    Get the path to SUMO binary (with or without GUI).
    
    Args:
        gui: If True, return sumo-gui, else return sumo
        
    Returns:
        str: Path to SUMO binary
    """
    is_installed, sumo_home, msg = check_sumo_installation()
    
    if not is_installed:
        raise RuntimeError(f"SUMO not available: {msg}")
    
    if sumo_home:
        binary_name = "sumo-gui.exe" if gui else "sumo.exe"
        if sys.platform != "win32":
            binary_name = "sumo-gui" if gui else "sumo"
        
        binary_path = os.path.join(sumo_home, "bin", binary_name)
        if os.path.exists(binary_path):
            return binary_path
    
    # Fallback: assume SUMO is in PATH
    return "sumo-gui" if gui else "sumo"


# Ensure output directories exist
def setup_directories():
    """Create necessary directories for simulation outputs."""
    base_dir = Path(__file__).parent
    
    dirs = [
        base_dir / "networks",
        base_dir / "demand",
        base_dir / "results",
        base_dir / "scenarios"
    ]
    
    for directory in dirs:
        directory.mkdir(exist_ok=True)
    
    return {
        "networks": str(dirs[0]),
        "demand": str(dirs[1]),
        "results": str(dirs[2]),
        "scenarios": str(dirs[3])
    }


# Initialize on import
DIRS = setup_directories()
SUMO_INSTALLED, SUMO_HOME, SUMO_STATUS = check_sumo_installation()

if not SUMO_INSTALLED:
    print(f"[WARN] {SUMO_STATUS}")
    print("   Simulation features will be limited until SUMO is installed.")
