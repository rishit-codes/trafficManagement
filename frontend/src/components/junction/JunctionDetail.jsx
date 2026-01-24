import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GeometryPanel from './GeometryPanel';
import TrafficMetrics from './TrafficMetrics';
import SpillbackPanel from './SpillbackPanel';
import OptimizationPanel from './OptimizationPanel';
import TrafficSignal4Way from './TrafficSignal4Way';
import LiveCameraPanel from '../dashboard/LiveCameraPanel';
import MultiCameraGrid from './MultiCameraGrid';
import AnalyticsChart from './AnalyticsChart';
// import ComputerVisionPanel from './ComputerVisionPanel';
// import { getJunctionById, getJunctionState } from '../../services/api';
import { pilotJunctions } from '../../data/pilotJunctions';
import './JunctionDetail.css';

const JunctionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Use URL param as source of truth, fallback to first pilot junction
  const selectedId = id || pilotJunctions[0]?.id;

  // Junction data state
  const [junctionData, setJunctionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Signal state (polled separately at 1-second interval)
  const [signalState, setSignalState] = useState(null);
  const [signalLoading, setSignalLoading] = useState(true);
  const [signalError, setSignalError] = useState(null);

  // Helper to get static info from pilot file
  const selectedPilotJunction = pilotJunctions.find(j => j.id === selectedId) || pilotJunctions[0];

  // 1. Simulation Data Integration (No Backend)
  useEffect(() => {
    if (!selectedId) return;

    // Simulate reliable data connection
    setLoading(true);
    setError(null);
    
    // In a real app we'd get this from the global context/simulation
    // For now we mock the successful connection to the simulation bus
    const timer = setTimeout(() => {
        setJunctionData({
            id: selectedId,
            name: selectedPilotJunction.name,
            status: 'optimal',
            ...selectedPilotJunction, // contain lat/lng etc
        });
        setLastUpdated(new Date());
        setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedId, selectedPilotJunction]);

  // --- SMART TRAFFIC ENGINE (Simulated AI) ---
  // Centralized state for Traffic Counts & Signal Logic so all children are synced
  const [trafficState, setTrafficState] = useState({
    north: { cars: 15, buses: 1, trucks: 0, bikes: 5, pcu: 20.5, speed: 45, queue: 8 },
    south: { cars: 12, buses: 0, trucks: 1, bikes: 3, pcu: 16.5, speed: 50, queue: 5 },
    east:  { cars: 20, buses: 2, trucks: 0, bikes: 8, pcu: 30.0, speed: 35, queue: 12 },
    west:  { cars: 8,  buses: 0, trucks: 0, bikes: 2, pcu: 9.0,  speed: 60, queue: 2 }
  });

  const [aiLog, setAiLog] = useState("Initializing Vision System...");

  // 1. Traffic Generation (Simulated "High-Impact" Events)
  useEffect(() => {
    const scanInterval = setInterval(() => {
        setTrafficState(prev => {
            const currentPhase = stateRef.current.currentPhase;
            const dirMap = { 'N': 'north', 'S': 'south', 'E': 'east', 'W': 'west' };
            const dirs = ['N', 'S', 'E', 'W'];
            
            // 1. Ouflow: Decrease traffic in the ACTIVE (Green) lane
            const nextState = { ...prev };
            
            if (currentPhase) {
                const activeDir = dirMap[currentPhase];
                const activeData = prev[activeDir];
                // Simulate fast outflow to clear the previous winner
                const newCars = Math.max(0, activeData.cars - 8); 
                const newPCU = (newCars * 1.0) + (activeData.buses * 3.0) + (activeData.trucks * 3.0);
                
                nextState[activeDir] = {
                    ...activeData,
                    cars: newCars,
                    pcu: newPCU,
                    queue: Math.floor(newPCU * 0.4),
                    speed: Math.min(60, activeData.speed + 8) 
                };
            }

            // 2. Inflow: Chaos Mode - Pick ONE "Unlucky" lane to spike
            // This forces a clear "winner" for the priority algorithm
            const availableLanes = dirs.filter(d => d !== currentPhase);
            const unluckyLane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
            const targetDir = dirMap[unluckyLane];
            const oldData = prev[targetDir];

            // Massive Spike: 20-40 Vehicles at once (Simulating a platoon arrival)
            const spike = Math.floor(Math.random() * 20) + 20; 
            const cars = oldData.cars + spike;
            const pcu = (cars * 1.0) + (oldData.buses * 3.0) + (oldData.trucks * 3.0) + (oldData.bikes * 0.5);

            nextState[targetDir] = {
                ...oldData,
                cars: cars,
                pcu: pcu,
                queue: Math.floor(pcu * 0.4),
                speed: Math.max(5, 50 - (pcu*0.6)) // Speed crashes
            };

            // Log the Critical Event
            const vidId = Math.floor(Math.random() * 4) + 1;
            setAiLog(`> Executing: python backend/test_accuracy.py --video samples/trafficdemo${vidId}.mp4\n> [CRITICAL DETECTION] +${spike} Vehicles in ${unluckyLane} (Total PCU: ${pcu.toFixed(0)})`);

            return nextState;
        });
    }, 5000); // Trigger a major event every 5 seconds

    return () => clearInterval(scanInterval);
  }, []);

  // 2. Adaptive Signal Control Loop (Tick-Based for Smooth Countdown)
  const trafficRef = React.useRef(trafficState);
  useEffect(() => { trafficRef.current = trafficState; }, [trafficState]);

  // Signal phases: North, South, East, West
  const phases = ['N', 'S', 'E', 'W'];
  const cycleCountsRef = React.useRef({ N: 0, S: 0, E: 0, W: 0 });
  
  // Internal state need refs for async access inside interval/timeout chains
  const stateRef = React.useRef({
      phaseIdx: 0,
      status: 'GREEN',
      timeLeft: 0,
      currentPhase: 'N'
  });

  const intervalRef = React.useRef(null);

  useEffect(() => {
    if (!selectedId) return;
    
    // Initial Start
    const startNextPhase = () => {
        const dirMap = { 'N': 'north', 'S': 'south', 'E': 'east', 'W': 'west' };
        
        // 1. Prioritization Logic (Max Pressure)
        const counts = cycleCountsRef.current;
        const prevPhase = stateRef.current.currentPhase;
        
        // Standard Candidates: Not just served, not current
        let candidates = phases.filter(p => p !== prevPhase);
        
        // Filter by fairness (max 2 turns) UNLESS a lane is critical (>60 PCU)
        const criticalLanes = candidates.filter(p => trafficRef.current[dirMap[p]].pcu > 60);
        
        if (criticalLanes.length > 0) {
            candidates = criticalLanes; // Force critical lanes
        } else {
            // Fairness filter
            const fairCandidates = candidates.filter(p => counts[p] < 2);
            if (fairCandidates.length > 0) {
                candidates = fairCandidates;
            } else {
                // All served 2 times, reset cycle
                cycleCountsRef.current = { N: 0, S: 0, E: 0, W: 0 };
            }
        }

        // Selection: Pick candidate with HIGHEST PCU
        let nextPhase = candidates[0];
        let maxPCU = -1;
        
        candidates.forEach(p => {
            const pcu = trafficRef.current[dirMap[p]].pcu;
            if (pcu > maxPCU) {
                maxPCU = pcu;
                nextPhase = p;
            }
        });

        // 2. Setup New Phase
        cycleCountsRef.current[nextPhase] += 1;
        stateRef.current.currentPhase = nextPhase;
        
        // 3. Calculate Green Time
        const currentTraffic = trafficRef.current[dirMap[nextPhase]];
        const totalPCU = trafficRef.current.north.pcu + trafficRef.current.south.pcu + trafficRef.current.east.pcu + trafficRef.current.west.pcu;
        const cycleCapacity = Math.max(totalPCU, 80); 
        const rawTime = (currentTraffic.pcu / cycleCapacity) * 120;
        const greenTime = Math.round(Math.max(15, Math.min(60, rawTime)));

        // 4. Log AI Decision
        if (candidates.length > 1 && maxPCU > 30) {
             setAiLog(`AI: Prioritizing ${nextPhase} (High Density: ${maxPCU.toFixed(1)}) → ${greenTime}s`);
        } else if (greenTime > 40) {
             setAiLog(`AI: High Demand (${nextPhase}) → Extending Green to ${greenTime}s`);
        } else {
             setAiLog(`AI: Optimal Flow (${nextPhase}) → ${greenTime}s Green`);
        }

        stateRef.current.timeLeft = greenTime;
        stateRef.current.status = 'GREEN';

        setSignalState({
            current_phase: nextPhase,
            active_directions: [nextPhase],
            time_remaining: greenTime,
            display_name: `Phase ${nextPhase} (Priority)`,
            status: 'GREEN',
            cycle_length: 120
        });
        setSignalLoading(false);
    };

    // Initialize
    // Don't call startNextPhase() immediately here to avoid double-init on strict mode, 
    // relying on the Effect to set up the interval is better but we need initial state.
    // We'll use a mounted ref check or just let it run.
    
    // Safety check to ensure we don't start multiple intervals
    if (!intervalRef.current) {
        startNextPhase();
        
        intervalRef.current = setInterval(() => {
            stateRef.current.timeLeft -= 1;

            if (stateRef.current.timeLeft <= 0) {
                if (stateRef.current.status === 'GREEN') {
                    // Switch to Yellow
                    stateRef.current.status = 'YELLOW';
                    stateRef.current.timeLeft = 3;
                    setSignalState(prev => ({
                        ...prev,
                        time_remaining: 3,
                        status: 'YELLOW',
                        display_name: `Phase ${stateRef.current.currentPhase} (Clearing)`
                    }));
                } else {
                    // Yellow Finished -> Pick Next
                    startNextPhase();
                }
            } else {
                // Standard Tick
                setSignalState(prev => ({
                    ...prev,
                    time_remaining: stateRef.current.timeLeft
                }));
            }
        }, 1000);
    }

    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
    }; 
  }, [selectedId]);

  // 3. LISTEN FOR MANUAL OVERRIDES (Control Panel Bridge)
  // Logic: Check localStorage on mount + listen for events + poll for cross-tab updates
  useEffect(() => {
      const applyOverride = (payload) => {
          const { junctionId, type, timestamp } = payload;
          
          // Ignore old commands (> 2 mins)
          if (Date.now() - timestamp > 120000) return;

          console.log(`Applying Override: ${type} for ${junctionId}`);
          
          if (type === 'force_red') {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = null;
              
              stateRef.current.status = 'ALL_RED';
              stateRef.current.timeLeft = 60;
              
              setSignalState(prev => ({
                  ...prev,
                  status: 'ALL_RED',
                  display_name: 'MANUAL OVERRIDE: ALL RED',
                  time_remaining: 60,
                  active_directions: []
              }));
              setAiLog("⚠️ MANUAL OVERRIDE APPLIED: ALL RED (STOP TRAFFIC)");
              
              // Reset mechanism
              setTimeout(() => window.location.reload(), 60000);
              
          } else if (type === 'extend_green') {
              if (stateRef.current.status === 'ALL_RED') return;

              let newTime = stateRef.current.timeLeft + 30;
              let newStatus = stateRef.current.status;

              if (stateRef.current.status === 'YELLOW') {
                  newStatus = 'GREEN';
                  newTime = 30;
                  stateRef.current.status = 'GREEN';
              }
              
              stateRef.current.timeLeft = newTime;
              setSignalState(prev => ({
                  ...prev,
                  status: newStatus,
                  time_remaining: newTime,
                  display_name: `${prev.display_name.split('(')[0].trim()} (Manual +30s)`
              }));
              setAiLog(`⚠️ MANUAL OVERRIDE: ${newStatus} Phase Extended (+30s)`);

          } else if (type === 'flash_yellow') {
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = null;

              stateRef.current.status = 'YELLOW';
              setSignalState(prev => ({
                  ...prev,
                  current_phase: 'FLASH_YELLOW',
                  status: 'YELLOW',
                  display_name: 'MAINTENANCE MODE (FLASH YELLOW)',
                  time_remaining: 999,
                  active_directions: ['N', 'S', 'E', 'W']
              }));
              setAiLog("⚠️ MANUAL OVERRIDE: MAINTENANCE MODE ACTIVATED");
          
          } else if (type === 'optimize') {
              // Simulate Optimization: Reset cycle weights or force re-eval
              cycleCountsRef.current = { N: 0, S: 0, E: 0, W: 0 }; // Reset fairness counters
              setAiLog("✅ NETWORK OPTIMIZATION: Updated Signal Timing Weights");
              
          } else if (type === 'emergency_corridor') {
              // Priority Green for Emergency Vehicle
              const { vehicleId, routeStrategy } = payload;
              
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = null;
              
              stateRef.current.status = 'GREEN';
              stateRef.current.timeLeft = 120; // 2 minutes clearance
              
              setSignalState(prev => ({
                  ...prev,
                  status: 'GREEN',
                  current_phase: 'PRIORITY_GREEN',
                  display_name: `GREEN CORRIDOR: ${vehicleId}`,
                  time_remaining: 120,
                  active_directions: ['N', 'S'] // Assume N-S is main arterial for demo
              }));
              setAiLog(`🚨 EMERGENCY OVERRIDE: Green Wave Active for ${vehicleId}`);

          } else if (type === 'reset') {
              // Clear Overrides
              localStorage.removeItem('traffic_override_cmd');
              stateRef.current.lastOverrideTime = Date.now(); // Prevent re-reading old cmd
              
              if (intervalRef.current) clearInterval(intervalRef.current);
              intervalRef.current = null;
              
              // Force reload to clean state
              window.location.reload();
          }
      };

      // 1. Check existing command on mount
      const savedCmd = localStorage.getItem('traffic_override_cmd');
      if (savedCmd) {
          try {
              const parsed = JSON.parse(savedCmd);
              applyOverride(parsed);
          } catch(e) { console.error("Invalid override cmd", e); }
      }

      // 2. Listen for same-tab events
      const handleEvent = (e) => applyOverride(e.detail);
      window.addEventListener('signal-override', handleEvent);

      // 3. Poll for cross-tab updates (Storage event is flaky on some browsers/local file)
      const pollInterval = setInterval(() => {
          const cmd = localStorage.getItem('traffic_override_cmd');
          if (cmd) {
              const parsed = JSON.parse(cmd);
              // Simple dedup: check if we just applied this timestamp
              if (parsed.timestamp > (stateRef.current.lastOverrideTime || 0)) {
                  stateRef.current.lastOverrideTime = parsed.timestamp;
                  applyOverride(parsed);
              }
          }
      }, 1000);

      return () => {
          window.removeEventListener('signal-override', handleEvent);
          clearInterval(pollInterval);
      };
  }, []);

  return (
    <div className="junction-detail-container">
      {/* 1. Junction Header */}
      <div className="junction-header">
        <div className="header-left">
          <div className="junction-selector">
            <select
              className="junction-select"
              value={selectedId}
              onChange={(e) => navigate(`/junction/${e.target.value}`)}
            >
              {pilotJunctions.map(j => (
                <option key={j.id} value={j.id}>{j.name}</option>
              ))}
            </select>
          </div>

          <span className="junction-id">ID: {selectedId}</span>

          <span className={`status-badge status-${junctionData ? 'active' : 'gray'}`}>
            {junctionData ? 'ONLINE' : 'DATA OFFLINE'}
          </span>
        </div>

        <div className="header-right">
          <span className="last-updated">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for connection...'}
          </span>
        </div>
      </div>

      {/* 2. Content Body */}
      {loading && !junctionData && !error && (
        <div className="detail-section loading">Connecting to junction...</div>
      )}

      {/* Primary Row: Always Visible (Video works independently of backend data) */}
      <section className="detail-section">
        <h3 className="section-title">Signal Status</h3>
        <div className="primary-control-grid">
          {/* LEFT: 4-Way Traffic Signal (Handles its own error state) */}
          <TrafficSignal4Way
            currentPhase={signalState?.current_phase || null}
            activeDirections={signalState?.active_directions || []}
            timeRemaining={signalState?.time_remaining || 0}
            displayName={signalState?.display_name || ''}
            loading={signalLoading}
            error={signalError}
          />

          {/* CENTER: 4-Way Video Grid */}
          <div className="compact-video-wrapper">
            <MultiCameraGrid
              junction={selectedPilotJunction}
              signalState={signalState}
            />
          </div>

          {/* RIGHT: Quick Metrics */}
          <div className="quick-metrics-panel">
            <GeometryPanel data={junctionData} />
          </div>
        </div>
      </section>

      {/* Secondary Row: Only visible if we have backend data */}
      {(error || (!loading && !junctionData)) ? (
        <div className="detail-section empty-state">
          <p>Additional telemetry unavailable for this junction.</p>
          <p className="subtext">The backend controller for {selectedId} may be offline or unreachable.</p>
        </div>
      ) : (
        junctionData && (
          <section className="detail-section">
            <h3 className="section-title">Junction Monitoring</h3>
            <div className="monitoring-panels-row">
              <TrafficMetrics state={signalState} junctionData={junctionData} trafficData={trafficState} />
              <SpillbackPanel junctionData={junctionData} />
              <OptimizationPanel state={signalState} />
            </div>

            {/* 3. Analytics Chart */}
            <AnalyticsChart junctionId={selectedId} />
          </section>
        )
      )}
    </div>
  );
};

export default JunctionDetail;

