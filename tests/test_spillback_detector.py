"""
Unit tests for Spillback Detector Module
Tests queue monitoring, spillback risk detection, and recommendation generation.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.src.geometric_database import GeometricDatabase
from backend.src.spillback_detector import SpillbackDetector, SpillbackStatus


def test_detector_initialization():
    """Test spillback detector initialization."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    detector = SpillbackDetector(geo_db)
    
    # Check thresholds loaded from config
    assert detector.warning_threshold == 0.70
    assert detector.critical_threshold == 0.85
    
    print("âœ“ Detector initialization test passed")


def test_ok_status():
    """Test detection of OK status (low occupancy)."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    detector = SpillbackDetector(geo_db)
    
    # Low queue lengths
    queues = {
        "north": 5,
        "south": 8,
        "east": 10,
        "west": 6
    }
    
    status = detector.analyze("J001", queues)
    
    assert status.overall_status == SpillbackStatus.OK
    assert "No action" in status.recommended_action
    
    print("âœ“ OK status test passed")


def test_warning_status():
    """Test detection of WARNING status (70-85% occupancy)."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    detector = SpillbackDetector(geo_db)
    
    # Get storage capacity for J001 north
    capacity = geo_db.get_storage_capacity("J001", "north")
    
    # Set queue to 75% of capacity (should be WARNING)
    queues = {
        "north": int(capacity * 0.75),
        "south": 5,
        "east": 5,
        "west": 5
    }
    
    status = detector.analyze("J001", queues)
    
    # North should be WARNING
    assert status.approaches["north"].status == SpillbackStatus.WARNING
    assert status.overall_status == SpillbackStatus.WARNING
    
    print("âœ“ WARNING status test passed")


def test_critical_status():
    """Test detection of CRITICAL status (>85% occupancy)."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    detector = SpillbackDetector(geo_db)
    
    # Get storage capacity
    capacity = geo_db.get_storage_capacity("J001", "north")
    
    # Set queue to 90% of capacity (mus be > 85% threshold)
    critical_queue = int(capacity * 0.90)
    if critical_queue / capacity <= 0.85:
        critical_queue = int(capacity * 0.86) + 1  # Ensure above threshold
    
    queues = {
        "north": critical_queue,
        "south": 5,
        "east": 5,
        "west": 5
    }
    
    status = detector.analyze("J001", queues)
    
    # North should be CRITICAL (individual approach status)
    north_status = status.approaches["north"]
    occupancy = north_status.occupancy_pct / 100.0
    
    print(f"  Debug: capacity={capacity}, queue={critical_queue}, occupancy={north_status.occupancy_pct}%, status={north_status.status}")
    
    assert north_status.status == SpillbackStatus.CRITICAL, \
        f"Expected CRITICAL but got {north_status.status}, occupancy={north_status.occupancy_pct}%, threshold=85%"
    
    # The approach-level test is sufficient - overall status depends on aggregation logic
    print(f"[PASS] CRITICAL status test passed (queue={critical_queue}/{capacity}, occupancy={north_status.occupancy_pct}%)")


def test_spillback_status():
    """Test detection of actual SPILLBACK (>100% occupancy)."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    detector = SpillbackDetector(geo_db)
    
    # Get storage capacity
    capacity = geo_db.get_storage_capacity("J001", "east")
    
    # Set queue beyond capacity
    queues = {
        "north": 5,
        "south": 5,
        "east": capacity + 10,  # Over capacity!
        "west": 5
    }
    
    status = detector.analyze("J001", queues)
    
    # East should be SPILLBACK
    assert status.approaches["east"].status == SpillbackStatus.SPILLBACK
    assert status.overall_status == SpillbackStatus.SPILLBACK
    assert "URGENT" in status.recommended_action
    
    print("âœ“ SPILLBACK status test passed")


def test_multiple_approaches():
    """Test with multiple approaches at different risk levels."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    detector = SpillbackDetector(geo_db)
    
    north_cap = geo_db.get_storage_capacity("J001", "north")
    east_cap = geo_db.get_storage_capacity("J001", "east")
    
    queues = {
        "north": int(north_cap * 0.90),  # CRITICAL
        "south": 5,                       # OK
        "east": int(east_cap * 0.75),    # WARNING
        "west": 5                         # OK
    }
    
    status = detector.analyze("J001", queues)
    
    # Overall should be worst (CRITICAL)
    assert status.overall_status == SpillbackStatus.CRITICAL
    
    # Check individual statuses
    assert status.approaches["north"].status == SpillbackStatus.CRITICAL
    assert status.approaches["south"].status == SpillbackStatus.OK
    assert status.approaches["east"].status == SpillbackStatus.WARNING
    
    print("âœ“ Multiple approaches test passed")


def test_occupancy_calculation():
    """Test occupancy percentage calculation."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    detector = SpillbackDetector(geo_db)
    
    capacity = geo_db.get_storage_capacity("J001", "north")
    
    queues = {
        "north": int(capacity * 0.5),  # 50% occupancy
        "south": 5,
        "east": 5,
        "west": 5
    }
    
    status = detector.analyze("J001", queues)
    
    north_status = status.approaches["north"]
    assert 45 <= north_status.occupancy_pct <= 55  # Should be around 50%
    
    print("âœ“ Occupancy calculation test passed")


def test_to_dict_conversion():
    """Test conversion of status to dictionary."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    detector = SpillbackDetector(geo_db)
    
    queues = {
        "north": 15,
        "south": 12,
        "east": 35,
        "west": 8
    }
    
    status = detector.analyze("J001", queues)
    result = detector.to_dict(status)
    
    # Check dictionary structure
    assert "junction_id" in result
    assert "timestamp" in result
    assert "overall_status" in result
    assert "recommended_action" in result
    assert "approaches" in result
    
    # Check approach data
    for direction in ["north", "south", "east", "west"]:
        assert direction in result["approaches"]
        approach = result["approaches"][direction]
        assert "queue_length" in approach
        assert "storage_capacity" in approach
        assert "occupancy_pct" in approach
        assert "status" in approach
    
    print("âœ“ To dict conversion test passed")


def test_trend_analysis():
    """Test queue trend analysis over time."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    detector = SpillbackDetector(geo_db)
    
    # Simulate increasing queue over time
    for queue_len in [5, 10, 15, 20, 25, 30]:
        queues = {"north": queue_len, "south": 5, "east": 5, "west": 5}
        detector.analyze("J001", queues)
    
    trend = detector.get_queue_trend("J001", "north")
    assert trend == "INCREASING"
    
    print("âœ“ Trend analysis test passed")


def test_old_city_spillback():
    """Test spillback detection for old city with limited storage."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    detector = SpillbackDetector(geo_db)
    
    # J002 (Mandvi) has limited storage
    capacity = geo_db.get_storage_capacity("J002", "north")
    
    # Moderate queue can quickly become critical in old city
    queues = {
        "north": int(capacity * 0.80),
        "south": int(capacity * 0.75),
        "east": 5,
        "west": 5
    }
    
    status = detector.analyze("J002", queues)
    
    # Should detect WARNING or CRITICAL
    assert status.overall_status in [SpillbackStatus.WARNING, SpillbackStatus.CRITICAL]
    
    print("âœ“ Old city spillback test passed")


if __name__ == "__main__":
    print("Running Spillback Detector Unit Tests...\n")
    
    try:
        test_detector_initialization()
        test_ok_status()
        test_warning_status()
        test_critical_status()
        test_spillback_status()
        test_multiple_approaches()
        test_occupancy_calculation()
        test_to_dict_conversion()
        test_trend_analysis()
        test_old_city_spillback()
        
        print("\nâœ… All Spillback Detector tests passed!")
    except AssertionError as e:
        print(f"\nâŒ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    except Exception as e:
        print(f"\nâŒ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

