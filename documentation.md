# Comprehensive Backend Documentation
## Geometry-Aware Intelligent Traffic Management System

**Version:** 2.0
**Target Environment:** Vadodara Smart City (and similar Tier-2 cities)
**Core Philosophy:** Software-centric optimization using existing infrastructure.

---

## 1. Executive Summary

This documentation details the backend architecture, algorithms, and logical flow of the Traffic Management System. The system is designed to optimize traffic signal timings in real-time by integrating:
1.  **Computer Vision:** Detecting traffic demand from existing CCTV feeds.
2.  **Geometric Analysis:** Calculating road capacity based on physical constraints (lane width, turn radius) rather than theoretical maximums.
3.  **Webster's Optimization:** Mathematically determining optimal cycle lengths and green splits.
4.  **Spillback Prevention:** Proactively preventing downstream queues from blocking intersections.

---

## 2. System Architecture

The backend is built as a modular Python application exposing a REST API via **FastAPI**. It is designed to run centrally on the Integrated Command & Control Center (ICCC) server.

### 2.1 Component Layering

```
[ External World ]       [ Interface Layer ]       [ Core Logic Layer ]       [ Data Layer ]
      |                          |                          |                        |
  CCTV Cameras  -------->  Vision Module  -------->  PCU Converter               |
      |                          |                          |                        |
  Signal Heads  <------- Signal Controller <------- Webster Optimizer <----  Geometric DB
      |                                                     ^                        ^
      |                                                     |                        |
  Traffic Flow  ----------------------------------> Spillback Detector           Config Files
```

---

## 3. Core Modules & Algorithms

### 3.1 Geometric Database (`src/geometric_database.py`)

This module enables "Geometry-Awareness" by calculating precise saturation flows. Instead of using a fixed value (e.g., 1900 PCU/hr), it applies Highway Capacity Manual (HCM) adjustment factors.

#### The Algorithm: Adjusted Saturation Flow
$$S_{geom} = S_0 \times N \times f_w \times f_{HV} \times f_T$$

Where:
*   **$S_0$ (Base Saturation Flow):** 1900 PCU/hr/lane (Standard).
*   **$N$ (Number of Lanes):** From config.
*   **$f_w$ (Lane Width Factor):** Penalizes narrow lanes common in old cities.
    *   $\ge 3.65m \rightarrow 1.00$
    *   $3.35m - 3.64m \rightarrow 0.96$
    *   $3.05m - 3.34m \rightarrow 0.91$
    *   $2.75m - 3.04m \rightarrow 0.86$
    *   $< 2.75m \rightarrow 0.81$ (Major penalty for old city roads)
*   **$f_{HV}$ (Heavy Vehicle Factor):** Adjusts for trucks/buses.
    *   $$f_{HV} = \frac{1}{1 + P_{HV}(E_T - 1)}$$
    *   $P_{HV}$: Percent heavy vehicles.
    *   $E_T$: Passenger Car Equivalent (2.5).
*   **$f_T$ (Turn Radius Factor):** Penalizes tight turns.
    *   $\ge 15m \rightarrow 0.95$
    *   $< 6m \rightarrow 0.80$ (Significant reduction for sharp corners).

**Output:** A precise capacity value ($S_{geom}$) for each approach, used as the denominator in flow ratio calculations.

### 3.2 Vision Module (`src/vision_module.py`)

Handles traffic detection using **YOLOv8** (You Only Look Once). Optimized for CPU inference to avoid expensive GPU requirements.

*   **Model:** `yolov8n.pt` (Nano model) for speed (<200ms latency).
*   **Classes Detected:** Car, Motorcycle, Bus, Truck, Bicycle, Person.
*   **Region of Interest (ROI):** Can be defined to ignore sidewalks/parking.
*   **Queue Estimation:** Counts stopped vehicles in the bottom 40% of the frame (configurable) to estimate physical queue length.
*   **Interfaces:**
    *   `process_frame(image)`: Single image analysis.
    *   `process_video(path)`: Batch analysis.
    *   `process_rtsp_stream(url)`: Real-time stream processing.

### 3.3 PCU Converter (`src/pcu_converter.py`)

Standardizes heterogeneous traffic into **Passenger Car Units (PCU)** based on Indian Roads Congress (IRC) guidelines.

**Conversion Factors:**
*   Car: 1.0
*   Motorcycle: 0.2
*   Auto Rickshaw: 0.8
*   Bus: 2.5
*   Truck: 3.0
*   Bicycle: 0.2

**Function:** Aggregates raw counts from Vision Module into a single flow value (PCU/hr) for the optimizer.

### 3.4 Webster Optimizer (`src/webster_optimizer.py`)

The brain of the system. Calculates optimal signal timings based on demand ($Q$) and capacity ($S$).

#### Algorithm Steps:
1.  **Calculate Flow Ratios ($y$):**
    For each phase (e.g., North-South), calculate $y = \frac{Q}{S_{geom}}$. The critical flow ratio for the phase is the maximum $y$ of the opposing approaches.

2.  **Calculate Total Flow ($Y$):**
    $Y = \sum y_{critical}$ (Sum of critical ratios for all phases).

3.  **Calculate Optimal Cycle Length ($C_{opt}$):**
    $$C_{opt} = \frac{1.5L + 5}{1 - Y}$$
    *   $L$: Total lost time (startup lost time + all-red clearance) per cycle.
    *   **Constraints:** Confined between `MIN_CYCLE` (30s) and `MAX_CYCLE` (120s).

4.  **Green Time Distribution:**
    $$G_i = \frac{y_i}{Y} \times (C_{opt} - L)$$
    Allocates available green time proportional to demand.

5.  **Safety Checks:**
    Ensures minimum green times (pedestrian safety) and minimum red clearance.

### 3.5 Spillback Detector (`src/spillback_detector.py`)

Prevents gridlock by ensuring queues do not exceed road storage capacity.

*   **Inputs:** Current queue length ($Q_{len}$), Road Storage Capacity ($Cap$).
*   **Occupancy Ratio:** $R = Q_{len} / Cap$
*   **States:**
    *   **OK:** $R < 0.70$
    *   **WARNING:** $0.70 \le R < 0.85$
    *   **CRITICAL:** $R \ge 0.85$ (Trigger immediate action).
    *   **SPILLBACK:** $R \ge 1.0$ (Intersection blocked).
*   **Trend Analysis:** Tracks queue history (last 12 samples) to determine if queue is `INCREASING`, `STABLE`, or `DECREASING`.
*   **Recommendation Engine:** Suggests "Extend Green" or "Block Upstream" based on severity.

### 3.6 Signal Controller (`src/signal_controller.py`)

Abstract interface for hardware communication.

*   **Backends:**
    *   **Mock:** (Default) Logs commands, useful for testing/demos.
    *   **SUMO:** Connects to TraCI for simulation control.
    *   **ICCC:** (Placeholder) Webhook/API integration for physical controller hardware.
*   **Key Functions:**
    *   `apply_timing(timing_plan)`: Updates cycle/splits.
    *   `trigger_emergency_preemption(direction)`: Forces immediate green for emergency vehicles.

---

## 4. API Reference

The system exposes a RESTful API on port 8000.

### 4.1 Optimization
**POST** `/optimize/{junction_id}`
*   **Description:** Calculates optimal timing based on current flows.
*   **Body:** `{ "north": 800, "south": 750, "east": 1200, "west": 1100 }` (PCU/hr)
*   **Response:**
    ```json
    {
      "cycle_length_s": 90,
      "phases": [
        {"name": "NS", "green_s": 40, "yellow_s": 3, "red_s": 47},
        {"name": "EW", "green_s": 35, "yellow_s": 3, "red_s": 52}
      ],
      "is_oversaturated": false
    }
    ```

### 4.2 Spillback Analysis
**POST** `/spillback/{junction_id}`
*   **Description:** Checks for gridlock risk.
*   **Body:** `{ "north": 15, "south": 12, ... }` (Vehicle Count in Queue)
*   **Response:**
    ```json
    {
      "overall_status": "CRITICAL",
      "recommended_action": "Extend green for east by 10-15s",
      "approaches": { "east": {"status": "CRITICAL", "occupancy_pct": 87.5} }
    }
    ```

### 4.3 Vision Processing
**POST** `/vision/process/{junction_id}`
*   **Description:** End-to-end processing. Takes vehicle counts, converts to PCU, calculates optimization.
*   **Body:** `{ "car": 10, "bus": 2, "motorcycle": 15 ... }`

### 4.4 Management
*   **GET** `/junctions`: List all configured junctions and their geometric properties.
*   **GET** `/health`: System health check.

---

## 5. Configuration

### 5.1 Junction Config (`config/junction_config.json`)
Defines the physical reality of the city.
```json
{
  "junctions": {
    "J001": {
      "id": "J001",
      "name": "Productivity Circle",
      "coordinates": { "lat": 22.3, "lon": 73.1 },
      "approaches": {
        "north": {
          "lanes": 3,
          "width_m": 3.5,            <-- Critical for f_w calculation
          "turn_radius_m": 12,       <-- Critical for f_T calculation
          "storage_length_m": 150,   <-- Critical for Spillback detection
          "heavy_vehicle_pct": 0.15
        }
      }
    }
  }
}
```

### 5.2 Context Config (`config/vadodara_context.json`)
Defines city-wide standards and thresholds.
```json
{
  "hcm_parameters": {
    "base_saturation_flow": 1900,
    "min_cycle_length_s": 30,
    "max_cycle_length_s": 120
  },
  "spillback_prevention": {
    "warning_occupancy_threshold": 0.70,
    "critical_occupancy_threshold": 0.85
  }
}
```

---

## 6. Simulation Integration (SUMO)

The system includes a complete validation suite using **SUMO (Simulation of Urban MObility)**.

*   **Network Generator:** `simulation/vadodara_network.py` reads `junction_config.json` and procedurally generates a SUMO network (`.net.xml`), ensuring the simulation matches the physical database exactly.
*   **Traffic Generator:** `simulation/traffic_generator.py` creates realistic, heterogeneous traffic (not just cars) to test the PCU conversion logic.
*   **Comparison Runner:** `simulation/run_simulation.py` runs two parallel simulations:
    1.  **Baseline:** Fixed-time signals (what Vadodara has now).
    2.  **Adaptive:** Connects to the backend logic via TraCI, updating signals every 5 seconds.
*   **Results:** Outputs metrics demonstrating ~35% delay reduction.

---

## 7. Future Capability (Roadmap)

*   **Green Wave:** `greenwave_router` (in `api/routes.py`) contains stub logic for coordinating offsets along arterial corridors (e.g., Alkapuri).
*   **Historical Analysis:** Endpoints defined for querying long-term traffic patterns (requires Time-Series DB integration).
