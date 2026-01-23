# SUMO Simulation Testing Guide

## Quick Start - 3 Simple Steps

### Step 1: System Validation (2 minutes)
Check that everything is properly set up.

```bash
cd c:\Users\Rishtz\Desktop\traffic-anti
.\venv\Scripts\activate
python simulation/test_setup.py
```

**Expected Output**:
```
[PASS] SUMO Installation
[PASS] Generated Files
[PASS] Module Imports
```

If all pass, you're ready! If any fail, see troubleshooting below.

---

### Step 2: Quick Test Run (10 minutes)
Run a short simulation to verify everything works.

```bash
# 10-minute test (baseline only)
python simulation/run_simulation.py --mode baseline --duration 600 --scenario peak
```

**What to watch for**:
- Should print "Starting SUMO simulation..."
- Progress updates every 60s: `[60s] Vehicles: X, Avg Wait: Y.Ys`
- Should complete without errors
- Final metrics printed at end

**If it works**, proceed to Step 3!

---

### Step 3: Full Comparison Test (20-30 minutes)
Compare baseline vs adaptive modes.

```bash
# 10-minute comparison (recommended for first test)
python simulation/run_simulation.py --mode compare --duration 600 --scenario peak

# OR 1-hour comparison (for final validation)
python simulation/run_simulation.py --mode compare --duration 3600 --scenario peak
```

**Expected Output**:
```
############################################################
# SIMULATION COMPARISON: Baseline vs Adaptive
############################################################

======================================================================
 BASELINE SIMULATION (Fixed-Time Signals)
======================================================================
...
[600s] Vehicles: 150, Avg Wait: 45.2s

======================================================================
 ADAPTIVE SIMULATION (Webster-Optimized Signals)
======================================================================
...
[600s] Vehicles: 152, Avg Wait: 29.4s, Optimizations: 120

======================================================================
 COMPARISON RESULTS
======================================================================

Metric                    Baseline    Adaptive    Change
----------------------------------------------------------------------
Avg Waiting Time (s)      45.20       29.40       35.0% ↓
Avg Travel Time (s)       105.20      89.40       15.0% ↓
Max Queue Length (m)      87.50       52.30       40.2% ↓
Throughput (veh/hr)       900         1020        13.3% ↑
Spillback Events          12          2           83.3% ↓
Total Delay (veh-hrs)     1.88        1.22        35.1% ↓
```

**Key Things to Check**:
1. ✅ Adaptive waiting time < Baseline waiting time
2. ✅ Adaptive throughput > Baseline throughput
3. ✅ Adaptive spillback events < Baseline spillback events
4. ✅ Results saved to `simulation/results/comparison_*.json`

---

## Visual Demo (Optional)

Want to **see** the traffic simulation? Use the GUI:

```bash
python simulation/run_simulation.py --mode adaptive --duration 300 --gui --scenario peak
```

**What you'll see**:
- SUMO-GUI window opens
- Vehicles (colored by type: cars=yellow, bikes=cyan, buses=blue, trucks=red)
- Traffic lights changing
- Queues forming and clearing
- Real-time visualization

**Controls**:
- Space: Pause/Resume
- Ctrl+D: Open delay visualization
- View → Traffic Lights → Show link bubbles (see phase timings)

---

## Detailed Testing Scenarios

### Test 1: Peak Hour (Recommended First)
```bash
python simulation/run_simulation.py --mode compare --duration 600 --scenario peak
```
- **Traffic**: 1200 veh/hr per junction
- **Tests**: Oversaturation handling, spillback prevention
- **Expected**: 25-35% improvement

### Test 2: Off-Peak
```bash
python simulation/run_simulation.py --mode compare --duration 600 --scenario offpeak
```
- **Traffic**: 780 veh/hr (65% of peak)
- **Tests**: Moderate demand, efficiency
- **Expected**: 15-25% improvement (less congestion = less room for improvement)

### Test 3: Night Time
```bash
python simulation/run_simulation.py --mode compare --duration 600 --scenario night
```
- **Traffic**: 180 veh/hr (very light)
- **Tests**: Low-demand behavior
- **Expected**: Minimal difference (both modes work well with low traffic)

### Test 4: Extended Duration (Final Validation)
```bash
# 1-hour simulation for statistically significant results
python simulation/run_simulation.py --mode compare --duration 3600 --scenario peak
```
- **Why**: More vehicles = more reliable statistics
- **When**: After quick tests pass
- **Duration**: ~2 hours (1 hour baseline + 1 hour adaptive)

---

## Understanding the Results

### Comparison Metrics Explained

**Average Waiting Time**
- Time vehicles spend stopped/slow (< 0.1 m/s)
- **Target**: 35% reduction
- **Why it matters**: Direct measure of driver frustration

**Throughput**
- Vehicles/hour that successfully pass through
- **Target**: 15% increase
- **Why it matters**: More vehicles served = less congestion

**Spillback Events**
- Times when queue exceeded storage capacity
- **Target**: 83% reduction
- **Why it matters**: Prevents gridlock

**Max Queue Length**
- Longest queue observed (meters)
- Shows worst-case scenario
- Important for infrastructure planning

### What "Good" Results Look Like

**Strong Performance** (What you want):
```
Avg Waiting Time:  40% ↓
Throughput:        18% ↑
Spillback Events:  85% ↓
```

**Moderate Performance** (Still good):
```
Avg Waiting Time:  25% ↓
Throughput:        10% ↑
Spillback Events:  70% ↓
```

**Weak Performance** (Investigation needed):
```
Avg Waiting Time:  < 10% ↓
Throughput:        < 5% ↑
Spillback Events:  No change
```

If you get weak performance, see Troubleshooting below.

---

## Interpreting Results by Scenario

### Peak Hour (1200 veh/hr)
- **Expected**: Strong improvements (30-40% waiting time reduction)
- **Why**: System is stressed, optimization has room to help

### Off-Peak (780 veh/hr)
- **Expected**: Moderate improvements (15-25%)
- **Why**: Less congestion = less room for optimization

### Night (180 veh/hr)
- **Expected**: Minimal difference (< 10%)
- **Why**: Traffic is so light that simple fixed timings work fine

---

## Results Files

After running comparison, check:

```
simulation/results/
└── comparison_1737527400.json  # Timestamp-based filename
```

**JSON Structure**:
```json
{
  "baseline": {
    "scenario": "baseline",
    "total_vehicles": 150,
    "average_waiting_time_s": 45.20,
    ...
  },
  "adaptive": {
    "scenario": "adaptive",
    "total_vehicles": 152,
    "average_waiting_time_s": 29.40,
    ...
  },
  "timestamp": 1737527400
}
```

**Use this data for**:
- Presentation charts
- Performance documentation
- Comparing different runs

---

## Troubleshooting

### Issue: "SUMO not available"

**Solution 1** - Python bundled version:
```bash
pip install eclipse-sumo
```

**Solution 2** - Official installer:
1. Download: https://sumo.dlr.de/docs/Downloads.php
2. Install to `C:\Program Files (x86)\Eclipse\Sumo`
3. Restart terminal

### Issue: "Network file not found"

```bash
# Regenerate network
python simulation/vadodara_network.py
```

### Issue: "Route file not found"

```bash
# Regenerate traffic demand
python simulation/traffic_generator.py
```

### Issue: "No improvement in adaptive mode"

**Possible causes**:
1. Simulation too short (< 300s) - Not enough vehicles
2. Traffic too light - No congestion to optimize
3. Bug in code (but we fixed the critical one!)

**Solution**: Run longer simulation (600s+) with peak scenario

### Issue: "Simulation runs but crashes"

Check for:
- Python errors in output
- TraCI connection errors
- File permission issues

**Get detailed logs**:
```bash
python simulation/run_simulation.py --mode adaptive --duration 60 2> error.log
```

### Issue: "Very slow simulation"

- GUI mode is slower (disable with no `--gui` flag)
- Large duration (3600s) takes time - be patient
- Progress printed every 60 simulation seconds

---

## Advanced Testing

### Test Individual Junction

```bash
python simulation/sumo_controller.py --duration 300 --scenario peak
```

Tests just the adaptive controller without comparison.

### Test with Different Junctions

Edit `config/junction_config.json` to modify junction parameters, then:
```bash
python simulation/vadodara_network.py  # Regenerate network
python simulation/run_simulation.py --mode compare --duration 600
```

### Batch Testing

Create a test script:
```bash
# test_all_scenarios.bat
python simulation/run_simulation.py --mode compare --duration 600 --scenario peak
python simulation/run_simulation.py --mode compare --duration 600 --scenario offpeak
python simulation/run_simulation.py --mode compare --duration 600 --scenario night
```

---

## Next Steps After Testing

### 1. Collect Results ✅
- JSON files in `simulation/results/`
- Screenshots if using GUI
- Note the improvement percentages

### 2. Create Visualizations 📊
- Import JSON into Excel/Python
- Create bar charts comparing metrics
- Show before/after queue lengths

### 3. Document Findings 📝
- Update presentation with actual numbers
- Replace "expected 35%" with "achieved X%"
- Add screenshots of simulation

### 4. Prepare Demo 🎬
- Record GUI simulation video
- Practice explaining the visual
- Highlight dynamic signal changes

---

## Hackathon Presentation Tips

**What to Show**:
1. ✅ Quick GUI demo (2 minutes max)
2. ✅ Comparison metrics table (the money shot!)
3. ✅ Mention heterogeneous traffic (Indian context)
4. ✅ Emphasize geometry-aware optimization

**What to Say**:
- "We validated our algorithms in simulation before touching real infrastructure"
- "Achieved X% waiting time reduction with zero hardware cost"
- "Tested on 3 junction types: suburban, old city, and highway corridor"
- "Same code runs in simulation and real-world deployment"

---

## Checklist Before Demo

- [ ] Run 1-hour peak simulation successfully
- [ ] Collect results JSON file
- [ ] Create comparison charts (optional but impressive)
- [ ] Record GUI video (1-2 minutes)
- [ ] Practice explaining metrics
- [ ] Have backup slides in case demo fails live

---

## Quick Reference Commands

```bash
# System check
python simulation/test_setup.py

# Quick test (10 min)
python simulation/run_simulation.py --mode compare --duration 600 --scenario peak

# Full test (2 hours)
python simulation/run_simulation.py --mode compare --duration 3600 --scenario peak

# Visual demo
python simulation/run_simulation.py --mode adaptive --duration 300 --gui --scenario peak

# Regenerate network
python simulation/vadodara_network.py

# Regenerate traffic
python simulation/traffic_generator.py
```

---

**Good luck with testing! 🚀**

Start with Step 1 (test_setup.py) and work your way through. The whole testing process should take about 30-60 minutes for initial validation.
