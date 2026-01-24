# 🤖 AGENTIC IDE IMPLEMENTATION PROMPT
## Geometry-Aware Traffic Management System - Phase 1 Critical Features

---

## 📋 CONTEXT FOR AI AGENT

You are an expert AI coding agent tasked with implementing Phase 1 critical features for an innovative traffic management system. This system has already completed:

✅ **Core Infrastructure**
- FastAPI backend (12+ endpoints)
- React dashboard with 7 components
- Core algorithms: PCU converter, Webster optimizer, Spillback detector, Vision module
- SUMO simulation framework
- 39/39 unit tests passing

🎯 **Your Mission:**
Implement 4 game-changing features that will transform this from a good traffic system into a **hackathon-winning, city-changing platform**.

---

## 🚀 PHASE 1: CRITICAL FEATURES TO IMPLEMENT

### ⚠️ IMPLEMENTATION PRIORITY (MANDATORY ORDER)

**IMPLEMENT IN THIS EXACT ORDER:**

1. **AI Traffic Conductor** (Foundation - Everything else builds on this)
2. **Multi-Modal Harmony System** (Depends on AI Conductor)
3. **Green Corridor Creation** (Depends on Multi-Modal + AI Conductor)
4. **Emergency Response Superhighway** (Depends on all above)

**WHY THIS ORDER?**
- AI Conductor provides prediction engine used by other features
- Multi-Modal provides vehicle classification used by Emergency Response
- Green Corridor uses corridor optimization shared with Emergency Response
- Emergency Response is most complex, needs all other components

---

## 🎯 FEATURE 1: AI TRAFFIC CONDUCTOR

### **Files to Create/Modify:**

```
src/ai_traffic_conductor.py          # NEW - Main conductor logic
src/prediction_engine.py               # NEW - Time-series forecasting
src/event_mode_manager.py              # NEW - Event detection & profiles
src/learning_engine.py                 # NEW - Self-improvement logic
api/routes/conductor_routes.py         # NEW - API endpoints
dashboard/src/components/ConductorPanel.jsx  # NEW - UI component
tests/test_ai_conductor.py             # NEW - Test suite
simulation/conductor_simulation.py     # NEW - SUMO integration
```

---

### **Implementation Roadmap: AI Traffic Conductor**

#### **STEP 1: Prediction Engine (Time-Series Forecasting)**

**File:** `src/prediction_engine.py`

**Requirements:**
```python
class PredictionEngine:
    """
    Predicts traffic volume 15-30 minutes ahead using ARIMA model.
    Enables proactive signal adjustment before congestion forms.
    """
    
    def __init__(self):
        # Initialize ARIMA model
        # Store historical data (30 days × 288 intervals/day)
        pass
    
    def train_model(self, historical_data: Dict) -> None:
        """
        Train ARIMA model on historical traffic data.
        
        Args:
            historical_data: Dict with structure:
                {
                    "junction_id": "J001",
                    "approach": "north",
                    "timestamps": [...],  # 30 days of 5-min intervals
                    "vehicle_counts": [...],  # corresponding counts
                    "day_of_week": [...],  # 0-6 for Mon-Sun
                    "is_holiday": [...],  # boolean
                    "weather": [...]  # rain/clear/fog
                }
        
        Returns:
            None (stores trained model internally)
        """
        # Use statsmodels ARIMA or pmdarima auto_arima
        # Parameters: p=2, d=1, q=2 (good starting point)
        # Consider seasonal component (weekly patterns)
        pass
    
    def predict(self, junction_id: str, approach: str, 
                horizon_minutes: int = 30) -> Dict:
        """
        Predict traffic volume for next N minutes.
        
        Args:
            junction_id: Junction identifier
            approach: "north", "south", "east", "west"
            horizon_minutes: How far ahead to predict (15-30 min)
        
        Returns:
            {
                "predicted_volumes": [850, 870, 890, ...],  # per 5-min interval
                "confidence_intervals": [(800, 900), ...],
                "confidence_score": 0.85,  # 0-1
                "recommendation": "increase_green_time" or "no_action"
            }
        """
        # Generate prediction using trained ARIMA model
        # Calculate confidence based on prediction interval width
        # Provide actionable recommendation
        pass
    
    def update_with_actual(self, junction_id: str, approach: str,
                          actual_volume: int, timestamp: datetime) -> None:
        """
        Update model with actual observed data for continuous learning.
        """
        pass
    
    def calculate_accuracy(self) -> float:
        """
        Calculate prediction accuracy over last N predictions.
        
        Returns:
            Accuracy percentage (0-100)
        """
        pass
```

**Key Libraries:**
- `statsmodels` for ARIMA
- `pmdarima` for auto-ARIMA (automatic parameter tuning)
- `numpy` for array operations
- `pandas` for time series handling

**Critical Implementation Notes:**
- Store last 30 days of data (8,640 data points per junction-approach)
- Retrain model weekly (every Sunday at 2 AM)
- Use 80/20 train-test split for validation
- Handle missing data (holidays, camera outages)
- Implement separate models for weekday vs weekend
- Consider weather adjustment factor (rain reduces traffic by ~20%)

---

#### **STEP 2: Event Mode Manager**

**File:** `src/event_mode_manager.py`

**Requirements:**
```python
class EventModeManager:
    """
    Detects special traffic events and applies appropriate signal profiles.
    Events: Stadium exit, school hours, festivals, rain, accidents.
    """
    
    # Event profiles (timing adjustments)
    EVENT_PROFILES = {
        "STADIUM_EXIT": {
            "description": "Major event ending, high egress traffic",
            "green_time_multiplier": 1.5,  # 50% longer green on exit routes
            "cycle_length": 120,  # longer cycle for high volume
            "duration_minutes": 60,
            "priority_approaches": ["north", "east"]  # away from stadium
        },
        "SCHOOL_HOURS": {
            "description": "School start/end times",
            "pedestrian_green_multiplier": 1.67,  # 15s → 25s
            "vehicle_speed_limit": 30,  # kmph
            "duration_minutes": 60,
            "active_times": ["07:30-08:30", "14:00-15:00"]
        },
        "RAIN_MODE": {
            "description": "Wet road conditions",
            "yellow_time_multiplier": 1.67,  # 3s → 5s (longer stopping distance)
            "cycle_length_multiplier": 1.1,  # 10% longer cycles
            "speed_adjustment": 0.8,  # expect 20% slower traffic
            "duration_minutes": "auto"  # until rain stops
        },
        "FESTIVAL_MODE": {
            "description": "Large gathering/procession",
            "all_red_duration": 30,  # block all vehicle traffic
            "pedestrian_only": True,
            "manual_override": True,  # police control
            "duration_minutes": "manual"
        }
    }
    
    def detect_event_type(self, traffic_data: Dict, weather_data: Dict,
                         calendar: Dict, current_time: datetime) -> str:
        """
        Analyze conditions to detect active event type.
        
        Args:
            traffic_data: Real-time traffic volumes per approach
            weather_data: Current weather conditions (rain, fog, etc)
            calendar: Event calendar with dates/times
            current_time: Current timestamp
        
        Returns:
            Event type string or "NORMAL" if no event detected
        """
        # Detection logic:
        # 1. Check time-based events (school hours, scheduled events)
        # 2. Check weather-based events (rain, fog)
        # 3. Check traffic pattern anomalies (stadium exit, accident)
        # 4. Priority: Manual > Weather > Scheduled > Pattern
        pass
    
    def apply_event_profile(self, junction_id: str, event_type: str) -> Dict:
        """
        Apply event-specific signal timing adjustments.
        
        Returns:
            Modified signal timing parameters
        """
        pass
    
    def is_stadium_exit(self, traffic_data: Dict) -> bool:
        """
        Detect stadium exit pattern:
        - Sudden spike (500+ vehicles in 10 min)
        - Concentrated in 1-2 approaches
        - Time window: 60-90 min after scheduled event
        """
        pass
    
    def is_school_hours(self, current_time: datetime) -> bool:
        """Check if current time is within school start/end windows."""
        pass
```

**Detection Strategies:**

**Stadium Exit:**
```python
def is_stadium_exit(self, traffic_data):
    # Get last 10 minutes of data
    recent_counts = traffic_data["last_10_minutes"]
    
    # Check for sudden spike
    current_volume = sum(recent_counts[-2:])  # last 2 intervals (10 min)
    historical_avg = get_historical_average(current_time)
    
    spike_ratio = current_volume / historical_avg
    
    # Stadium exit pattern: 3x normal traffic concentrated in 1-2 directions
    if spike_ratio > 3.0 and is_concentrated_in_few_directions(traffic_data):
        # Verify with event calendar
        if is_stadium_event_scheduled_recently():
            return True
    
    return False
```

**Rain Detection:**
```python
def is_rain_mode(self, weather_data, traffic_data):
    # Method 1: Weather API
    if weather_data.get("precipitation") > 0.1:  # mm/hr
        return True
    
    # Method 2: Traffic speed reduction (backup)
    current_speed = calculate_average_speed(traffic_data)
    historical_speed = get_historical_speed(current_time)
    
    if current_speed < 0.85 * historical_speed:  # 15%+ slower
        # Likely rain (or major incident)
        return True
    
    return False
```

---

#### **STEP 3: Learning Engine**

**File:** `src/learning_engine.py`

**Requirements:**
```python
class LearningEngine:
    """
    Continuously improves system performance by analyzing what worked/didn't work.
    Implements feedback loop: collect → analyze → learn → adapt.
    """
    
    def __init__(self):
        self.performance_database = PerformanceDatabase()
        self.improvement_rate = []  # track weekly improvement
        pass
    
    def collect_performance_data(self, junction_id: str, 
                                 interval_start: datetime,
                                 interval_end: datetime) -> Dict:
        """
        Collect comprehensive performance metrics for analysis.
        
        Returns:
            {
                "avg_waiting_time": 32.5,  # seconds
                "queue_length_max": 12,  # vehicles
                "spillback_events": 0,
                "throughput": 680,  # vehicles per hour
                "stop_rate": 0.45,  # percentage of vehicles that stopped
                "signal_timing_used": {...},  # what timing was active
                "prediction_accuracy": 0.82,  # if prediction was made
                "weather_conditions": "clear",
                "traffic_volume_actual": 850,
                "traffic_volume_predicted": 820  # if available
            }
        """
        pass
    
    def nightly_analysis(self, date: datetime.date) -> Dict:
        """
        Run comprehensive analysis of entire day's performance.
        Execute at 2:00 AM when traffic is minimal.
        
        Returns:
            {
                "prediction_accuracy_overall": 0.84,
                "best_performing_junctions": [...],
                "worst_performing_junctions": [...],
                "new_patterns_detected": [...],
                "optimization_opportunities": [...],
                "model_update_recommendations": [...]
            }
        """
        # Compare predicted vs actual for every junction-approach
        # Identify systematic errors (always over/under predicting?)
        # Detect new patterns (new residential complex opened?)
        # Find signal timings that worked better than expected
        pass
    
    def update_models(self, analysis_results: Dict) -> None:
        """
        Update prediction models based on analysis.
        Executed weekly (Sunday 3:00 AM).
        """
        # Retrain ARIMA models with last 30 days of data
        # Adjust optimization parameters if needed
        # Update event detection thresholds
        pass
    
    def calculate_improvement_rate(self) -> float:
        """
        Calculate week-over-week improvement in key metrics.
        
        Returns:
            Percentage improvement (e.g., 2.3 means 2.3% better this week)
        """
        # Compare this week's metrics to last week
        # Weighted average: waiting time (40%), throughput (30%), 
        #                   prediction accuracy (20%), user satisfaction (10%)
        pass
    
    def generate_insights_report(self) -> Dict:
        """
        Generate human-readable insights for traffic engineers.
        
        Returns:
            {
                "insights": [
                    "Junction J003 prediction accuracy improved 8% after model update",
                    "Rain mode activation threshold too sensitive, reduced from 0.1mm to 0.3mm",
                    "New traffic pattern detected: Increased evening traffic on Wednesdays (new mall)"
                ],
                "recommendations": [
                    "Consider adding bus priority at J005 (high bus volume detected)",
                    "J007 spillback events increasing, may need cycle length adjustment"
                ]
            }
        """
        pass
```

**Learning Metrics to Track:**
1. Prediction Accuracy (target: >80%)
2. Signal Timing Effectiveness (actual improvement vs expected)
3. User Satisfaction (from citizen app feedback)
4. Safety Metrics (near-miss events, spillback frequency)
5. Environmental Metrics (emissions reduction)

---

#### **STEP 4: Main AI Traffic Conductor**

**File:** `src/ai_traffic_conductor.py`

**Requirements:**
```python
class AITrafficConductor:
    """
    Master orchestrator that coordinates prediction, events, and learning
    to create proactive, adaptive traffic management.
    """
    
    def __init__(self):
        self.prediction_engine = PredictionEngine()
        self.event_manager = EventModeManager()
        self.learning_engine = LearningEngine()
        self.webster_optimizer = WebsterOptimizer()  # existing
        pass
    
    def conduct_network(self, junction_ids: List[str]) -> Dict:
        """
        Main orchestration loop - runs every 60 seconds for entire network.
        
        Args:
            junction_ids: List of all junctions to optimize
        
        Returns:
            {
                "optimizations_applied": 12,
                "predictions_made": 8,
                "events_detected": 1,
                "status": "ACTIVE"
            }
        """
        results = {}
        
        for junction_id in junction_ids:
            # Step 1: Check for active events
            event_type = self.event_manager.detect_event_type(...)
            
            # Step 2: Get traffic prediction (if no special event)
            if event_type == "NORMAL":
                prediction = self.prediction_engine.predict(junction_id, ...)
            
            # Step 3: Calculate optimal signal timing
            optimal_timing = self._calculate_optimal_timing(
                junction_id, event_type, prediction
            )
            
            # Step 4: Apply timing (if significantly different from current)
            if self._should_update(current_timing, optimal_timing):
                self._apply_timing(junction_id, optimal_timing)
                results[junction_id] = "UPDATED"
            
            # Step 5: Collect performance data for learning
            self.learning_engine.collect_performance_data(junction_id, ...)
        
        return results
    
    def _calculate_optimal_timing(self, junction_id: str, 
                                  event_type: str, 
                                  prediction: Dict) -> Dict:
        """
        Combine event profile + prediction + current conditions
        to calculate optimal signal timing.
        """
        # Start with base Webster optimization
        base_timing = self.webster_optimizer.optimize(junction_id)
        
        # Apply event profile adjustments if needed
        if event_type != "NORMAL":
            profile = self.event_manager.EVENT_PROFILES[event_type]
            timing = self._apply_event_adjustments(base_timing, profile)
        else:
            timing = base_timing
        
        # Apply predictive adjustments
        if prediction["confidence_score"] > 0.8:
            if prediction["recommendation"] == "increase_green_time":
                timing = self._increase_green_time(timing, approach=...)
        
        return timing
    
    def _should_update(self, current: Dict, proposed: Dict) -> bool:
        """
        Decide if timing change is worth disrupting current operation.
        
        Rules:
        - Don't change if difference < 5 seconds
        - Don't change more than once per 5 minutes (stability)
        - Always change for emergency events
        """
        pass
    
    def _apply_timing(self, junction_id: str, timing: Dict) -> None:
        """
        Send updated timing to signal controller.
        Implement gradual transition (over 1-2 cycles).
        """
        pass
    
    def enable_breathing_mode(self, corridor: List[str], 
                             cycle_duration: int = 90) -> Dict:
        """
        Activate coordinated "inhale/exhale" pattern for corridor.
        
        Args:
            corridor: List of junction IDs in sequence
            cycle_duration: Duration of inhale+exhale cycle (seconds)
        
        Returns:
            {
                "status": "ACTIVE",
                "inhale_duration": 54,  # 60% of cycle
                "exhale_duration": 36,  # 40% of cycle
                "sync_status": "6/6 junctions synchronized"
            }
        """
        # Calculate offsets for synchronized inhale/exhale
        # Inhale: All entry points green, exits red
        # Exhale: All entry points red, exits green
        # Smooths traffic flow, prevents gridlock
        pass
```

---

#### **STEP 5: API Endpoints**

**File:** `api/routes/conductor_routes.py`

**Endpoints to Implement:**
```python
from fastapi import APIRouter, HTTPException
from typing import Dict, List

router = APIRouter(prefix="/api/conductor", tags=["AI Traffic Conductor"])

@router.post("/predict")
async def predict_traffic(
    junction_id: str,
    approach: str,
    horizon_minutes: int = 30,
    confidence_threshold: float = 0.8
) -> Dict:
    """
    Get traffic prediction for junction approach.
    """
    pass

@router.post("/activate-event-mode")
async def activate_event_mode(
    mode: str,  # STADIUM_EXIT, SCHOOL_HOURS, RAIN_MODE, FESTIVAL_MODE
    area: str,  # description or junction IDs
    duration_minutes: int = None,  # None for auto-duration
    auto_deactivate: bool = True
) -> Dict:
    """
    Manually activate specific event mode.
    """
    pass

@router.get("/learning-stats")
async def get_learning_stats() -> Dict:
    """
    Get learning engine performance statistics.
    """
    pass

@router.post("/breathing-mode")
async def activate_breathing_mode(
    corridor: str,  # "NH-48" or list of junction IDs
    cycle_duration: int = 90,
    inhale_ratio: float = 0.6
) -> Dict:
    """
    Activate breathing pattern for corridor.
    """
    pass

@router.get("/status")
async def get_conductor_status() -> Dict:
    """
    Get overall conductor system status.
    """
    pass

@router.get("/insights")
async def get_insights_report(
    date: str = "today"  # or specific date
) -> Dict:
    """
    Get learning engine insights and recommendations.
    """
    pass
```

---

#### **STEP 6: Dashboard Component**

**File:** `dashboard/src/components/ConductorPanel.jsx`

**Component Structure:**
```javascript
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ConductorPanel({ junctionId }) {
  const [prediction, setPrediction] = useState(null);
  const [eventMode, setEventMode] = useState('NORMAL');
  const [learningStats, setLearningStats] = useState(null);
  
  // Fetch prediction data
  useEffect(() => {
    const fetchPrediction = async () => {
      const response = await fetch(`/api/conductor/predict?junction_id=${junctionId}`);
      const data = await response.json();
      setPrediction(data);
    };
    
    fetchPrediction();
    const interval = setInterval(fetchPrediction, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [junctionId]);
  
  return (
    <div className="conductor-panel">
      {/* Prediction Timeline Visualization */}
      <div className="prediction-section">
        <h3><Brain /> Traffic Prediction</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={prediction?.timeline}>
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="predicted" stroke="#3b82f6" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="confidence_lower" stroke="#93c5fd" />
            <Line type="monotone" dataKey="confidence_upper" stroke="#93c5fd" />
          </LineChart>
        </ResponsiveContainer>
        <div className="prediction-info">
          <span>Confidence: {prediction?.confidence_score * 100}%</span>
          <span>Recommendation: {prediction?.recommendation}</span>
        </div>
      </div>
      
      {/* Event Mode Indicator */}
      <div className={`event-mode ${eventMode !== 'NORMAL' ? 'active' : ''}`}>
        {eventMode !== 'NORMAL' && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="event-badge"
          >
            <AlertCircle /> {eventMode} MODE ACTIVE
          </motion.div>
        )}
      </div>
      
      {/* Learning Progress Panel */}
      <div className="learning-section">
        <h3><TrendingUp /> System Learning</h3>
        <div className="metrics-grid">
          <div className="metric">
            <label>Prediction Accuracy</label>
            <div className="progress-bar">
              <div className="progress" style={{ width: `${learningStats?.prediction_accuracy || 0}%` }} />
            </div>
            <span>{learningStats?.prediction_accuracy || 0}%</span>
          </div>
          <div className="metric">
            <label>Improvement Rate</label>
            <span className="trend-up">+{learningStats?.improvement_rate || 0}%/week</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

#### **STEP 7: SUMO Integration**

**File:** `simulation/conductor_simulation.py`

**Purpose:** Validate AI Conductor performance in simulation

**Key Functions:**
```python
def simulate_with_prediction(network_file, routes_file, duration=3600):
    """
    Run SUMO simulation with AI Conductor prediction enabled.
    Compare to baseline (no prediction).
    """
    # Load SUMO network
    # Enable AI Conductor
    # Run simulation
    # Collect metrics: waiting time, throughput, stops
    # Compare to baseline
    pass

def simulate_event_mode(event_type='STADIUM_EXIT', duration=3600):
    """
    Simulate specific event scenario.
    """
    # Create event traffic pattern
    # Activate event mode
    # Run simulation
    # Measure effectiveness
    pass

def validate_learning_improvement():
    """
    Simulate learning process over 30 days.
    Show week-by-week improvement.
    """
    pass
```

---

#### **STEP 8: Testing**

**File:** `tests/test_ai_conductor.py`

**Test Cases:**
```python
import pytest
from src.ai_traffic_conductor import AITrafficConductor
from src.prediction_engine import PredictionEngine

class TestPredictionEngine:
    def test_prediction_accuracy(self):
        """Prediction should be within 15% of actual value."""
        pass
    
    def test_confidence_calculation(self):
        """Confidence score should reflect prediction quality."""
        pass
    
    def test_model_training(self):
        """Model should train without errors on historical data."""
        pass

class TestEventModeManager:
    def test_stadium_exit_detection(self):
        """Should detect stadium exit traffic pattern."""
        pass
    
    def test_rain_mode_activation(self):
        """Should activate rain mode when weather indicates rain."""
        pass
    
    def test_school_hours_timing(self):
        """Should activate school mode during correct time windows."""
        pass

class TestLearningEngine:
    def test_performance_data_collection(self):
        """Should collect all required performance metrics."""
        pass
    
    def test_improvement_rate_calculation(self):
        """Should correctly calculate week-over-week improvement."""
        pass
    
    def test_insights_generation(self):
        """Should generate actionable insights."""
        pass

class TestAITrafficConductor:
    def test_full_orchestration(self):
        """Integration test: all components working together."""
        pass
    
    def test_breathing_mode(self):
        """Should create synchronized inhale/exhale pattern."""
        pass
```

---

## 🎯 FEATURE 2: MULTI-MODAL HARMONY SYSTEM

### **Files to Create/Modify:**

```
src/multimodal_harmony.py              # NEW - Main harmony orchestrator
src/mode_detector.py                   # NEW - Detect different vehicle types
src/mode_priority_manager.py           # NEW - Prioritization logic
src/pedestrian_safety.py               # NEW - Pedestrian-specific logic
api/routes/multimodal_routes.py        # NEW - API endpoints
dashboard/src/components/MultiModalPanel.jsx  # NEW - UI component
tests/test_multimodal.py               # NEW - Test suite
simulation/multimodal_simulation.py    # NEW - SUMO integration
```

---

### **Implementation Roadmap: Multi-Modal Harmony**

#### **STEP 1: Mode Detector (Enhanced Vision)**

**File:** `src/mode_detector.py`

**Purpose:** Classify detected vehicles into transportation modes

**Requirements:**
```python
class ModeDetector:
    """
    Extends YOLOv8 vision to classify vehicles into transportation modes
    and provide mode-specific metadata.
    """
    
    MODE_CHARACTERISTICS = {
        "car": {"pcu": 1.0, "avg_speed": 35, "priority_level": 3},
        "motorcycle": {"pcu": 0.2, "avg_speed": 30, "priority_level": 4},
        "bus": {"pcu": 2.5, "avg_speed": 30, "priority_level": 1},  # Highest
        "truck": {"pcu": 3.0, "avg_speed": 25, "priority_level": 5},
        "auto_rickshaw": {"pcu": 0.5, "avg_speed": 25, "priority_level": 2},
        "bicycle": {"pcu": 0.2, "avg_speed": 15, "priority_level": 1},
        "pedestrian": {"pcu": 0.0, "avg_speed": 1.2, "priority_level": 0}  # Top priority
    }
    
    def __init__(self, vision_module):
        self.vision = vision_module  # existing YOLOv8 module
        self.ev_detector = EVDetector()  # for green license plates
        pass
    
    def detect_and_classify(self, frame: np.ndarray) -> List[Dict]:
        """
        Detect all objects and classify into transportation modes.
        
        Returns:
            [
                {
                    "type": "bus",
                    "bbox": [x1, y1, x2, y2],
                    "confidence": 0.96,
                    "pcu": 2.5,
                    "priority_level": 1,
                    "is_ev": false,
                    "metadata": {...}
                },
                ...
            ]
        """
        # Use existing YOLOv8 detection
        detections = self.vision.detect(frame)
        
        # Enhance with mode-specific info
        classified = []
        for det in detections:
            mode_info = self.MODE_CHARACTERISTICS[det["class"]]
            
            enhanced = {
                **det,
                **mode_info,
                "is_ev": self.ev_detector.check_if_ev(det, frame)
            }
            
            classified.append(enhanced)
        
        return classified
    
    def count_by_mode(self, detections: List[Dict]) -> Dict:
        """
        Count vehicles by mode for optimization.
        
        Returns:
            {
                "car": 45,
                "motorcycle": 28,
                "bus": 3,
                "truck": 5,
                "auto_rickshaw": 12,
                "bicycle": 4,
                "pedestrian": 67
            }
        """
        pass
    
    def calculate_weighted_pcu(self, detections: List[Dict]) -> float:
        """
        Calculate total PCU accounting for all modes.
        """
        return sum(d["pcu"] for d in detections)
    
    def detect_vulnerable_pedestrians(self, detections: List[Dict], 
                                     frame: np.ndarray) -> List[Dict]:
        """
        Identify vulnerable pedestrians (elderly, children, disabled).
        
        Uses:
        - Height analysis (children < 1.2m)
        - Pose estimation (elderly: hunched posture, slow gait)
        - Object detection (wheelchair, walker, cane)
        
        Returns:
            [
                {
                    "type": "pedestrian",
                    "vulnerability": "elderly",  # or "child", "disabled", "normal"
                    "estimated_crossing_speed": 0.8,  # m/s
                    "bbox": [...],
                    "needs_extended_time": true
                },
                ...
            ]
        """
        pass
```

---

#### **STEP 2: Mode Priority Manager**

**File:** `src/mode_priority_manager.py`

**Requirements:**
```python
class ModePriorityManager:
    """
    Manages prioritization of different transportation modes based on
    time of day, mode count, and policy goals.
    """
    
    # Priority matrix (lower number = higher priority)
    PRIORITY_LEVELS = {
        "pedestrian": 0,      # Always highest priority
        "bicycle": 1,         # Encourage cycling
        "bus": 1,             # Encourage public transit
        "auto_rickshaw": 2,   # Important for last-mile connectivity
        "car": 3,             # Standard priority
        "motorcycle": 4,      # Lower priority (pollution)
        "truck": 5            # Lowest (restrict to certain hours)
    }
    
    # Time-based policies
    TIME_POLICIES = {
        "peak_morning": {  # 7-10 AM
            "bus_priority_multiplier": 1.5,
            "bicycle_priority_multiplier": 1.3,
            "truck_restriction": True
        },
        "peak_evening": {  # 5-8 PM
            "bus_priority_multiplier": 1.5,
            "bicycle_priority_multiplier": 1.2,
            "truck_restriction": True
        },
        "off_peak": {
            "all_equal": True
        },
        "night": {  # 10 PM - 6 AM
            "emergency_vehicles_only_priority": True
        }
    }
    
    def calculate_approach_priority(self, approach_detections: List[Dict],
                                    time_of_day: str) -> float:
        """
        Calculate priority score for an approach based on modes present.
        
        Lower score = higher priority = more green time
        
        Args:
            approach_detections: All vehicles detected on this approach
            time_of_day: "peak_morning", "peak_evening", "off_peak", "night"
        
        Returns:
            Priority score (0.0 = highest priority, 1.0 = lowest)
        """
        # Count vehicles by mode
        mode_counts = self._count_by_mode(approach_detections)
        
        # Apply time-based policy
        policy = self.TIME_POLICIES[time_of_day]
        
        # Calculate weighted priority
        priority_score = 0.0
        total_vehicles = sum(mode_counts.values())
        
        for mode, count in mode_counts.items():
            base_priority = self.PRIORITY_LEVELS[mode]
            
            # Apply policy multipliers
            if mode == "bus" and "bus_priority_multiplier" in policy:
                base_priority /= policy["bus_priority_multiplier"]
            
            # Weight by proportion of vehicles
            mode_proportion = count / total_vehicles if total_vehicles > 0 else 0
            priority_score += base_priority * mode_proportion
        
        # Normalize to 0-1 range
        return min(priority_score / 5.0, 1.0)  # 5.0 = max base priority (truck)
    
    def adjust_green_time_for_modes(self, base_green: int, 
                                    approach_detections: List[Dict],
                                    time_of_day: str) -> int:
        """
        Adjust green time based on modes present.
        
        Example:
        - Base green: 30 seconds
        - Bus detected: +8 seconds (bus priority)
        - 5+ bicycles waiting: +5 seconds (bicycle wave)
        - Adjusted green: 43 seconds
        """
        adjusted = base_green
        
        # Count modes
        mode_counts = self._count_by_mode(approach_detections)
        
        # Bus priority
        if mode_counts.get("bus", 0) > 0:
            if time_of_day in ["peak_morning", "peak_evening"]:
                adjusted += 10  # 10 extra seconds during peak
            else:
                adjusted += 6   # 6 extra seconds off-peak
        
        # Bicycle wave activation
        if mode_counts.get("bicycle", 0) >= 5:
            adjusted += 5  # Ensure cyclists clear together
        
        # Large pedestrian crowd
        if mode_counts.get("pedestrian", 0) > 20:
            adjusted += 8  # Extended crossing time
        
        # E-vehicle priority (small bonus)
        ev_count = sum(1 for d in approach_detections if d.get("is_ev", False))
        if ev_count > 0:
            adjusted += min(ev_count * 2, 8)  # Max 8s bonus
        
        return adjusted
    
    def should_activate_bus_priority(self, detections: List[Dict],
                                    passenger_load: str = "UNKNOWN") -> bool:
        """
        Decide if bus priority should be activated.
        
        Conditions:
        - Bus detected within 100m of junction
        - Peak hours OR high passenger load
        - Not already in bus priority phase
        """
        pass
    
    def should_activate_bicycle_wave(self, junction_detections: Dict) -> bool:
        """
        Decide if bicycle green wave should be activated.
        
        Conditions:
        - 5+ bicycles waiting at signal
        - OR peak cycling hours (7-9 AM, 5-7 PM)
        - Dedicated bicycle lane exists
        """
        pass
```

---

#### **STEP 3: Pedestrian Safety System**

**File:** `src/pedestrian_safety.py`

**Requirements:**
```python
class PedestrianSafetySystem:
    """
    Advanced pedestrian protection system with dynamic crossing time
    calculation and real-time monitoring.
    """
    
    WALKING_SPEEDS = {
        "adult": 1.2,          # m/s
        "elderly": 0.8,        # m/s
        "child": 1.0,          # m/s
        "wheelchair": 0.6,     # m/s
        "crowd": 0.9           # m/s (slower due to density)
    }
    
    def __init__(self):
        self.pose_estimator = PoseEstimator()  # for gait analysis
        pass
    
    def calculate_crossing_time(self, road_width: float,
                                pedestrians: List[Dict]) -> int:
        """
        Calculate required crossing time based on vulnerable pedestrians.
        
        Args:
            road_width: Width of road to cross (meters)
            pedestrians: List of detected pedestrians with vulnerability info
        
        Returns:
            Required crossing time (seconds)
        """
        if not pedestrians:
            # Standard crossing time
            return int(road_width / self.WALKING_SPEEDS["adult"] + 3)
        
        # Find slowest pedestrian
        slowest_speed = min(
            self.WALKING_SPEEDS[p["vulnerability"]] 
            for p in pedestrians
        )
        
        # Calculate time with safety buffer
        crossing_time = int(road_width / slowest_speed + 5)
        
        # Large crowd adjustment
        if len(pedestrians) > 20:
            crossing_time = int(crossing_time * 1.3)
        
        return crossing_time
    
    def monitor_crossing_progress(self, pedestrians: List[Dict],
                                  crosswalk_bbox: Tuple,
                                  time_remaining: int) -> Dict:
        """
        Monitor pedestrians in crosswalk during crossing phase.
        Detect if anyone needs extra time.
        
        Returns:
            {
                "status": "OK" | "NEEDS_EXTENSION" | "EMERGENCY",
                "pedestrians_remaining": 3,
                "slowest_pedestrian": {...},
                "recommended_extension": 5  # seconds
            }
        """
        # Check if anyone still in crosswalk
        remaining = [p for p in pedestrians 
                    if self._is_in_crosswalk(p["bbox"], crosswalk_bbox)]
        
        if not remaining:
            return {"status": "OK", "pedestrians_remaining": 0}
        
        # Check if time is running out
        if time_remaining < 3 and remaining:
            # Someone still crossing with <3s left
            return {
                "status": "NEEDS_EXTENSION",
                "pedestrians_remaining": len(remaining),
                "slowest_pedestrian": min(remaining, key=lambda p: p["estimated_crossing_speed"]),
                "recommended_extension": 5
            }
        
        # Check for emergency (person fell, obstacle)
        for p in remaining:
            if self._detect_emergency(p):
                return {
                    "status": "EMERGENCY",
                    "emergency_type": "PERSON_FALLEN",
                    "recommended_action": "HOLD_ALL_TRAFFIC"
                }
        
        return {"status": "OK", "pedestrians_remaining": len(remaining)}
    
    def classify_vulnerability(self, pedestrian: Dict, 
                             frame: np.ndarray) -> str:
        """
        Classify pedestrian vulnerability using pose estimation and height.
        
        Returns:
            "adult" | "elderly" | "child" | "wheelchair"
        """
        # Height-based classification
        height_pixels = pedestrian["bbox"][3] - pedestrian["bbox"][1]
        
        # Approximate real height (calibration needed per camera)
        estimated_height = self._estimate_real_height(height_pixels)
        
        if estimated_height < 1.2:
            return "child"
        
        # Pose-based classification
        pose = self.pose_estimator.estimate(frame, pedestrian["bbox"])
        
        # Elderly detection: hunched posture, slow gait
        if pose["hunched_posture"] or pose["gait_stability"] < 0.5:
            return "elderly"
        
        # Wheelchair detection
        if self._detect_wheelchair(frame, pedestrian["bbox"]):
            return "wheelchair"
        
        return "adult"
    
    def create_school_zone_profile(self) -> Dict:
        """
        Create special safety profile for school zones.
        
        Returns:
            {
                "pedestrian_green_time": 25,  # vs normal 15s
                "vehicle_speed_limit": 30,  # kmph
                "yellow_time": 5,  # vs normal 3s
                "active_hours": ["07:30-08:30", "14:00-15:00"],
                "audio_warnings": true
            }
        """
        pass
```

---

#### **STEP 4: Main Multi-Modal Harmony Orchestrator**

**File:** `src/multimodal_harmony.py`

**Requirements:**
```python
class MultiModalHarmony:
    """
    Master orchestrator for multi-modal transportation optimization.
    Ensures fair, safe, efficient allocation of road space across ALL modes.
    """
    
    def __init__(self):
        self.mode_detector = ModeDetector(vision_module)
        self.priority_manager = ModePriorityManager()
        self.pedestrian_safety = PedestrianSafetySystem()
        self.bicycle_wave_coordinator = BicycleWaveCoordinator()
        pass
    
    def optimize_junction_multimodal(self, junction_id: str) -> Dict:
        """
        Optimize junction considering ALL transportation modes.
        
        Returns:
            {
                "junction_id": "J001",
                "optimized_timings": {...},
                "mode_distribution": {...},
                "priorities_applied": [...],
                "estimated_improvement": {
                    "bus_travel_time": -28,  # % improvement
                    "bicycle_safety": +40,
                    "pedestrian_satisfaction": +35
                }
            }
        """
        # Step 1: Detect all modes on all approaches
        detections = {}
        for approach in ["north", "south", "east", "west"]:
            frame = self._get_camera_frame(junction_id, approach)
            detections[approach] = self.mode_detector.detect_and_classify(frame)
        
        # Step 2: Calculate priority for each approach
        priorities = {}
        for approach, dets in detections.items():
            priorities[approach] = self.priority_manager.calculate_approach_priority(
                dets, self._get_time_of_day()
            )
        
        # Step 3: Calculate base optimization (Webster)
        base_timing = self.webster_optimizer.optimize(junction_id)
        
        # Step 4: Apply mode-specific adjustments
        adjusted_timing = self._apply_multimodal_adjustments(
            base_timing, detections, priorities
        )
        
        # Step 5: Pedestrian safety check
        adjusted_timing = self._ensure_pedestrian_safety(
            adjusted_timing, detections
        )
        
        # Step 6: Apply timing
        self._apply_timing(junction_id, adjusted_timing)
        
        return {
            "junction_id": junction_id,
            "optimized_timings": adjusted_timing,
            "mode_distribution": self._summarize_modes(detections),
            "priorities_applied": priorities
        }
    
    def _apply_multimodal_adjustments(self, base_timing: Dict,
                                     detections: Dict,
                                     priorities: Dict) -> Dict:
        """
        Adjust base timing to account for multiple modes.
        """
        adjusted = base_timing.copy()
        
        for approach in ["north", "south", "east", "west"]:
            # Get mode-adjusted green time
            base_green = base_timing["phases"][approach]["green"]
            
            adjusted_green = self.priority_manager.adjust_green_time_for_modes(
                base_green, detections[approach], self._get_time_of_day()
            )
            
            adjusted["phases"][approach]["green"] = adjusted_green
        
        # Rebalance cycle to ensure total = cycle_length
        adjusted = self._rebalance_cycle(adjusted)
        
        return adjusted
    
    def _ensure_pedestrian_safety(self, timing: Dict, 
                                  detections: Dict) -> Dict:
        """
        Ensure pedestrian crossing times are adequate.
        Override vehicle timing if necessary for safety.
        """
        for approach in ["north", "south", "east", "west"]:
            pedestrians = [d for d in detections[approach] 
                          if d["type"] == "pedestrian"]
            
            if pedestrians:
                # Calculate required crossing time
                road_width = self._get_road_width(approach)
                required_time = self.pedestrian_safety.calculate_crossing_time(
                    road_width, pedestrians
                )
                
                # Ensure pedestrian green is adequate
                current_ped_green = timing["pedestrian_phases"][approach]
                if current_ped_green < required_time:
                    timing["pedestrian_phases"][approach] = required_time
                    # Adjust vehicle green accordingly
                    timing = self._rebalance_for_pedestrians(timing, approach)
        
        return timing
    
    def activate_bus_priority(self, junction_id: str, approach: str) -> Dict:
        """
        Activate immediate bus priority at junction.
        
        Actions:
        - End current phase early (if safe)
        - Activate green for bus approach
        - Extend green time by 8-10 seconds
        """
        pass
    
    def activate_bicycle_wave(self, corridor: List[str]) -> Dict:
        """
        Activate coordinated bicycle green wave on corridor.
        """
        return self.bicycle_wave_coordinator.activate_wave(corridor)
    
    def generate_multimodal_report(self, junction_id: str, 
                                   duration_hours: int = 24) -> Dict:
        """
        Generate comprehensive report on multimodal performance.
        
        Returns:
            {
                "mode_distribution": {...},
                "priorities_activated": {
                    "bus_priority": 12,  # times activated
                    "bicycle_wave": 8,
                    "pedestrian_extension": 34
                },
                "improvements": {
                    "bus_travel_time": -28,  # %
                    "bicycle_safety_score": +40,
                    "pedestrian_accidents": 0  # count
                },
                "recommendations": [...]
            }
        """
        pass
```

---

#### **STEP 5: Bicycle Wave Coordinator**

**File:** `src/bicycle_wave_coordinator.py`

**Requirements:**
```python
class BicycleWaveCoordinator:
    """
    Create synchronized green waves optimized for bicycle speed (12-15 kmph).
    """
    
    TARGET_BICYCLE_SPEED = 15  # kmph (comfortable cycling speed)
    
    def calculate_bicycle_offsets(self, corridor: List[Dict]) -> List[int]:
        """
        Calculate signal offsets for bicycle green wave.
        
        Args:
            corridor: List of junctions with distances
                [
                    {"junction_id": "J001", "distance_to_next": 700},  # meters
                    {"junction_id": "J002", "distance_to_next": 600},
                    ...
                ]
        
        Returns:
            List of offsets in seconds: [0, 168, 312, ...]
        """
        offsets = [0]  # First junction is reference point
        
        cumulative_time = 0
        for i, junction in enumerate(corridor[:-1]):
            # Travel time to next junction
            distance = junction["distance_to_next"]
            travel_time = int((distance / 1000) / self.TARGET_BICYCLE_SPEED * 3600)
            
            cumulative_time += travel_time
            offsets.append(cumulative_time)
        
        return offsets
    
    def activate_wave(self, corridor_id: str) -> Dict:
        """
        Activate bicycle green wave on corridor.
        
        Returns:
            {
                "status": "ACTIVE",
                "corridor": "Alkapuri-Sayajigunj",
                "junctions": 8,
                "wave_speed": 15,  # kmph
                "estimated_time_savings": 8  # minutes for full corridor
            }
        """
        pass
    
    def calculate_wave_efficiency(self, corridor_id: str) -> float:
        """
        Calculate percentage of cyclists experiencing green wave.
        
        Target: >80% efficiency
        """
        pass
```

---

#### **STEP 6: API Endpoints**

**File:** `api/routes/multimodal_routes.py`

**Endpoints:**
```python
@router.post("/bus-priority")
async def activate_bus_priority(
    junction_id: str,
    bus_id: str = None,
    passenger_load: str = "UNKNOWN"
) -> Dict:
    """Activate bus priority at junction."""
    pass

@router.post("/bicycle-wave")
async def activate_bicycle_wave(
    corridor: str,
    target_speed: int = 15
) -> Dict:
    """Activate bicycle green wave."""
    pass

@router.get("/pedestrian-analysis/{junction_id}")
async def get_pedestrian_analysis(junction_id: str) -> Dict:
    """Get pedestrian safety analysis."""
    pass

@router.get("/mode-distribution/{junction_id}")
async def get_mode_distribution(junction_id: str) -> Dict:
    """Get current mode distribution."""
    pass

@router.post("/ev-priority")
async def activate_ev_priority(
    junction_id: str,
    approach: str
) -> Dict:
    """Activate e-vehicle priority (experimental)."""
    pass
```

---

## 🎯 FEATURE 3: GREEN CORRIDOR CREATION

[Similar detailed implementation structure as above...]

**Files:** `src/green_corridor.py`, `src/maxband_optimizer.py`, etc.

**Key Components:**
- MAXBAND algorithm implementation
- Real-time speed monitoring
- Multi-corridor load balancing
- Progression quality metrics

---

## 🎯 FEATURE 4: EMERGENCY RESPONSE SUPERHIGHWAY

[Similar detailed implementation structure...]

**Files:** `src/emergency_response.py`, `src/emergency_detector.py`, etc.

**Key Components:**
- Multi-modal emergency detection (vision + audio)
- Path prediction and corridor clearing
- Hospital coordination
- Convoy management

---

## 📊 VALIDATION & TESTING STRATEGY

### **1. Unit Testing (Per Feature)**
- Each component has 10-15 unit tests
- Test coverage target: >85%
- Run: `pytest tests/ -v --cov`

### **2. Integration Testing**
- Test feature interactions
- Verify API endpoints
- Dashboard component testing

### **3. SUMO Simulation Validation**
- Baseline vs optimized comparisons
- Statistical significance testing
- Multiple scenarios per feature

### **4. Performance Benchmarks**
- API response time: <200ms
- Vision processing: <150ms per frame
- Optimization calculation: <100ms per junction



## 🏆 SUCCESS CRITERIA

### **Feature Completeness:**
✅ All 4 features implemented
✅ API endpoints functional
✅ Dashboard components working
✅ Tests passing (target: 40+ tests)

### **Performance Targets:**
✅ AI Conductor prediction accuracy: >80%
✅ Multi-Modal bus priority: -28% travel time
✅ Green Corridor wave efficiency: >75%
✅ Emergency Response time saved: >40%

### **Simulation Validation:**
✅ Overall improvement: >35% delay reduction
✅ Spillback reduction: >80%
✅ Throughput increase: >15%

---

## 🚀 QUICK START COMMANDS

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run tests
pytest tests/ -v --cov

# 3. Start backend
uvicorn api.main:app --reload

# 4. Start dashboard
cd dashboard && npm run dev

# 5. Run SUMO validation
python simulation/run_simulation.py --mode compare --duration 3600

# 6. Generate performance report
python scripts/generate_report.py
```

---

## 💡 IMPLEMENTATION TIPS

1. **Start with prediction engine** - It's foundational
2. **Use existing vision module** - Don't rebuild YOLOv8
3. **Reuse Webster optimizer** - Extend, don't replace
4. **Test incrementally** - Don't wait until everything is done
5. **Mock external APIs** - Don't depend on real hospital APIs for demo
6. **Generate synthetic data** - For testing without real cameras

---

## 📝 CODE QUALITY STANDARDS

- **Type hints** on all functions
- **Docstrings** following Google style
- **Error handling** with try-except blocks
- **Logging** for debugging (use Python logging module)
- **Configuration** in JSON files (no hardcoded values)
- **Comments** for complex algorithms

---

## 🎬 DEMO PREPARATION

After implementation, prepare:

1. **SUMO simulation video** (2-3 minutes showing improvement)
2. **Dashboard walkthrough** (live demo)
3. **Presentation slides** (10-15 slides)
4. **Demo script** (5-7 minutes)
5. **Q&A preparation** (common questions)

---

## 🏁 FINAL CHECKLIST

Before submission:

- [ ] All features implemented and tested
- [ ] API endpoints working
- [ ] Dashboard components functional
- [ ] SUMO simulation showing >35% improvement
- [ ] Unit tests passing (40+ tests)
- [ ] Documentation complete
- [ ] Demo video recorded
- [ ] Presentation slides ready
- [ ] Demo script practiced

---

**REMEMBER:** Innovation is the key to winning. These features showcase:
- ✅ Technical depth (AI, optimization, computer vision)
- ✅ Social impact (equity, safety, environment)
- ✅ Practical feasibility (uses existing infrastructure)
- ✅ Scalability (city-wide deployment possible)

**GO BUILD SOMETHING AMAZING!** 🚀

---

**END OF AGENTIC IDE PROMPT**
