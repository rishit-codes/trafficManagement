"""
Test script for historical traffic data system.
Demonstrates all features: data collection, analytics, forecasting.
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.src.database import traffic_store
from backend.src.data_collector import SyntheticDataGenerator
from backend.src.traffic_analytics import analytics
from backend.src.traffic_forecaster import forecaster
from datetime import datetime


def test_database():
    """Test database operations."""
    print("\n=== Testing Database ===")
    
    # Store a sample record
    record_id = traffic_store.store_traffic_data(
        junction_id="J001",
        direction="north",
        vehicle_counts={"car": 10, "bus": 2, "motorcycle": 5},
        total_pcu=15.5,
        queue_length=8,
        weather="clear"
    )
    print(f"[OK] Stored record with ID: {record_id}")
    
    # Get record count
    count = traffic_store.get_record_count("J001")
    print(f"[OK] Total records for J001: {count}")


def test_synthetic_data():
    """Generate synthetic data for testing."""
    print("\n=== Generating Synthetic Data ===")
    
    count = SyntheticDataGenerator.generate_daily_pattern(
        junction_id="J001",
        days=7,
        base_pcu=600
    )
    print(f"[OK] Generated {count} synthetic records")


def test_analytics():
    """Test analytics functions."""
    print("\n=== Testing Analytics ===")
    
    # Get time-of-day patterns
    patterns = analytics.get_time_of_day_patterns("J001", days_back=7)
    print(f"[OK] Retrieved {len(patterns)} hourly patterns")
    
    # Show peak hours
    peak_hours = analytics.get_peak_hours("J001", days_back=7, top_n=3)
    print("\n[PEAK HOURS] Top 3:")
    for i, peak in enumerate(peak_hours, 1):
        print(f"  {i}. Hour {peak['hour']}:00 - Avg PCU: {peak['avg_pcu']:.1f}")
    
    # Test anomaly detection
    anomaly = analytics.detect_anomaly("J001", current_pcu=1500, direction="north")
    print(f"\n[ANOMALY] Detection (1500 PCU):")
    print(f"  Is Anomaly: {anomaly['is_anomaly']}")
    if anomaly['is_anomaly']:
        print(f"  Type: {anomaly['anomaly_type']}")
        print(f"  Severity: {anomaly['severity']}")


def test_forecasting():
    """Test forecasting functions."""
    print("\n=== Testing Forecasting ===")
    
    # Forecast next 30 minutes
    forecast = forecaster.predict_next_30min("J001", method="pattern")
    print(f"\n[FORECAST] 30-Minute:")
    print(f"  Predicted PCU: {forecast.get('predicted_pcu', 'N/A')}")
    print(f"  Confidence: {forecast.get('confidence', 'N/A')}")
    print(f"  Method: {forecast.get('method', 'N/A')}")
    
    # Get forecast confidence
    confidence_assessment = forecaster.get_forecast_confidence("J001")
    print(f"\n[CONFIDENCE] Assessment:")
    print(f"  Overall: {confidence_assessment['overall_confidence']}")
    print(f"  Record Count: {confidence_assessment['record_count']}")
    print(f"  Data Coverage: {confidence_assessment.get('data_coverage_pct', 0)}%")


def main():
    """Run all tests."""
    print("=" * 60)
    print("HISTORICAL TRAFFIC DATA SYSTEM - TEST SUITE")
    print("=" * 60)
    
    try:
        # Test 1: Database
        test_database()
        
        # Test 2: Generate synthetic data
        test_synthetic_data()
        
        # Test 3: Analytics
        test_analytics()
        
        # Test 4: Forecasting
        test_forecasting()
        
        print("\n" + "=" * 60)
        print("[SUCCESS] ALL TESTS PASSED!")
        print("=" * 60)
        print("\nHistorical data system is fully operational.")
        print("You can now:")
        print("  1. Start the API: uvicorn backend.api.main:app --reload")
        print("  2. Test endpoints at: http://localhost:8000/docs")
        print("  3. Generate more data: POST /data/generate-synthetic/J001")
        print("  4. View patterns: GET /analytics/patterns/J001")
        print("  5. Get forecasts: POST /forecast/J001")
        
    except Exception as e:
        print(f"\n[ERROR] TEST FAILED: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
