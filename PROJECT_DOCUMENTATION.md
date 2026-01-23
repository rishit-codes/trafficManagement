# GeoFlow Traffic Management System - Full System Documentation

## 1. Project Overview

**GeoFlow** is a Traffic Intelligence Platform designed for the Vadodara Smart City pilot. It provides real-time monitoring, visualization, and control of traffic junctions.

**Key Capabilities:**
- Real-time traffic signal visualization (4-way junction).
- Live camera feed integration.
- Analytics dashboard with map-based navigation.
- Backend-driven signal state management (Single Source of Truth).
- Honest "data unavailable" states for pilot integrity.

---

## 2. Architecture

**Frontend:**
- **Framework**: React.js (Vite)
- **Routing**: React Router (URL-driven state)
- **Styling**: Pure CSS (Modular, responsive)
- **Map**: Leaflet / React-Leaflet
- **Charts**: Recharts

**Backend:**
- **Framework**: FastAPI (Python)
- **Control Logic**: Deterministic Signal State Engine
- **Database**: SQLite (Traffic History), JSON (Configuration)
- **Vision**: YOLO-based vehicle detection (Mock/Pilot mode)

---

## 3. Frontend Implementation

### 3.1 Core Components

#### `App.jsx`
- **Role**: Main routing container.
- **Routes**:
  - `/dashboard`: Main landing with Map/KPIs.
  - `/junction/:id`: Detailed junction view.
  - `/analytics`: Historical data.

#### `JunctionDetail.jsx` (`frontend/src/components/junction/`)
- **Role**: The central control room view for a specific junction.
- **Key Features**:
  - **URL Source of Truth**: Reads `id` from URL params.
  - **Polling**:
    - **Signal State**: Polls every 1s (Critical real-time).
    - **General Data**: Polls every 5s.
  - **Layout**: 3-Column Grid (Signal | Video | Metrics).
- **Code Flow**:
  1. `useParams()` gets junction ID.
  2. `useEffect` starts 1s interval calling `getJunctionState(id)`.
  3. Renders `TrafficSignal4Way`.

#### `TrafficSignal4Way.jsx` (`frontend/src/components/junction/`)
- **Role**: Visualizer for the 4-arm traffic signal.
- **Props**:
  - `currentPhase` (e.g., "NS_GREEN")
  - `activeDirections` (e.g., ["N", "S"])
  - `timeRemaining` (Seconds)
- **Visuals**:
  - Grid layout representing N/S/E/W.
  - Logic: Direction is GREEN only if it is in `activeDirections`. Else RED (or YELLOW if phase matches).
  - Countdown timer.

#### `LiveCameraPanel.jsx` (`frontend/src/components/dashboard/`)
- **Role**: Displays live video feed.
- **Logic**:
  - Maps junction ID to video file in `public/videos`.
  - Auto-plays with loop/mute.
  - **Compact Mode**: Restricts size on Detail page.

---

## 4. Backend Implementation

### 4.1 API Endpoints (`backend/api/main.py`)

#### `GET /junctions/{junction_id}/state`
- **Purpose**: Real-time signal status.
- **Response**:
  ```json
  {
    "junction_id": "J001",
    "current_phase": "NS_GREEN",
    "time_remaining": 12,
    "active_directions": ["N", "S"],
    "display_name": "North–South Green",
    "cycle_length": 80
  }
  ```
- **Logic**: Calls `signal_state_engine.get_signal_state()`.

### 4.2 Signal State Engine (`backend/src/signal_state_engine.py`)
- **Role**: The "Brain" of the traffic lights.
- **Logic**:
  - **Deterministic**: State is calculated from `Server Time`.
  - **Cycle**: 6 Phases (Total 80s).
  1. `NS_GREEN` (30s)
  2. `NS_YELLOW` (5s)
  3. `ALL_RED` (5s)
  4. `EW_GREEN` (30s)
  5. `EW_YELLOW` (5s)
  6. `ALL_RED` (5s)

---

## 8. Detailed File Inventory

### Frontend Files (`frontend/src/`)

| Category | File Path | Description |
|----------|-----------|-------------|
| **Core** | `App.jsx` | Application root, main routing definitions (Dashboard, Junction, Analytics). |
| | `main.jsx` | Entry point, mounts React app to DOM, wraps `BrowserRouter`. |
| | `index.css` | Global styles, CSS variables (colors, fonts), resets. |
| **Services** | `services/api.js` | Axios instance setup, API methods (`getJunctions`, `getJunctionState`). |
| **Data** | `data/pilotJunctions.js` | Static data specifically for the Pilot (IDs, Names, Lat/Lng, Video paths). |
| **Layout** | `components/layout/Layout.jsx` | Main wrapper with Sidebar and Header. |
| | `components/layout/Header.jsx` | Top navigation bar, shows "Live System Active" status. |
| | `components/layout/Sidebar.jsx` | Left navigation menu with active link highlighting. |
| **Dashboard** | `components/dashboard/Dashboard.jsx` | Home page controller. Aggregates Map, KPIs, and Alerts. |
| | `components/dashboard/CityMap.jsx` | Interactive Leaflet map displaying pilot junctions. Handles navigation. |
| | `components/dashboard/LiveCameraPanel.jsx` | Video player component. Has compact mode for detail view. |
| | `components/dashboard/AlertsPanel.jsx` | List of system alerts/anomalies (Mocked for pilot). |
| | `components/dashboard/KpiCards.jsx` | Top-level metrics (Traffic Flow, Avg Wait Time, etc). |
| | `components/dashboard/TrafficTrend.jsx` | Line chart showing traffic volume trends. |
| **Junction** | `components/junction/JunctionDetail.jsx` | **Key File**. Page controller for `/junction/:id`. Handles polling. |
| | `components/junction/TrafficSignal4Way.jsx` | **Key File**. Returns visual of 4-way signal light system. |
| | `components/junction/TrafficSignal4Way.css` | Styles for the signal grid and light glow effects. |
| | `components/junction/TrafficMetrics.jsx` | Panel showing active metrics (Flow, Density) if available. |
| | `components/junction/GeometryPanel.jsx` | Displays junction satellite/schematic info (Placeholder). |
| | `components/junction/SpillbackPanel.jsx` | Panel for queue spillback warnings. |
| | `components/junction/OptimizationPanel.jsx` | Displays signal timing optimization info. |
| **Monitoring** | `components/monitoring/LiveMonitoring.jsx` | Page for grid view of multiple cameras. |
| | `components/monitoring/VideoGrid.jsx` | Grid layout component for video feeds. |
| | `components/monitoring/VideoCard.jsx` | Individual video card wrapper. |
| **Control** | `components/control/ControlPanel.jsx` | Page for manual system overrides (Admin view). |
| | `components/control/ManualOverride.jsx` | UI for forcing signal phases manually. |
| | `components/control/EmergencyMode.jsx` | UI for triggering emergency corridors. |
| | `components/control/SystemActions.jsx` | System-wide reset/calib buttons. |
| **Analytics** | `components/analytics/Analytics.jsx` | Page for historical data analysis. |
| | `components/analytics/ComparsionCharts.jsx` | Charts comparing peak vs off-peak flow. |
| | `components/analytics/TimePatterns.jsx` | Heatmap/charts for daily traffic patterns. |
| | `components/analytics/ForecastPanel.jsx` | Predictive traffic modeling UI. |
| | `components/analytics/PerformanceSummary.jsx` | High-level efficiency metrics summary. |

### Backend Files (`backend/`)

| Category | File Path | Description |
|----------|-----------|-------------|
| **API** | `api/main.py` | **Key File**. FastAPI app definition, lifespan manager, all route handlers. |
| | `api/routes.py` | Additional route definitions (modularized). |
| **Engine** | `src/signal_state_engine.py` | **Key File**. 80s deterministic cycle logic (NS_GREEN -> EW_GREEN). |
| | `src/signal_controller.py` | Interface defining how to talk to hardware controllers (includes Mock). |
| | `src/geometric_database.py` | Loads and queries `junction_config.json`. |
| **Logic** | `src/webster_optimizer.py` | Implementation of Webster's formula for signal timing. |
| | `src/spillback_detector.py` | Logic to detect queue spillback risks. |
| | `src/traffic_analytics.py` | Statistical analysis of historical data. |
| | `src/traffic_forecaster.py` | Simple prediction models (Moving Average). |
| | `src/pcu_converter.py` | Utility to convert vehicle counts (Car/Bus) to PCU units. |
| **Data** | `src/data_collector.py` | Module for collecting and saving historical data. |
| | `src/database.py` | SQLite connection handler and query helpers. |
| **Vision** | `src/vision_module.py` | (Mock/Placeholder) Integration point for YOLO/Computer Vision. |
| | `src/vision_metrics.py` | Tracks performance/latency of the vision system. |
| **Tests** | `test_accuracy.py` | Unit test for model accuracy. |
| | `evaluate_vision_model.py` | Script to run evaluation on test dataset. |
| | `test_api.py` | Integration tests for API endpoints. |
