import React, { useEffect, useState } from 'react';
import { pilotJunctions } from '../../data/pilotJunctions';
import KpiCards from './KpiCards';
import CityMap from './CityMap';
import AlertsPanel from './AlertsPanel';
import LiveCameraPanel from './LiveCameraPanel';
import GreenCorridorPanel from '../control/GreenCorridorPanel';
import SignalPhaseVisualizer from './SignalPhaseVisualizer';
import ConductorPanel from './ConductorPanel';
import MultiModalPanel from './MultiModalPanel';
import { useTraffic } from '../../context/TrafficContext';
import './Dashboard.css';
import simulationData from '../../data/simulation_output.json';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const { overrides } = useTraffic();

  const [junctions, setJunctions] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Default to First Junction ID for selection
  const [selectedJunctionId, setSelectedJunctionId] = useState(pilotJunctions[0]?.id || 'J001');

  const [systemMetrics, setSystemMetrics] = useState({
    avgWaitTime: 45,
    activeSpillbacks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [greenCorridorState, setGreenCorridorState] = useState({
    active: false,
    corridorId: null,
    currentJunctionIndex: -1,
    startedAt: null,
    expectedEndAt: null
  });

  const handleAlertClick = (alert) => {
    const target = alert.sourceJunction || pilotJunctions.find(j => j.id === alert.junctionId);
    if (target) {
      navigate(`/junction/${target.id}`);
    }
  };

  const handleJunctionSelect = (junction) => {
    setSelectedJunctionId(junction.id);
  };

  useEffect(() => {
    // Replay loop
    let stepIndex = 0;
    const timeline = simulationData.timeline || [];
    
    if (timeline.length === 0) {
        setError("No simulation data available");
        setLoading(false);
        return;
    }

    const replayInterval = setInterval(() => {
        const stepData = timeline[stepIndex];
        
        if (stepData) {
            // Update System Metrics
            setSystemMetrics({
                avgWaitTime: stepData.system_metrics.avgWaitTime,
                activeSpillbacks: stepData.system_metrics.activeSpillbacks
            });
            
            // Update Junctions
            // Merge static pilotJunctions with dynamic status from simulation
            const updatedJunctions = pilotJunctions.map(j => {
                const simStatus = stepData.junctions.find(s => s.id === j.id);
                return {
                    ...j,
                    status: simStatus ? simStatus.status : 'optimal',
                    // Project extra metrics from sim if available, or mock them based on status
                    currentQueue: simStatus ? simStatus.max_queue : 0
                };
            });
            setJunctions(updatedJunctions);
            
            // --- ALERT PERSISTENCE LOGIC ---
            // 1. Identify active alerts from current step
            const currentStepAlerts = updatedJunctions
                .filter(j => j.status === 'critical' || j.status === 'warning')
                .map(j => ({
                    id: `alert-${j.id}`,
                    junctionId: j.id,
                    junction: j.name,
                    severity: j.status === 'critical' ? 'CRITICAL' : 'WARNING',
                    message: j.status === 'critical' 
                        ? 'Heavy congestion detected (Simulated)' 
                        : 'Traffic density increasing (Simulated)',
                    // Set expiry to 8 seconds from now
                    expiresAt: Date.now() + 8000, 
                    timestamp: new Date().toISOString()
                }));

            // 2. Update Alerts State
            setAlerts(prevAlerts => {
                const now = Date.now();
                
                // a. Remove expired alerts that are NOT in the current step
                //    (If they are in current step, they will get refreshed/extended)
                const activePrevAlerts = prevAlerts.filter(prev => 
                    prev.expiresAt > now
                );

                // b. Merge logic
                const nextAlerts = [...activePrevAlerts];
                
                currentStepAlerts.forEach(newAlert => {
                    const existingIdx = nextAlerts.findIndex(a => a.id === newAlert.id);
                    if (existingIdx >= 0) {
                        // Extend existing alert
                        nextAlerts[existingIdx].expiresAt = newAlert.expiresAt;
                        // Update severity if it worsened
                        if (newAlert.severity === 'CRITICAL') {
                            nextAlerts[existingIdx].severity = 'CRITICAL';
                            nextAlerts[existingIdx].message = newAlert.message;
                        }
                    } else {
                        // Add new alert
                        nextAlerts.push(newAlert);
                    }
                });
                
                return nextAlerts;
            });
        }

        // Advance step, loop if needed
        stepIndex = (stepIndex + 1) % timeline.length;
    }, 2000); // 2 seconds per simulation step for better demo pacing

    setLoading(false);

    return () => clearInterval(replayInterval);
  }, []);


  // Derived state for current selection. Fallback to J001 if null.
  const selectedId = selectedJunctionId || pilotJunctions[0]?.id;
  const selectedJunction = junctions.find(j => j.id === selectedId) || pilotJunctions[0];
  const activeOverride = overrides ? overrides[selectedId] : null;

  // Sync Visualizer with Dashboard Status
  // If junction is Critical -> High Counts; Optimal -> Low Counts
  const [derivedCounts, setDerivedCounts] = useState(null);
  
  useEffect(() => {
      if (!selectedJunction) return;
      
      const isCritical = selectedJunction.status === 'critical';
      const isWarning = selectedJunction.status === 'warning';
      
      // Base numbers on status to ensure consistency
      const baseCars = isCritical ? 45 : (isWarning ? 25 : 8);
      
      setDerivedCounts({
          cars: baseCars + Math.floor(Math.random() * 5),
          buses: isCritical ? 3 : (Math.random() > 0.7 ? 1 : 0),
          bikes: isCritical ? 20 : (isWarning ? 12 : 5),
          trucks: isCritical ? 2 : 0
      });
  }, [selectedJunction, selectedId]);

  return (
    <div className="dashboard-container">
      {/* Simulation Banner */}
      <div className="simulation-banner" style={{
        background: '#374151', 
        color: '#F9FAFB', 
        textAlign: 'center', 
        padding: '8px', 
        marginBottom: '16px',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '600',
        border: '1px solid #4B5563'
      }}>
        ℹ️ Simulated Live Data (Based on Offline-Validated Models)
      </div>

      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Vadodara Pilot Zone Dashboard</h2>
          <p className="dashboard-subtitle">Monitoring {pilotJunctions.length} High-Traffic Junctions</p>
        </div>
        <div className={`dashboard-status ${error ? 'status-offline' : 'status-live'}`}>
          {loading ? 'Loading Simulation...' : '● Simulation Active'}
        </div>
      </div>

      <section className="dashboard-section">
        <KpiCards
          junctions={junctions}
          loading={loading}
          avgWaitTime={systemMetrics.avgWaitTime}
          spillbackCount={systemMetrics.activeSpillbacks}
        />
      </section>

      {/* TOP ROW: Map & Green Corridor Control */}
      <section className="dashboard-section map-control-row">
        <div className="map-column">
          <CityMap
            junctions={junctions}
            loading={loading}
            onJunctionSelect={handleJunctionSelect}
            selectedId={selectedId}
            activeGreenCorridorState={greenCorridorState}
            onGreenCorridorUpdate={setGreenCorridorState}
          />
        </div>
        <div className="control-column">
          <GreenCorridorPanel 
            state={greenCorridorState} 
            onUpdate={setGreenCorridorState} 
          />
        </div>
      </section>

      {/* BOTTOM ROW: Monitoring Panels (3 Columns) */}
      <section className="dashboard-section monitoring-row">
        <LiveCameraPanel
          junction={selectedJunction}
          override={activeOverride}
        />
        
        <SignalPhaseVisualizer
          junctionName={selectedJunction?.name || "Loading..."}
          active={true}
          loading={loading}
          compact={true}
          override={activeOverride}
          status={selectedJunction?.status}
          externalCounts={derivedCounts}
        />

        <AlertsPanel
          alerts={alerts}
          loading={loading}
          error={error}
          onAlertClick={handleAlertClick}
        />
      </section>
    </div>
  );
};

export default Dashboard;
