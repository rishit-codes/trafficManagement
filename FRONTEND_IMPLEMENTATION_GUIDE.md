# Frontend Implementation Guide

This guide explains how to complete the frontend implementation for the Traffic Management System using the existing project structure.

## 1. Project Structure Analysis

The current structure is well-organized:
*   **`src/api.js`**: Centralized API client using `axios`.
*   **`src/components/`**: Reusable UI components (e.g., `LiveSignalPanel`, `SpillbackAlert`).
*   **`src/pages/`**: Main application views (`Dashboard`, `JunctionDetails`, etc.).
*   **`src/styles/`**: Global and layout styles.

## 2. Prerequisites

Ensure dependencies are installed:
```bash
npm install lucide-react framer-motion axios recharts
```

## 3. Step-by-Step Implementation

### Step 1: Verify API Configuration (`src/utils/api.js`)
*   **Current State**: The `api.js` file is correctly set up to point to `http://localhost:8000`.
*   **Action**: Ensure your backend is running on this port. If using Vite proxy (recommended), keep the existing configuration where it uses `/api` in production or localhost in development.

### Step 2: Implement Dashboard (`src/pages/Dashboard.jsx`)
The dashboard is the main entry point. It should display a high-level overview.

**Recommended Structure:**
```jsx
// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import JunctionSelector from '../../components/JunctionSelector';
import MetricsDashboard from '../../components/MetricsDashboard';
import LiveSignalPanel from '../../components/LiveSignalPanel';
import SpillbackAlert from '../../components/SpillbackAlert';
import OptimizationPanel from '../../components/OptimizationPanel';

function Dashboard() {
  const [selectedJunction, setSelectedJunction] = useState(null);

  // 1. Fetch junction list on mount
  // 2. Select first junction by default
  
  return (
    <div className="dashboard-grid">
      {/* Top Row: Metrcs */}
      <MetricsDashboard junction={selectedJunction} />
      
      {/* Middle Row: Optimization & Signals */}
      <OptimizationPanel junction={selectedJunction} />
      <LiveSignalPanel junction={selectedJunction} />
      
      {/* Bottom Row: Alerts */}
      <SpillbackAlert junction={selectedJunction} />
    </div>
  );
}
```

### Step 3: Implement Optimization Panel (`src/components/OptimizationPanel.jsx`)
This component connects to the `POST /optimize` endpoint.

**Key Logic:**
1.  **Input State**: Create form inputs for traffic flow (PCU/hr) for North, South, East, West.
2.  **API Call**: On submit, call `trafficAPI.optimizeJunction(id, flows)`.
3.  **Display Results**: Show the returned `cycle_length_s` and `phases`.

**Suggested UI:**
*   Use 4 input fields for directional flow.
*   "Optimize" button (primary action).
*   Result card showing:
    *   New Cycle Length (e.g., "90s").
    *   Phase splits (e.g., "NS: 40s (Green)", "EW: 35s (Green)").

### Step 4: Implement Junction Details (`src/pages/junction/JunctionDetails.jsx`)
Show static geometric data from `GET /junctions/{id}`.

**Data to Display:**
*   Lane count per approach.
*   Lane width (highlight narrow lanes < 3.0m in red).
*   Turn radius.
*   Calculated Saturation Flow ($S_{geom}$).

### Step 5: Styles & Theming (`src/styles/`)
*   **Glassmorphism**: The `LiveSignalPanel` already uses a `.glass` class. Ensure this is defined in `global.css`:
    ```css
    .glass {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1rem;
    }
    ```
*   **Colors**: Use the variable CSS files to maintain consistency (green for OK, red for Critical/Stop, yellow for Warning/Yield).

## 4. Integration Checklist

| Component | Backend Endpoint | Status |
| :--- | :--- | :--- |
| **JunctionSelector** | `GET /junctions` | ✅ Ready to integrate |
| **OptimizationPanel** | `POST /optimize/{id}` | ✅ Ready to integrate |
| **SpillbackAlert** | `POST /spillback/{id}` | ✅ Implemented |
| **LiveSignalPanel** | `GET /junctions/{id}/state` | ⚠️ Needs WebSocket or Polling |

**Note on Live Signals:**
The current `LiveSignalPanel` uses a simulated timer. To make it real, replace the `setInterval` in `useEffect` with a polling mechanism (calling `trafficAPI.getJunctionState(id)` every 1s) or implement a WebSocket connection if the backend supports it.

## 5. Running the Application

1.  **Start Backend:**
    ```bash
    # In /backend
    source venv/bin/activate
    uvicorn api.main:app --reload --port 8000
    ```

2.  **Start Frontend:**
    ```bash
    # In /frontend
    npm run dev
    ```
3.  **Access:** Open `http://localhost:5173`.
