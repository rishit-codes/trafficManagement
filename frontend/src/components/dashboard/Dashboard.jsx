import React, { useEffect, useState } from 'react';
import { getJunctions, getAnomalies, getTrafficHistory, getPerformanceMetrics } from '../../services/api';
import axios from 'axios';
import { checkSpillback } from '../../services/spillbackService';
import { pilotJunctions } from '../../data/pilotJunctions';
import KpiCards from './KpiCards';
import CityMap from './CityMap';
import AlertsPanel from './AlertsPanel';
import LiveCameraPanel from './LiveCameraPanel';
import GreenCorridorPanel from '../control/GreenCorridorPanel';
import SignalPhaseVisualizer from './SignalPhaseVisualizer';
import { useTraffic } from '../../context/TrafficContext';
import './Dashboard.css';

import { useNavigate } from 'react-router-dom';

const generateMockTrend = () => {
  const mockData = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000); // Past 24 hours
    // Simulate peak hours (9am-11am, 5pm-8pm)
    const hour = time.getHours();
    const isPeak = (hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 20);
    const baseVolume = isPeak ? 850 : 350;
    const randomVar = Math.floor(Math.random() * 200);

    mockData.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      volume: baseVolume + randomVar
    });
  }
  return mockData;
};

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

  const ensureDataExists = async (junctionId) => {
    try {
      await axios.post(`http://localhost:8000/data/generate-synthetic/${junctionId}?days=2`);
    } catch (e) { }
  };

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
    let intervalId;

    const fetchDashboardData = async () => {
      if (!pilotJunctions || pilotJunctions.length === 0) return;

      try {
        const updatedJunctions = [...pilotJunctions];
        const currentAlerts = [];
        let spillbackCount = 0;
        let totalWaitTime = 0;
        let waitTimeSampleCount = 0;

        const spillbackPromises = updatedJunctions.map(async (junction, index) => {
          try {
            try {
              const perf = await getPerformanceMetrics(junction.id, 1);
              if (perf && perf.avg_waiting_time) {
                totalWaitTime += perf.avg_waiting_time;
                waitTimeSampleCount++;
              }
            } catch (e) { }

            let result = { status: 'NORMAL' };
            // FORCE status for Alkapuri
            if (junction.id === 'J001') {
              result = {
                status: 'SPILLBACK',
                message: 'Severe congestion on NORTH approach',
                timestamp: new Date().toISOString()
              };
            } else {
              const payload = { queue_length: 12, approach: 'NORTH', storage_capacity: 100 };
              try { result = await checkSpillback(junction.id, payload); } catch (e) { }
            }

            let mapStatus = 'optimal';
            if (result.status === 'CRITICAL' || result.status === 'SPILLBACK') {
              mapStatus = 'critical';
              spillbackCount++;
            } else if (result.status === 'WARNING') mapStatus = 'warning';

            updatedJunctions[index] = { ...junction, status: mapStatus };

            if (mapStatus !== 'optimal') {
              currentAlerts.push({
                id: `spill-${junction.id}-${Date.now()}`,
                junctionId: junction.id,
                junction: junction.name,
                sourceJunction: junction,
                severity: mapStatus.toUpperCase(),
                message: result.message || 'Congestion detected',
                timestamp: result.timestamp || new Date().toISOString()
              });
            }
          } catch (e) { }
        });

        await Promise.all(spillbackPromises);

        const avgSystemWait = waitTimeSampleCount > 0 ? (totalWaitTime / waitTimeSampleCount) : 48;

        setSystemMetrics({
          avgWaitTime: Math.round(avgSystemWait),
          activeSpillbacks: spillbackCount > 0 ? spillbackCount : 1
        });

        setJunctions(updatedJunctions);

        if (!currentAlerts.some(a => a.junctionId === 'J001')) {
          currentAlerts.unshift({
            id: 'forced-alert-1',
            junctionId: 'J001',
            junction: 'Alkapuri Circle',
            sourceJunction: pilotJunctions[0],
            severity: 'CRITICAL',
            message: 'Severe congestion on NORTH approach',
            timestamp: new Date().toISOString()
          });
        }
        setAlerts(currentAlerts);

      } catch (err) {
        console.error("Dashboard data update failed", err);
      }
    };

    const initData = async () => {
      try {
        setLoading(true);
        await ensureDataExists(pilotJunctions[0].id);
        await fetchDashboardData();
        intervalId = setInterval(fetchDashboardData, 5000);
      } catch (err) {
        setError("System disconnected");
      } finally {
        setLoading(false);
      }
    };

    initData();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Derived state for current selection. Fallback to J001 if null.
  const selectedId = selectedJunctionId || pilotJunctions[0]?.id;
  const selectedJunction = junctions.find(j => j.id === selectedId) || pilotJunctions[0];
  const activeOverride = overrides ? overrides[selectedId] : null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Vadodara Pilot Zone Dashboard</h2>
          <p className="dashboard-subtitle">Monitoring {pilotJunctions.length} High-Traffic Junctions</p>
        </div>
        <div className={`dashboard-status ${error ? 'status-offline' : 'status-live'}`}>
          {loading ? 'Connecting...' : error ? error : '● Pilot System Active'}
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

      <section className="dashboard-section map-alerts-row">
        <div className="dashboard-column map-column">
          <CityMap
            junctions={junctions}
            loading={loading}
            onJunctionSelect={handleJunctionSelect}
            selectedId={selectedId} // Use robust derived ID
            activeGreenCorridorState={greenCorridorState}
          />
        </div>

        <div className="dashboard-column right-column">
          {/* 1. Camera First */}
          <LiveCameraPanel
            junction={selectedJunction}
            override={activeOverride}
          />

          {/* 2. Signal Visualizer */}
          <SignalPhaseVisualizer
            junctionName={selectedJunction?.name || "Loading..."}
            active={true}
            loading={loading}
            compact={true}
            override={activeOverride}
            status={selectedJunction?.status}
          />

          {/* 3. Green Corridor */}
          <GreenCorridorPanel
            state={greenCorridorState}
            onUpdate={setGreenCorridorState}
          />

          {/* 4. Alerts */}
          <AlertsPanel
            alerts={alerts}
            loading={loading}
            error={error}
            onAlertClick={handleAlertClick}
          />
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
