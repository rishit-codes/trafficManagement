"""
Quick API Test Script
Tests the main endpoints to verify API functionality.
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n[TEST] Testing /health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_list_junctions():
    """Test junction listing"""
    print("\n[TEST] Testing /junctions endpoint...")
    response = requests.get(f"{BASE_URL}/junctions")
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Found {len(data['junctions'])} junctions")
    for j in data['junctions']:
        print(f"  - {j['id']}: {j['name']}")
    return response.status_code == 200

def test_optimize():
    """Test optimization endpoint"""
    print("\n[TEST] Testing /optimize/J001 endpoint...")
    
    flows = {
        "north": 800,
        "south": 750,
        "east": 1200,
        "west": 1100
    }
    
    response = requests.post(f"{BASE_URL}/optimize/J001", json=flows)
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Optimized Cycle: {data['cycle_length_s']}s")
    print(f"Flow Ratios: {data['sum_flow_ratios']}")
    print(f"Oversaturated: {data['is_oversaturated']}")
    
    for phase in data['phases']:
        print(f"  Phase {phase['name']}: Green={phase['green_s']}s, Yellow={phase['yellow_s']}s")
    
    return response.status_code == 200

def test_pcu_conversion():
    """Test PCU conversion"""
    print("\n[TEST] Testing /pcu/convert endpoint...")
    
    vehicle_counts = {
        "car": 10,
        "motorcycle": 25,
        "bus": 3,
        "truck": 2
    }
    
    response = requests.post(f"{BASE_URL}/pcu/convert", json=vehicle_counts)
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Vehicle Counts: {data['vehicle_counts']}")
    print(f"Total PCU: {data['total_pcu']}")
    
    return response.status_code == 200

def test_spillback():
    """Test spillback analysis"""
    print("\n[TEST] Testing /spillback/J001 endpoint...")
    
    queues = {
        "north": 15,
        "south": 12,
        "east": 35,  # High queue
        "west": 8
    }
    
    response = requests.post(f"{BASE_URL}/spillback/J001", json=queues)
    data = response.json()
    print(f"Status: {response.status_code}")
    print(f"Overall Status: {data['overall_status']}")
    print(f"Recommendation: {data['recommended_action']}")
    
    return response.status_code == 200

if __name__ == "__main__":
    print("=" * 60)
    print("Traffic Management System - API Test")
    print("=" * 60)
    
    try:
        results = []
        results.append(("Health Check", test_health()))
        results.append(("List Junctions", test_list_junctions()))
        results.append(("Optimize Timing", test_optimize()))
        results.append(("PCU Conversion", test_pcu_conversion()))
        results.append(("Spillback Analysis", test_spillback()))
        
        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        
        for name, passed in results:
            status = "[PASS]" if passed else "[FAIL]"
            print(f"{status} - {name}")
        
        total_passed = sum(1 for _, p in results if p)
        print(f"\nTotal: {total_passed}/{len(results)} tests passed")
        
        if total_passed == len(results):
            print("\nAll API endpoints working!")
        
    except requests.exceptions.ConnectionError:
        print("\nError: Could not connect to API")
        print("Make sure the server is running: python api/main.py")
    except Exception as e:
        print(f"\nError: {e}")
