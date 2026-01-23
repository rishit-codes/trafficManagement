"""
Unit tests for PCU Converter Module
Tests vehicle count to PCU conversion for Indian heterogeneous traffic.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.src.pcu_converter import PCUConverter, calculate_pcu


def test_basic_conversion():
    """Test basic PCU conversion with standard vehicle mix."""
    converter = PCUConverter()
    
    vehicle_counts = {
        "car": 10,
        "motorcycle": 25,
        "bus": 3,
        "truck": 2
    }
    
    # Expected: 10*1.0 + 25*0.2 + 3*2.5 + 2*3.0 = 10 + 5 + 7.5 + 6 = 28.5
    pcu = converter.convert(vehicle_counts)
    assert pcu == 28.5, f"Expected 28.5, got {pcu}"
    print("âœ“ Basic conversion test passed")


def test_single_vehicle_type():
    """Test conversion with single vehicle type."""
    converter = PCUConverter()
    
    # Only cars
    assert converter.convert({"car": 5}) == 5.0
    
    # Only motorcycles
    assert converter.convert({"motorcycle": 10}) == 2.0  # 10 * 0.2
    
    # Only buses
    assert converter.convert({"bus": 4}) == 10.0  # 4 * 2.5
    
    print("âœ“ Single vehicle type tests passed")


def test_empty_counts():
    """Test with no vehicles."""
    converter = PCUConverter()
    assert converter.convert({}) == 0.0
    print("âœ“ Empty counts test passed")


def test_auto_rickshaw():
    """Test auto-rickshaw specific conversion."""
    converter = PCUConverter()
    
    vehicle_counts = {
        "auto_rickshaw": 10,
        "car": 5
    }
    
    # Expected: 10*0.8 + 5*1.0 = 8 + 5 = 13.0
    pcu = converter.convert(vehicle_counts)
    assert pcu == 13.0, f"Expected 13.0, got {pcu}"
    print("âœ“ Auto-rickshaw test passed")


def test_heavy_vehicle_mix():
    """Test with high proportion of heavy vehicles."""
    converter = PCUConverter()
    
    vehicle_counts = {
        "bus": 10,
        "truck": 8,
        "car": 5
    }
    
    # Expected: 10*2.5 + 8*3.0 + 5*1.0 = 25 + 24 + 5 = 54.0
    pcu = converter.convert(vehicle_counts)
    assert pcu == 54.0, f"Expected 54.0, got {pcu}"
    print("âœ“ Heavy vehicle mix test passed")


def test_yolo_conversion():
    """Test conversion from YOLO detection format."""
    converter = PCUConverter()
    
    yolo_detections = {
        "car": 8,
        "motorcycle": 15,
        "bus": 2,
        "truck": 1
    }
    
    # Should map correctly: car->car, motorcycle->motorcycle, bus->bus, truck->truck
    # Expected: 8*1.0 + 15*0.2 + 2*2.5 + 1*3.0 = 8 + 3 + 5 + 3 = 19.0
    pcu = converter.convert_from_yolo(yolo_detections)
    assert pcu == 19.0, f"Expected 19.0, got {pcu}"
    print("âœ“ YOLO conversion test passed")


def test_get_factor():
    """Test getting individual PCU factors."""
    converter = PCUConverter()
    
    assert converter.get_factor("car") == 1.0
    assert converter.get_factor("motorcycle") == 0.2
    assert converter.get_factor("bus") == 2.5
    assert converter.get_factor("truck") == 3.0
    assert converter.get_factor("auto_rickshaw") == 0.8
    assert converter.get_factor("bicycle") == 0.2
    
    # Test unknown vehicle type (should default to 1.0)
    assert converter.get_factor("unknown") == 1.0
    
    print("âœ“ Get factor test passed")


def test_quick_utility_function():
    """Test the quick utility function."""
    vehicle_counts = {"car": 10, "bus": 2}
    
    # Expected: 10*1.0 + 2*2.5 = 15.0
    pcu = calculate_pcu(vehicle_counts)
    assert pcu == 15.0, f"Expected 15.0, got {pcu}"
    print("âœ“ Quick utility function test passed")


def test_realistic_traffic_scenario():
    """Test with realistic Indian traffic scenario."""
    converter = PCUConverter()
    
    # Typical busy intersection in India
    vehicle_counts = {
        "motorcycle": 45,     # Very common
        "car": 18,
        "auto_rickshaw": 12,
        "bus": 4,
        "truck": 2,
        "bicycle": 5
    }
    
    # Expected: 45*0.2 + 18*1.0 + 12*0.8 + 4*2.5 + 2*3.0 + 5*0.2
    #         = 9 + 18 + 9.6 + 10 + 6 + 1 = 53.6
    pcu = converter.convert(vehicle_counts)
    assert pcu == 53.6, f"Expected 53.6, got {pcu}"
    print("âœ“ Realistic traffic scenario test passed")


if __name__ == "__main__":
    print("Running PCU Converter Unit Tests...\n")
    
    try:
        test_basic_conversion()
        test_single_vehicle_type()
        test_empty_counts()
        test_auto_rickshaw()
        test_heavy_vehicle_mix()
        test_yolo_conversion()
        test_get_factor()
        test_quick_utility_function()
        test_realistic_traffic_scenario()
        
        print("\nâœ… All PCU Converter tests passed!")
    except AssertionError as e:
        print(f"\nâŒ Test failed: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\nâŒ Unexpected error: {e}")
        sys.exit(1)

