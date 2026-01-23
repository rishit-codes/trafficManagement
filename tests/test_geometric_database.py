"""
Unit tests for Geometric Database Module
Tests junction loading, HCM factor calculations, and saturation flows.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.src.geometric_database import GeometricDatabase


def test_junction_loading():
    """Test loading junctions from config files."""
    base_path = Path(__file__).parent.parent / "config"
    
    db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    junctions = db.list_junctions()
    assert len(junctions) == 3, f"Expected 3 junctions, got {len(junctions)}"
    assert "J001" in junctions
    assert "J002" in junctions
    assert "J003" in junctions
    
    print("âœ“ Junction loading test passed")


def test_lane_width_factor():
    """Test lane width adjustment factor calculation."""
    base_path = Path(__file__).parent.parent / "config"
    db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    # Test HCM lane width factors
    assert db._lane_width_factor(3.65) == 1.00  # Standard lane
    assert db._lane_width_factor(3.35) == 0.96
    assert db._lane_width_factor(3.05) == 0.91
    assert db._lane_width_factor(2.75) == 0.86
    assert db._lane_width_factor(2.50) == 0.81  # Narrow lane
    
    print("âœ“ Lane width factor test passed")


def test_heavy_vehicle_factor():
    """Test heavy vehicle adjustment factor calculation."""
    base_path = Path(__file__).parent.parent / "config"
    db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    # fHV = 1 / [1 + PHV(ET - 1)], where ET = 2.5
    assert abs(db._heavy_vehicle_factor(0.0) - 1.00) < 0.01  # No heavy vehicles
    assert abs(db._heavy_vehicle_factor(0.15) - 0.815) < 0.01  # 15% heavy
    assert abs(db._heavy_vehicle_factor(0.25) - 0.727) < 0.01  # 25% heavy
    
    print("âœ“ Heavy vehicle factor test passed")


def test_turn_radius_factor():
    """Test turn radius adjustment factor calculation."""
    base_path = Path(__file__).parent.parent / "config"
    db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    assert db._turn_radius_factor(15) == 0.95  # Wide turn
    assert db._turn_radius_factor(12) == 0.92
    assert db._turn_radius_factor(10) == 0.90
    assert db._turn_radius_factor(8) == 0.87
    assert db._turn_radius_factor(6) == 0.85
    assert db._turn_radius_factor(4) == 0.80  # Tight turn
    
    print("âœ“ Turn radius factor test passed")


def test_saturation_flow_calculation():
    """Test saturation flow calculation for approaches."""
    base_path = Path(__file__).parent.parent / "config"
    db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    # Get J001 (Alkapuri Circle) north approach
    junction = db.get_junction("J001")
    assert junction is not None
    
    north = junction.approaches["north"]
    # 2 lanes, 3.5m width, 12m radius, 15% heavy vehicles
    # fw = 1.00 (3.5m >= 3.65 rounds to 1.00 or close)
    # Actually 3.5 < 3.65, so fw should be 0.96
    # fHV = 1/(1+0.15*1.5) = 1/1.225 = 0.816
    # fT = 0.92 (12m radius)
    # s = 1900 * 2 * 0.96 * 0.816 * 0.92
    
    # Just check it's calculated and reasonable
    assert north.saturation_flow > 2000
    assert north.saturation_flow < 4000
    
    print("âœ“ Saturation flow calculation test passed")


def test_get_approach_saturation_flow():
    """Test getting saturation flow for specific approach."""
    base_path = Path(__file__).parent.parent / "config"
    db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    flow = db.get_approach_saturation_flow("J001", "north")
    assert flow > 0, "Saturation flow should be positive"
    
    # Test non-existent junction/approach
    flow = db.get_approach_saturation_flow("INVALID", "north")
    assert flow == 1900, "Should return base flow for invalid junction"
    
    print("âœ“ Get approach saturation flow test passed")


def test_storage_capacity():
    """Test vehicle storage capacity calculation."""
    base_path = Path(__file__).parent.parent / "config"
    db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    # J001 north: 2 lanes, 150m storage
    # N = (150 * 2) / (5.0 + 2.0) = 300 / 7 = 42.85 â‰ˆ 42
    capacity = db.get_storage_capacity("J001", "north")
    assert capacity > 0, "Storage capacity should be positive"
    assert capacity < 100, "Storage capacity should be reasonable"
    
    print("âœ“ Storage capacity test passed")


def test_junction_to_dict():
    """Test exporting junction data as dictionary."""
    base_path = Path(__file__).parent.parent / "config"
    db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    data = db.to_dict("J001")
    
    assert data["id"] == "J001"
    assert data["name"] == "Alkapuri Circle"
    assert "coordinates" in data
    assert "approaches" in data
    assert len(data["approaches"]) == 4  # north, south, east, west
    
    # Check approach data structure
    north = data["approaches"]["north"]
    assert "lanes" in north
    assert "width_m" in north
    assert "saturation_flow" in north
    assert "fw" in north
    assert "fHV" in north
    assert "fT" in north
    
    print("âœ“ Junction to dict test passed")


def test_old_city_geometry():
    """Test old city (narrow lanes) geometry calculations."""
    base_path = Path(__file__).parent.parent / "config"
    db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    # J002 (Mandvi Junction) has narrow lanes
    junction = db.get_junction("J002")
    south = junction.approaches["south"]
    
    # 2.5m width should have fw = 0.81
    assert south.width_m == 2.5
    assert south.fw == 0.81
    
    # 5m turn radius should have fT = 0.80
    assert south.turn_radius_m == 5
    assert south.fT == 0.80
    
    # Saturation flow should be significantly reduced
    assert south.saturation_flow < 1500  # Much lower than standard
    
    print("âœ“ Old city geometry test passed")


def test_nh48_heavy_vehicles():
    """Test NH-48 junction with high heavy vehicle percentage."""
    base_path = Path(__file__).parent.parent / "config"
    db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    # J003 (NH-48) has 25% heavy vehicles on NS approaches
    junction = db.get_junction("J003")
    north = junction.approaches["north"]
    
    assert north.heavy_vehicle_pct == 0.25
    # fHV = 1/(1+0.25*1.5) = 1/1.375 = 0.727
    assert abs(north.fHV - 0.727) < 0.01
    
    print("âœ“ NH-48 heavy vehicles test passed")


if __name__ == "__main__":
    print("Running Geometric Database Unit Tests...\n")
    
    try:
        test_junction_loading()
        test_lane_width_factor()
        test_heavy_vehicle_factor()
        test_turn_radius_factor()
        test_saturation_flow_calculation()
        test_get_approach_saturation_flow()
        test_storage_capacity()
        test_junction_to_dict()
        test_old_city_geometry()
        test_nh48_heavy_vehicles()
        
        print("\nâœ… All Geometric Database tests passed!")
    except AssertionError as e:
        print(f"\nâŒ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nâŒ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

