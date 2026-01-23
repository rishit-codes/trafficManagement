"""
Unit tests for Webster Optimizer Module
Tests signal timing optimization using Webster's method with geometry-aware saturation flows.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.src.geometric_database import GeometricDatabase
from backend.src.webster_optimizer import WebsterOptimizer, PhaseConfig


def test_optimizer_initialization():
    """Test optimizer initialization with geometric database."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    optimizer = WebsterOptimizer(geo_db)
    
    # Check that constraints are loaded from context
    assert optimizer.MIN_CYCLE >= 30
    assert optimizer.MAX_CYCLE <= 120
    assert optimizer.YELLOW_TIME == 3
    
    print("âœ“ Optimizer initialization test passed")


def test_basic_optimization():
    """Test basic signal timing optimization."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    optimizer = WebsterOptimizer(geo_db)
    
    # Sample traffic flows (PCU/hr)
    flows = {
        "north": 800,
        "south": 750,
        "east": 1200,
        "west": 1100
    }
    
    result = optimizer.optimize("J001", flows)
    
    # Verify result structure
    assert result.cycle_length >= optimizer.MIN_CYCLE
    assert result.cycle_length <= optimizer.MAX_CYCLE
    assert len(result.phases) == 2  # NS and EW
    assert result.sum_flow_ratios >= 0
    assert result.sum_flow_ratios < 1.0  # Should not be oversaturated
    
    # Check phases
    for phase in result.phases:
        assert "name" in phase
        assert "green_s" in phase
        assert "yellow_s" in phase
        assert "red_s" in phase
        assert phase["green_s"] >= 15  # Min green from default config
        assert phase["yellow_s"] == 3
    
    print("âœ“ Basic optimization test passed")


def test_oversaturation_handling():
    """Test handling of oversaturated conditions."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    optimizer = WebsterOptimizer(geo_db)
    
    # Very high flows to create oversaturation
    flows = {
        "north": 3000,
        "south": 3000,
        "east": 3500,
        "west": 3500
    }
    
    result = optimizer.optimize("J001", flows)
    
    # Should detect oversaturation
    assert result.is_oversaturated == True
    
    # Should still produce valid timing (capped)
    assert result.cycle_length <= optimizer.MAX_CYCLE
    
    print("âœ“ Oversaturation handling test passed")


def test_low_flow_optimization():
    """Test optimization with low traffic flows (off-peak)."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    optimizer = WebsterOptimizer(geo_db)
    
    # Low flows
    flows = {
        "north": 100,
        "south": 150,
        "east": 200,
        "west": 180
    }
    
    result = optimizer.optimize("J001", flows)
    
    # Should use minimum cycle length
    assert result.cycle_length <= 60  # Should be relatively short
    assert result.is_oversaturated == False
    
    print("âœ“ Low flow optimization test passed")


def test_compare_with_fixed():
    """Test comparison with fixed timing."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    optimizer = WebsterOptimizer(geo_db)
    
    flows = {
        "north": 800,
        "south": 750,
        "east": 1200,
        "west": 1100
    }
    
    comparison = optimizer.compare_with_fixed("J001", flows)
    
    # Should have both fixed and optimized
    assert "fixed" in comparison
    assert "optimized" in comparison
    assert "cycle_reduction_s" in comparison
    assert "improvement_potential" in comparison
    
    # Fixed cycle should be current (120s for J001)
    assert comparison["fixed"]["cycle_length_s"] == 120
    
    print("âœ“ Compare with fixed test passed")


def test_unbalanced_flows():
    """Test with highly unbalanced flows (one direction much heavier)."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    optimizer = WebsterOptimizer(geo_db)
    
    # Heavy east-west, light north-south
    flows = {
        "north": 200,
        "south": 250,
        "east": 2000,
        "west": 1900
    }
    
    result = optimizer.optimize("J001", flows)
    
    # EW phase should get much more green time than NS
    ns_phase = next(p for p in result.phases if p["name"] == "NS")
    ew_phase = next(p for p in result.phases if p["name"] == "EW")
    
    assert ew_phase["green_s"] > ns_phase["green_s"]
    
    print("âœ“ Unbalanced flows test passed")


def test_old_city_junction():
    """Test optimization for old city junction with narrow lanes."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    optimizer = WebsterOptimizer(geo_db)
    
    # Moderate flows
    flows = {
        "north": 400,
        "south": 450,
        "east": 600,
        "west": 550
    }
    
    result = optimizer.optimize("J002", flows)  # Mandvi Junction
    
    # Should respect max cycle constraint (90s for old city)
    # This is set in junction config
    assert result.cycle_length <= 90
    
    print("âœ“ Old city junction test passed")


def test_nh48_junction():
    """Test optimization for NH-48 junction with heavy vehicles."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    optimizer = WebsterOptimizer(geo_db)
    
    # High flows with heavy vehicles already factored into saturation
    flows = {
        "north": 1500,
        "south": 1400,
        "east": 800,
        "west": 900
    }
    
    result = optimizer.optimize("J003", flows)  # NH-48 Bridge Junction
    
    # NS should get more green (higher flows)
    ns_phase = next(p for p in result.phases if p["name"] == "NS")
    ew_phase = next(p for p in result.phases if p["name"] == "EW")
    
    assert ns_phase["green_s"] > ew_phase["green_s"]
    
    print("âœ“ NH-48 junction test passed")


def test_result_to_dict():
    """Test conversion of result to dictionary."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    optimizer = WebsterOptimizer(geo_db)
    
    flows = {
        "north": 800,
        "south": 750,
        "east": 1200,
        "west": 1100
    }
    
    result = optimizer.optimize("J001", flows)
    result_dict = result.to_dict()
    
    # Check dictionary structure
    assert "cycle_length_s" in result_dict
    assert "phases" in result_dict
    assert "total_lost_time_s" in result_dict
    assert "sum_flow_ratios" in result_dict
    assert "is_oversaturated" in result_dict
    
    print("âœ“ Result to dict test passed")


def test_custom_phase_config():
    """Test with custom phase configuration."""
    base_path = Path(__file__).parent.parent / "config"
    
    geo_db = GeometricDatabase(
        junction_config_path=str(base_path / "junction_config.json"),
        context_config_path=str(base_path / "vadodara_context.json")
    )
    
    optimizer = WebsterOptimizer(geo_db)
    
    # Custom 3-phase config
    custom_phases = [
        PhaseConfig(name="NORTH", approaches=["north"], min_green_s=10, max_green_s=40),
        PhaseConfig(name="SOUTH", approaches=["south"], min_green_s=10, max_green_s=40),
        PhaseConfig(name="EW", approaches=["east", "west"], min_green_s=15, max_green_s=50)
    ]
    
    flows = {
        "north": 1000,
        "south": 800,
        "east": 1200,
        "west": 1100
    }
    
    result = optimizer.optimize("J001", flows, phase_config=custom_phases)
    
    # Should have 3 phases
    assert len(result.phases) == 3
    
    # Check phase names
    phase_names = [p["name"] for p in result.phases]
    assert "NORTH" in phase_names
    assert "SOUTH" in phase_names
    assert "EW" in phase_names
    
    print("âœ“ Custom phase config test passed")


if __name__ == "__main__":
    print("Running Webster Optimizer Unit Tests...\n")
    
    try:
        test_optimizer_initialization()
        test_basic_optimization()
        test_oversaturation_handling()
        test_low_flow_optimization()
        test_compare_with_fixed()
        test_unbalanced_flows()
        test_old_city_junction()
        test_nh48_junction()
        test_result_to_dict()
        test_custom_phase_config()
        
        print("\nâœ… All Webster Optimizer tests passed!")
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

