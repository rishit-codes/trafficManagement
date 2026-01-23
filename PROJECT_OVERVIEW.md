# Complete Project Overview
## Geometry-Aware Intelligent Traffic Management System

> **Purpose of this document**: This is a comprehensive reference for AI assistants or developers to understand every aspect of this project for implementation, debugging, or extension.

---

## 1. Project Summary

| Attribute | Value |
|-----------|-------|
| **Project Name** | Traffic Management System |
| **Target City** | Vadodara, Gujarat, India |
| **Core Innovation** | Software-only signal optimization using existing CCTV infrastructure |
| **Key Algorithm** | Webster's Method with HCM geometry adjustments |
| **Tech Stack (Backend)** | Python 3.12+, FastAPI, YOLOv8 |
| **Tech Stack (Frontend)** | React 19, Vite, Recharts, Lucide Icons |
| **Simulation** | SUMO (Simulation of Urban MObility) |

---

## 2. Directory Structure

```
TrafficManagement/
├── backend/                    # Python backend (core logic + API)
│   ├── api/                   # FastAPI endpoints
│   │   ├── main.py           # Server entry point, lifespan, health checks
│   │   └── routes.py         # Additional routers (corridors, greenwave)
│   ├── src/                   # Core algorithm modules
│   │   ├── geometric_database.py    # HCM saturation flow calculations
│   │   ├── webster_optimizer.py     # Signal timing optimization
│   │   ├── spillback_detector.py    # Gridlock prevention
│   │   ├── pcu_converter.py         # Vehicle count standardization
│   │   ├── vision_module.py         # YOLOv8 inference
│   │   └── signal_controller.py     # Hardware abstraction layer
│   ├── requirements.txt      # Python dependencies
│   ├── demo.py               # Standalone demo script
│   └── test_api.py           # API integration tests
│
├── frontend/                  # React dashboard
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── LiveSignalPanel.jsx      # Real-time signal display
│   │   │   ├── SpillbackAlert.jsx       # Queue risk visualization
│   │   │   ├── OptimizationPanel.jsx    # Signal timing controls
│   │   │   ├── MetricsDashboard.jsx     # KPI display
│   │   │   └── layout/                  # Header, Sidebar, Layout
│   │   ├── pages/            # Main views
│   │   │   ├── dashboard/    # Dashboard.jsx
│   │   │   ├── junction/     # JunctionDetails.jsx
│   │   │   ├── analytics/    # Analytics.jsx
│   │   │   └── settings/     # Settings.jsx
│   │   ├── utils/api.js      # Axios API client
│   │   └── styles/           # CSS files
│   └── package.json
│
├── simulation/                # SUMO integration
│   ├── vadodara_network.py   # Generates SUMO network from config
│   ├── traffic_generator.py  # Creates heterogeneous traffic demand
│   ├── sumo_controller.py    # TraCI interface + Adaptive controller
│   ├── run_simulation.py     # Baseline vs Adaptive comparison runner
│   ├── networks/             # Generated .net.xml files
│   ├── demand/               # Generated .rou.xml files
│   └── results/              # Simulation output JSON/CSV
│
├── config/                    # Configuration files
│   ├── junction_config.json  # Physical junction data
│   ├── vadodara_context.json # City-wide parameters
│   └── simulation_config.json # SUMO settings
│
├── tests/                     # Unit tests (pytest)
│   ├── test_geometric_database.py
│   ├── test_webster.py
│   ├── test_spillback_detector.py
│   └── test_pcu_converter.py
│
└── docs/                      # Documentation
    ├── Complete_Project_Documentation_v2.md
    └── QUICK_START_GUIDE.md
```

---

## 3. Configuration Files (Critical Data)

### 3.1 `config/junction_config.json`

Defines **3 junctions** in Vadodara:

| Junction ID | Name | Lanes (N/S/E/W) | Lane Width | Turn Radius | Heavy Veh % |
|-------------|------|-----------------|------------|-------------|-------------|
| **J001** | Alkapuri Circle | 2/2/3/3 | 3.5/3.5/3.0/3.0m | 12/12/8/8m | 15-20% |
| **J002** | Mandvi Junction (Old City) | 1/1/2/2 | 2.8/2.5/2.8/2.8m | 6/5/6/6m | 8-10% |
| **J003** | NH-48 Vishwamitri Bridge | 3/3/2/2 | 3.65/3.65/3.5/3.5m | 15/15/10/10m | 15-25% |

Each junction also has:
- `storage_length_m`: Road length for queue storage (80-200m)
- `current_timing`: Fixed cycle length and phase splits

### 3.2 `config/vadodara_context.json`

**PCU Factors (Indian Standards):**
- Motorcycle: 0.2
- Car: 1.0
- Auto Rickshaw: 0.8
- Bus: 2.5
- Truck: 3.0

**HCM Parameters:**
- Base saturation flow: 1900 PCU/hr/lane
- Min cycle: 30s, Max cycle: 120s
- Yellow: 3s, All-red: 2s

**Spillback Thresholds:**
- Warning: 70% occupancy
- Critical: 85% occupancy

**Corridors Defined:**
- `nh48`: High priority, 75% spillback threshold
- `old_city`: Max cycle 90s, pedestrian priority
- `alkapuri`: Green wave enabled

---

## 4. Backend Modules (Detailed)

### 4.1 `geometric_database.py`

**Purpose:** Calculates geometry-adjusted saturation flow.

**Key Formula:**
```
S_geom = S_base × N × f_w × f_HV × f_T
```

**Adjustment Factors:**
| Factor | Formula/Lookup | Example |
|--------|----------------|---------|
| f_w (Lane Width) | ≥3.65m→1.00, 3.05m→0.91, <2.75m→0.81 | 2.8m → 0.86 |
| f_HV (Heavy Vehicle) | 1 / (1 + P_HV × 1.5) | 20% HV → 0.77 |
| f_T (Turn Radius) | ≥15m→0.95, 6m→0.85, <5m→0.80 | 8m → 0.87 |

**Key Methods:**
- `get_approach_saturation_flow(junction_id, direction)` → Returns adjusted PCU/hr
- `get_storage_capacity(junction_id, direction)` → Returns max vehicles

---

### 4.2 `webster_optimizer.py`

**Purpose:** Calculates optimal signal timing.

**Webster's Formula:**
```
C_opt = (1.5L + 5) / (1 - Y)
```
Where:
- L = Total lost time (phases × 4s)
- Y = Sum of critical flow ratios

**Green Time Distribution:**
```
G_i = (y_i / Y) × (C_opt - L)
```

**Key Methods:**
- `optimize(junction_id, live_flows)` → Returns SignalTiming object
- `compare_with_fixed(junction_id, flows)` → Compares optimized vs current

---

### 4.3 `spillback_detector.py`

**Purpose:** Prevents gridlock by monitoring queue growth.

**Status Levels:**
- `OK`: Occupancy < 70%
- `WARNING`: 70-85%
- `CRITICAL`: > 85%
- `SPILLBACK`: > 100% (queue exceeds storage)

**Key Methods:**
- `analyze(junction_id, queue_lengths)` → Returns JunctionStatus with recommendations
- `get_queue_trend(junction_id, direction)` → Returns "INCREASING"/"STABLE"/"DECREASING"

---

### 4.4 `pcu_converter.py`

**Purpose:** Standardizes heterogeneous vehicle counts.

**Example Conversion:**
```
{car: 10, motorcycle: 25, bus: 3} 
→ 10×1.0 + 25×0.2 + 3×2.5 = 22.5 PCU
```

---

### 4.5 `vision_module.py`

**Purpose:** Vehicle detection using YOLOv8.

**Configuration:**
- Model: `yolov8n.pt` (nano, pre-trained COCO)
- Inference: CPU-optimized (<200ms)
- Classes: car, motorcycle, bus, truck, bicycle, person

**Key Methods:**
- `process_frame(image)` → Returns DetectionResult with counts, PCU, queue estimate
- `process_rtsp_stream(url, callback)` → Real-time stream processing

---

### 4.6 `signal_controller.py`

**Purpose:** Hardware abstraction for signal control.

**Backends:**
- `mock`: For testing (logs commands)
- `sumo`: TraCI integration (simulation)
- `iccc`: Real hardware API (placeholder)

**Key Methods:**
- `apply_timing(junction_id, timing)` → Sends new timing plan
- `trigger_emergency_preemption(junction_id, direction)` → Emergency vehicle priority

---

## 5. API Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| GET | `/` | - | API info |
| GET | `/health` | - | Component status |
| GET | `/junctions` | - | List of all junctions |
| GET | `/junctions/{id}` | - | Junction details + geometry |
| GET | `/junctions/{id}/state` | - | Current signal state |
| POST | `/optimize/{id}` | `{north: 800, south: 750, east: 1200, west: 1100}` | Optimized timing plan |
| POST | `/optimize/{id}/apply` | Same as above | Applies timing to controller |
| POST | `/spillback/{id}` | `{north: 15, south: 12, east: 35, west: 8}` | Risk assessment |
| POST | `/emergency/{id}?direction=north` | - | Triggers preemption |
| POST | `/pcu/convert` | `{car: 10, motorcycle: 25}` | `{total_pcu: 15.0}` |

---

## 6. Frontend Components

| Component | File | Purpose | Backend Integration |
|-----------|------|---------|---------------------|
| **LiveSignalPanel** | `LiveSignalPanel.jsx` | Animated traffic lights | `GET /junctions/{id}/state` (needs polling) |
| **SpillbackAlert** | `SpillbackAlert.jsx` | Queue risk visualization | `POST /spillback/{id}` ✅ Integrated |
| **OptimizationPanel** | `OptimizationPanel.jsx` | Flow inputs + optimize button | `POST /optimize/{id}` |
| **MetricsDashboard** | `MetricsDashboard.jsx` | KPI cards (delay, throughput) | Custom aggregation |
| **JunctionSelector** | `JunctionSelector.jsx` | Dropdown to select junction | `GET /junctions` |

**API Client:** `src/utils/api.js` uses Axios with all endpoints pre-defined.

---

## 7. Simulation System

### 7.1 Network Generation (`vadodara_network.py`)
Reads `junction_config.json` and generates SUMO network files:
- `.nod.xml` (nodes/junctions)
- `.edg.xml` (edges/roads)
- `.con.xml` (connections)
- `.tll.xml` (traffic lights)
- `.net.xml` (compiled network)

### 7.2 Traffic Generation (`traffic_generator.py`)
Creates realistic Indian traffic mix:
- Peak: 1200 veh/hr (60% car, 25% bike, 10% bus, 5% truck)
- Off-peak: 780 veh/hr
- Night: 180 veh/hr

### 7.3 Running Simulations (`run_simulation.py`)
```bash
python simulation/run_simulation.py --mode compare --duration 600
```

**Modes:**
- `baseline`: Fixed-time signals
- `adaptive`: Webster-optimized signals
- `compare`: Runs both and generates comparison

### 7.4 Expected Results
| Metric | Baseline | Adaptive | Improvement |
|--------|----------|----------|-------------|
| Avg Waiting Time | 45s | 29s | 35% ↓ |
| Spillback Events | 12/hr | 2/hr | 83% ↓ |
| Throughput | 6,800 veh/hr | 7,850 veh/hr | 15% ↑ |

---

## 8. How to Run

### Backend
```bash
cd TrafficManagement
python -m venv venv
source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r backend/requirements.txt
uvicorn backend.api.main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Access: http://localhost:5173
```

### Simulation
```bash
pip install eclipse-sumo  # or install SUMO separately
python simulation/vadodara_network.py   # Generate network
python simulation/traffic_generator.py  # Generate traffic
python simulation/run_simulation.py --mode compare --duration 600
```

---

## 9. Key Implementation Notes

1. **Flow Ratio Calculation**: Uses geometry-adjusted saturation flow from `geometric_database.py`, NOT fixed 1900 PCU/hr.

2. **Phase Configuration**: Default is 2-phase (NS/EW). Custom phases can be passed to `optimizer.optimize()`.

3. **Spillback Prevention**: When occupancy > 85%, recommendations include extending green or blocking upstream.

4. **LiveSignalPanel**: Currently uses simulated timer. To integrate with backend, replace `setInterval` with polling `GET /junctions/{id}/state` every 1 second.

5. **CORS**: Backend allows all origins (`allow_origins=["*"]`). Restrict in production.

6. **API Proxy**: In development, Vite can proxy `/api` to `localhost:8000`. Check `vite.config.js`.

---

## 10. Testing

Run all 39 unit tests:
```bash
pytest tests/ -v
```

| Test File | Coverage |
|-----------|----------|
| `test_geometric_database.py` | HCM factor calculations |
| `test_webster.py` | Optimization algorithm edge cases |
| `test_spillback_detector.py` | Queue monitoring logic |
| `test_pcu_converter.py` | Vehicle count conversions |

---

*Document generated for AI consumption. Use this as a complete reference for implementation.*
