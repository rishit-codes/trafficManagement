"""
FastAPI Server
Main entry point for the Traffic Management System API.

Features:
- RESTful API for junction data and signal control
- WebSocket for real-time updates
- CORS enabled for dashboard frontend
- Auto-generated OpenAPI docs
"""

import os
import sys
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from backend.src.geometric_database import GeometricDatabase
from backend.src.webster_optimizer import WebsterOptimizer
from backend.src.spillback_detector import SpillbackDetector
from backend.src.signal_controller import SignalController
from backend.src.pcu_converter import PCUConverter

# Import historical data modules
from backend.src.data_collector import data_collector, SyntheticDataGenerator
from backend.src.traffic_analytics import analytics
from backend.src.traffic_forecaster import forecaster

# Import additional routers
from backend.api.routes import traffic_router, corridor_router, greenwave_router

# Global instances (initialized on startup)
geo_db: GeometricDatabase = None
optimizer: WebsterOptimizer = None
spillback: SpillbackDetector = None
controller: SignalController = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize components on startup, cleanup on shutdown."""
    global geo_db, optimizer, spillback, controller
    
    # Get config paths
    base_path = Path(__file__).parent.parent.parent / "config"
    junction_config = str(base_path / "junction_config.json")
    context_config = str(base_path / "vadodara_context.json")
    
    # Initialize components
    print("Initializing Traffic Management System...")
    geo_db = GeometricDatabase(junction_config, context_config)
    optimizer = WebsterOptimizer(geo_db)
    spillback = SpillbackDetector(geo_db)
    controller = SignalController(backend="mock")
    controller.connect()
    print(f"Loaded {len(geo_db.list_junctions())} junctions")
    
    # Initialize historical data collection
    data_collector.start_background_collection()
    print("[OK] Historical data collection started")
    
    yield  # Server runs here
    
    # Cleanup
    data_collector.stop_background_collection()
    controller.disconnect()
    print("Traffic Management System shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="Traffic Management System API",
    description="Geometry-Aware Intelligent Traffic Management for Vadodara Smart City",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include additional routers
app.include_router(traffic_router)
app.include_router(corridor_router)
app.include_router(greenwave_router)


# ===== Health & Info Endpoints =====

@app.get("/", tags=["Info"])
async def root():
    """API root with basic info."""
    return {
        "name": "Traffic Management System",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }


@app.get("/health", tags=["Info"])
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "components": {
            "geo_db": geo_db is not None,
            "optimizer": optimizer is not None,
            "controller": controller is not None
        }
    }


# ===== Junction Endpoints =====

@app.get("/junctions", tags=["Junctions"])
async def list_junctions():
    """List all available junctions."""
    return {
        "junctions": [
            geo_db.to_dict(jid) for jid in geo_db.list_junctions()
        ]
    }


@app.get("/junctions/{junction_id}", tags=["Junctions"])
async def get_junction(junction_id: str):
    """Get detailed info for a specific junction."""
    data = geo_db.to_dict(junction_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Junction {junction_id} not found")
    return data


@app.get("/junctions/{junction_id}/state", tags=["Junctions"])
async def get_junction_state(junction_id: str):
    """
    Get current signal state for a junction.
    
    Returns deterministic signal phasing based on server time.
    Phase cycle: GREEN (30s) → YELLOW (5s) → RED (35s) = 70s total
    """
    from backend.src.signal_state_engine import get_signal_state, signal_state_to_dict
    
    state = get_signal_state(junction_id)
    if not state:
        raise HTTPException(status_code=404, detail=f"Junction {junction_id} not found")
    
    return signal_state_to_dict(state)


# ===== Optimization Endpoints =====

@app.post("/optimize/{junction_id}", tags=["Optimization"])
async def optimize_junction(junction_id: str, flows: Dict[str, float]):
    """
    Calculate optimal signal timing for a junction.
    
    Args:
        junction_id: Junction to optimize
        flows: Traffic flows per approach, e.g. {"north": 800, "south": 750, "east": 1200, "west": 1100}
    
    Returns:
        Optimized timing plan
    """
    try:
        result = optimizer.optimize(junction_id, flows)
        
        # Store optimization data for historical analysis
        data_collector.collect_optimization_data(
            junction_id=junction_id,
            flows=flows,
            optimization_result=result.to_dict()
        )
        
        return result.to_dict()
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/optimize/{junction_id}/compare", tags=["Optimization"])
async def compare_timing(junction_id: str, flows: Dict[str, float]):
    """Compare optimized timing with current fixed timing."""
    try:
        return optimizer.compare_with_fixed(junction_id, flows)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@app.post("/optimize/{junction_id}/apply", tags=["Optimization"])
async def apply_optimized_timing(junction_id: str, flows: Dict[str, float]):
    """Calculate and apply optimized timing to signal controller."""
    try:
        result = optimizer.optimize(junction_id, flows)
        success = controller.apply_timing(junction_id, result.to_dict())
        return {
            "applied": success,
            "timing": result.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ===== Spillback Endpoints =====

@app.post("/spillback/{junction_id}", tags=["Spillback"])
async def analyze_spillback(junction_id: str, queues: Dict[str, int]):
    """
    Analyze spillback risk for a junction.
    
    Args:
        junction_id: Junction to analyze
        queues: Queue lengths per approach, e.g. {"north": 15, "south": 12, "east": 35, "west": 8}
    """
    try:
        status = spillback.analyze(junction_id, queues)
        return spillback.to_dict(status)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ===== Emergency Endpoints =====

@app.post("/emergency/{junction_id}", tags=["Emergency"])
async def trigger_emergency_preemption(junction_id: str, direction: str):
    """
    Trigger emergency vehicle preemption.
    Creates green corridor for emergency vehicles.
    """
    success = controller.trigger_emergency_preemption(junction_id, direction)
    return {
        "success": success,
        "junction_id": junction_id,
        "direction": direction,
        "action": "EMERGENCY_PREEMPTION"
    }


# ===== Vision Processing Endpoints =====

@app.get("/vision/metrics", tags=["Vision"])
async def get_vision_metrics():
    """
    Get runtime performance metrics for the vision system.
    
    This endpoint exposes runtime performance metrics.
    Model accuracy is evaluated offline using standard datasets
    and is not displayed in the live control UI.
    """
    from backend.src.vision_metrics import vision_collector
    return vision_collector.get_metrics()


@app.post("/vision/process/{junction_id}", tags=["Vision"])
async def process_camera_frame(junction_id: str, vehicle_counts: Dict[str, int]):
    """
    Process vehicle detection data from vision module.
    Converts to PCU and generates optimization recommendation.
    
    Args:
        junction_id: Junction being monitored
        vehicle_counts: Dict like {"car": 10, "motorcycle": 25, "bus": 3}
    
    Returns:
        Combined detection + optimization result
    """
    try:
        # Update metrics collector (simulation of runtime stats)
        # In a real system, this happens in the detection loop, not the API handler
        from backend.src.vision_metrics import vision_collector
        import random
        
        # Simulate inference time variance (40-60ms)
        simulated_inference_ms = 40.0 + (random.random() * 20.0)
        vision_collector.update(simulated_inference_ms, list(vehicle_counts.keys()))

        # Convert to PCU
        converter = PCUConverter()
        total_pcu = converter.convert(vehicle_counts)
        
        # NOTE: MVP Limitation - Equal flow distribution
        # In production, this should:
        # 1. Accept per-direction vehicle counts from the camera
        # 2. Aggregate flows over a time window (e.g., last 5 minutes)
        # 3. Use historical patterns to estimate actual directional flows
        # For hackathon demo, we distribute equally across all directions
        flows = {direction: total_pcu / 4 for direction in ["north", "south", "east", "west"]}
        
        # Optimize
        result = optimizer.optimize(junction_id, flows)
        
        return {
            "junction_id": junction_id,
            "vehicle_counts": vehicle_counts,
            "total_pcu": total_pcu,
            "optimization": result.to_dict()
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# ===== PCU Conversion Endpoint =====

@app.post("/pcu/convert", tags=["Utilities"])
async def convert_to_pcu(vehicle_counts: Dict[str, int]):
    """
    Convert vehicle counts to PCU.
    
    Args:
        vehicle_counts: e.g. {"car": 10, "motorcycle": 25, "bus": 3}
    
    Returns:
        Total PCU value
    """
    converter = PCUConverter()
    pcu = converter.convert(vehicle_counts)
    return {
        "vehicle_counts": vehicle_counts,
        "total_pcu": pcu
    }


# ===== Historical Data Endpoints =====

@app.get("/history/{junction_id}", tags=["Historical Data"])
async def get_traffic_history(
    junction_id: str,
    hours: int = 24,
    direction: str = None
):
    """
    Get historical traffic data for a junction.
    
    Args:
        junction_id: Junction to query
        hours: Hours of history to retrieve (default: 24)
        direction: Filter by direction (optional)
    
    Returns:
        List of historical traffic records
    """
    from datetime import datetime, timedelta
    from backend.src.database import traffic_store
    
    end_time = datetime.now()
    start_time = end_time - timedelta(hours=hours)
    
    history = traffic_store.get_history(
        junction_id=junction_id,
        start_time=start_time,
        end_time=end_time,
        direction=direction,
        limit=1000
    )
    
    return {
        "junction_id": junction_id,
        "start_time": start_time.isoformat(),
        "end_time": end_time.isoformat(),
        "record_count": len(history),
        "data": history
    }


@app.get("/analytics/patterns/{junction_id}", tags=["Analytics"])
async def get_traffic_patterns(junction_id: str, pattern_type: str = "hourly"):
    """
    Get traffic patterns for a junction.
    
    Args:
        junction_id: Junction to analyze
        pattern_type: Type of pattern ('hourly' or 'daily')
    
    Returns:
        Traffic patterns
    """
    if pattern_type == "hourly":
        patterns = analytics.get_time_of_day_patterns(junction_id)
        return {
            "junction_id": junction_id,
            "pattern_type": "hourly",
            "patterns": patterns
        }
    elif pattern_type == "daily":
        patterns = analytics.get_day_of_week_patterns(junction_id)
        return {
            "junction_id": junction_id,
            "pattern_type": "daily",
            "patterns": patterns
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid pattern_type. Use 'hourly' or 'daily'")


@app.get("/analytics/anomalies/{junction_id}", tags=["Analytics"])
async def detect_anomalies(junction_id: str, current_pcu: Optional[float] = None, direction: Optional[str] = None):
    """
    Detect if current traffic is anomalous.
    
    Args:
        junction_id: Junction to analyze
        current_pcu: Current PCU value. If None, returns empty list (no anomaly check).
        direction: Traffic direction (optional)
    
    Returns:
        Anomaly detection results or empty list
    """
    if current_pcu is None:
        return []

    result = analytics.detect_anomaly(
        junction_id=junction_id,
        current_pcu=current_pcu,
        direction=direction
    )
    
    return result


@app.get("/analytics/performance/{junction_id}", tags=["Analytics"])
async def get_performance_metrics(junction_id: str, days: int = 7):
    """
    Get performance metrics for a junction.
    
    Args:
        junction_id: Junction to analyze
        days: Number of days to analyze (default: 7)
    
    Returns:
        Performance metrics
    """
    from datetime import datetime, timedelta
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    metrics = analytics.calculate_performance_metrics(
        junction_id=junction_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return metrics


@app.post("/forecast/{junction_id}", tags=["Forecasting"])
async def forecast_traffic(
    junction_id: str,
    horizon_minutes: int = 30,
    method: str = "pattern"
):
    """
    Forecast traffic for a junction.
    
    Args:
        junction_id: Junction to forecast for
        horizon_minutes: Minutes into the future (30 or 60)
        method: Prediction method ('pattern', 'moving_avg', 'exponential')
    
    Returns:
        Traffic forecast
    """
    if horizon_minutes <= 30:
        forecast = forecaster.predict_next_30min(junction_id, method=method)
    elif horizon_minutes <= 60:
        forecast = forecaster.predict_next_hour(junction_id, method=method)
    else:
        raise HTTPException(status_code=400, detail="Horizon must be 30 or 60 minutes")
    
    return forecast


@app.get("/forecast/{junction_id}/by-direction", tags=["Forecasting"])
async def forecast_by_direction(
    junction_id: str,
    horizon_minutes: int = 30,
    method: str = "pattern"
):
    """
    Forecast traffic for all directions at a junction.
    
    Args:
        junction_id: Junction to forecast for
        horizon_minutes: Minutes into the future
        method: Prediction method
    
    Returns:
        Forecasts for each direction
    """
    forecasts = forecaster.predict_by_direction(
        junction_id=junction_id,
        minutes_ahead=horizon_minutes,
        method=method
    )
    
    return {
        "junction_id": junction_id,
        "horizon_minutes": horizon_minutes,
        "method": method,
        "forecasts": forecasts
    }


# ===== Data Management Endpoints =====

@app.post("/data/generate-synthetic/{junction_id}", tags=["Data Management"])
async def generate_synthetic_data(junction_id: str, days: int = 7):
    """
    Generate synthetic historical data for demo purposes.
    
    Args:
        junction_id: Junction to generate data for
        days: Number of days of history to generate
    
    Returns:
        Number of records generated
    """
    count = SyntheticDataGenerator.generate_daily_pattern(
        junction_id=junction_id,
        days=days
    )
    
    return {
        "junction_id": junction_id,
        "days_generated": days,
        "records_created": count,
        "message": f"Generated {count} synthetic traffic records"
    }


@app.get("/data/stats", tags=["Data Management"])
async def get_data_stats():
    """
    Get database statistics.
    
    Returns:
        Database statistics
    """
    from backend.src.database import traffic_store
    
    total_records = traffic_store.get_record_count()
    
    return {
        "total_records": total_records,
        "database_status": "operational"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
