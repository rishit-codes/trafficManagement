# Project Analysis: Traffic Management System

## System Architecture
The project is a **Smart Traffic Control System** designed to optimize urban intersections using real-time computer vision and adaptive signal algorithms.

### High-Level Flow
1. **Input**: CCTV Camera feeds (Real-world or Simulation).
2. **Processing**: 
   - **Vision Module**: API detection using YOLOv8 to identify vehicle types (Car, Bus, Truck, Bike).
   - **Data Normalization**: Converts counts to Passenger Car Units (PCU).
   - **Optimization**: `WebsterOptimizer` calculates the ideal Green/Red times based on queue density.
3. **Output**: Live signal control commands sent to the traffic controller.
4. **Interface**: A React-based Dashboard for operators to visualization status and intervene.

## Component Breakdown

### 1. Backend (`/backend`)
- **Framework**: FastAPI (Python).
- **Core Modules**:
    - `vision_module.py`: Handles YOLOv8 inference.
    - `webster_optimizer.py`: Implements the core traffic math (Webster's method).
    - `spillback_detector.py`: Safety mechanism to prevent gridlock.
    - `geometric_database.py`: Manages intersection physical layout (lanes, widths).
- **Configuration**: `junction_config.json` stores the static mapping of the city (Lat/Lon, Lanes, stored signal timings).

### 2. Frontend (`/frontend`)
- **Technology**: React (Vite) + Vanilla CSS.
- **Design System**: "Sci-Fi Control Room" aesthetic (Dark mode, Neon accents).
- **Key Views**:
    - **Dashboard**: Global system health and alerts.
    - **Junction Details**: Live monitoring with Visual Signal Map and simulated video feed.
    - **Analytics**: Historical traffic volume and efficiency reports (using `recharts`).
    - **Settings**: System configuration and JSON editor.
- **State**: Currently uses client-side state; integration with Backend API is ready to be hooked up.

### 3. Simulation (`/simulation`)
- **Tool**: SUMO (Simulation of Urban MObility).
- **Purpose**: Validates logic before rapid deployment.
- **Files**: Contains network definitions (`.net.xml`, `.rou.xml`) for the Vadodara city context.

## Current Project Status
- **✅ Codebase**: Fully synced with GitHub (`main` branch).
- **✅ Frontend**: UI is complete, responsive, and verified.
- **✅ Backend**: Core logic implementation is complete.
- **⚠️ Integration**: The Frontend is currently running on mock data. It needs to be connected to the Backend API to show live, real-time values.
- **⚠️ Dependencies**: Heavy AI libraries (`torch`, `ultralytics`) were installing on the backend. This needs confirmation of completion to run the Vision Module.

## Recommendations
1. **Connect API**: Update `frontend/src/services` to fetch real data from `localhost:8000`.
2. **Verify Vision**: Run the `demo.py` script to test if the YOLO model loads correctly on this machine.
3. **Run Simulation**: Execute the SUMO comparison scripts to generate new results for the Analytics dashboard.
