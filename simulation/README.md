# SUMO Simulation Integration

Complete traffic simulation integration for testing and validating the geometry-aware Webster optimization algorithms.

## Overview

This module provides a complete SUMO simulation environment that:
- ✅ Converts your 3 Vadodara junctions to SUMO network files
- ✅ Generates realistic heterogeneous Indian traffic (cars, bikes, buses, trucks)
- ✅ Runs baseline (fixed-time) vs adaptive (Webster-optimized) signal control
- ✅ Collects performance metrics to prove your 35% improvement claims
- ✅ Validates algorithms before real-world deployment

## Quick Start

### 1. Check SUMO Installation

```bash
python -c "import traci, sumolib; print('SUMO libraries installed')"
```

If this fails, install SUMO:
- **Windows**: Download from https://sumo.dlr.de/docs/Installing/Windows_Build.html
- **Or**: `pip install eclipse-sumo` (bundled Python version)

### 2. Generate Network

```bash
python simulation/vadodara_network.py
```

**Output**: Creates `simulation/networks/vadodara.{nod,edg,con,tll,net}.xml`

### 3. Generate Traffic Demand

```bash
python simulation/traffic_generator.py
```

**Output**: Creates demand files for peak/offpeak/night scenarios

### 4. Run Simulation

```bash
# Compare baseline vs adaptive (600 seconds each, ~20 minutes total)
python simulation/run_simulation.py --mode compare --duration 600

# Or run individually
python simulation/run_simulation.py --mode baseline --duration 600 --gui
python simulation/run_simulation.py --mode adaptive --duration 600 --gui
```

## Files Created

```
simulation/
├── __init__.py                   # SUMO installation checker
├── vadodara_network.py           # Network generator (JSON → SUMO)
├── traffic_generator.py          # Heterogeneous traffic demand
├── sumo_controller.py            # TraCI integration layer
├── run_simulation.py             # Baseline vs Adaptive runner
├── networks/                     # Generated SUMO network files
│   ├── vadodara.nod.xml         # Nodes (junctions)
│   ├── vadodara.edg.xml         # Edges (roads)
│   ├── vadodara.con.xml         # Connections (turn movements)
│   ├── vadodara.tll.xml         # Traffic light logic
│   └── vadodara.net.xml         # Compiled network
├── demand/                       # Generated traffic demand
│   ├── vtypes.rou.xml           # Vehicle type definitions
│   ├── vadodara_peak.rou.xml    # Peak hour demand
│   ├── vadodara_offpeak.rou.xml # Off-peak demand
│   └── vadodara_night.rou.xml   # Night demand
└── results/                      # Simulation output
    └── comparison_*.json         # Metrics comparison
```

## Architecture

### Data Flow

```
junction_config.json → Network Generator → SUMO .net.xml
                                             ↓
vadodara_context.json → Traffic Generator → .rou.xml files
                                             ↓
                                    SUMO Simulation (TraCI)
                                             ↓
                        ┌────────────────────┴────────────────────┐
                        ↓                                         ↓
                 BASELINE MODE                             ADAPTIVE MODE
            Fixed-time signals                   Dynamic Webster optimization
          (from junction config)                   (every 5 seconds)
                        ↓                                         ↓
                        └────────────────────┬────────────────────┘
                                             ↓
                                   Metrics Collector
                                             ↓
                                   Comparison Report
```

### Simulation Modes

#### Baseline Mode
- **Signal Control**: Fixed-time from `junction_config.json` `current_timing`
- **Purpose**: Represents current pre-timed signal operation
- **Example**: Alkapuri Circle has 120s cycle (45s NS green, 45s EW green)

#### Adaptive Mode
- **Signal Control**: Dynamic Webster optimization
- **Update Frequency**: Every 5 seconds
- **Features**:
  - Real-time traffic detection from SUMO
  - Geometry-aware saturation flow calculation
  - HCM-compliant optimization
  - Spillback prevention
- **Pipeline**: `SUMO → TrafficDetector → PCUConverter → GeometricDB → WebsterOptimizer → SignalController`

## Key Modules

### `vadodara_network.py` - Network Generator

Converts `junction_config.json` to SUMO network files.

**Key Functions**:
- `generate_network()`: Main entry point
- `_create_nodes_file()`: Junction locations
- `_create_edges_file()`: Roads with lane counts and widths
- `_create_connections_file()`: Turn movements with radius constraints
- `_create_traffic_lights_file()`: Baseline signal timing

**Geometric Fidelity**:
- Lane widths applied (2.8m old city → 3.65m NH-48)
- Turn radii affect connection speeds
- Storage lengths tracked for spillback detection

### `traffic_generator.py` - Demand Generator

Creates heterogeneous Indian traffic patterns.

**Vehicle Types**:
- **Car**: 60% (suburban), 35% (old city), 50% (NH-48)
- **Motorcycle**: 25% (suburban), 55% (old city), 20% (NH-48)
- **Bus**: 10% (suburban), 8% (old city), 5% (NH-48)
- **Truck**: 5% (suburban), 2% (old city), 25% (NH-48)

**Scenarios**:
- **Peak**: 1200 veh/hr per junction (100% demand)
- **Offpeak**: 780 veh/hr (65% demand)
- **Night**: 180 veh/hr (15% demand)

### `sumo_controller.py` - TraCI Integration

Bridges SUMO with existing optimization modules.

**Classes**:
- `SUMOController`: Manages simulation lifecycle
- `SUMOTrafficDetector`: Extracts traffic data from SUMO (replaces camera vision)
- `AdaptiveSignalController`: Orchestrates optimization loop

**Traffic Detection**:
```python
state = detector.get_traffic_state("J001", "north")
# Returns: vehicle_counts, total_pcu, queue_length_m, waiting_time_s
```

### `run_simulation.py` - Comparison Runner

Runs baseline vs adaptive simulations and compares metrics.

**Metrics Collected**:
- Average waiting time (s)
- Average travel time (s)
- Max/average queue length (m)
- Throughput (vehicles/hour)
- Spillback events (count)
- Total delay (vehicle-hours)

**Output Example**:
```
Metric                    Baseline    Adaptive    Change
---------------------------------------------------------------
Avg Waiting Time (s)      45.20       29.40       35.0% ↓
Max Queue Length (m)      87.50       52.30       40.2% ↓
Throughput (veh/hr)       6,820       7,850       15.1% ↑
Spillback Events          12          2           83.3% ↓
```

## Usage Examples

### Run Quick Test (10 minutes)

```bash
python simulation/run_simulation.py --mode compare --duration 600 --scenario peak
```

### Run Full Hour Simulation

```bash
python simulation/run_simulation.py --mode compare --duration 3600 --scenario peak
```

### Visual Demo (SUMO-GUI)

```bash
python simulation/run_simulation.py --mode adaptive --duration 300 --gui --scenario peak
```

Watch the traffic lights change dynamically based on real-time demand!

### Test Individual Junction

```bash
python simulation/sumo_controller.py --gui --scenario peak --duration 300
```

## Integration with Existing Code

The simulation uses your **existing modules** - no code duplication:

```python
from src.pcu_converter import PCUConverter       # Same PCU factors
from src.geometric_database import GeometricDatabase  # Same HCM formulas
from src.webster_optimizer import WebsterOptimizer    # Same optimization
from src.spillback_detector import SpillbackDetector  # Same logic
```

**This ensures**: What works in simulation will work in real-world deployment!

## Validation Targets

From your documentation claims:

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Waiting time reduction | 35% | Compare avg waiting time |
| Spillback reduction | 83% | Count spillback events |
| Throughput increase | 15% | Compare vehicles/hour |
| Delay reduction | 35% | Compare total delay (veh-hrs) |

Run 1-hour peak simulation to get statistically significant results.

## Troubleshooting

### "SUMO not installed"

**Solution 1 - Bundled Python version**:
```bash
pip install eclipse-sumo
```

**Solution 2 - Official installer**:
1. Download from https://sumo.dlr.de/docs/Downloads.php
2. Install to `C:\Program Files\Eclipse\Sumo`
3. The script will auto-detect

### "Network file not found"

```bash
python simulation/vadodara_network.py  # Generate network first
```

### "Route file not found"

```bash
python simulation/traffic_generator.py  # Generate traffic first
```

### "Module not found: traci"

Make sure you're using the venv:
```bash
.\venv\Scripts\activate
pip install traci sumolib  # Should already be in requirements.txt
```

## Next Steps

1. ✅ **Run comparison**: `python simulation/run_simulation.py --mode compare`
2. ✅ **Collect metrics**: Results saved to `simulation/results/`
3. ✅ **Create charts**: Visualize improvements for presentation
4. ✅ **Demo to judges**: Use `--gui` flag for visual demonstration

## For Hackathon Presentation

**Key Talking Points**:
1. "We validated our algorithms in simulation before touching real infrastructure"
2. "Used exact same code for simulation and real-world deployment"
3. "Achieved [X]% waiting time reduction in controlled testing"
4. "Heterogeneous Indian traffic patterns with 4 vehicle types"
5. "Geometry-aware optimization - accounts for narrow old city lanes"

**Demo Flow**:
1. Show baseline simulation (fixed signals, queues build up)
2. Show adaptive simulation (signals adjust, queues clear faster)
3. Show comparison metrics table
4. Explain how this transfers to real Vadodara junctions

---

**Built for Vadodara Smart City Hackathon 2026**
