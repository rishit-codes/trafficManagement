import React, { useEffect, useState } from 'react';
import { getJunctions, getAnomalies, getTrafficHistory, getPerformanceMetrics } from '../../services/api';
import { checkSpillback } from '../../services/spillbackService';
import { pilotJunctions } from '../../data/pilotJunctions';
import KpiCards from './KpiCards';
import CityMap from './CityMap';
import AlertsPanel from './AlertsPanel';
import TrafficTrend from './TrafficTrend';
import LiveCameraPanel from './LiveCameraPanel';
import GreenCorridorPanel from '../control/GreenCorridorPanel';
import SignalPhaseVisualizer from './SignalPhaseVisualizer';
import './Dashboard.css';

import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [junctions, setJunctions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [selectedJunctionId, setSelectedJunctionId] = useState(null); // Track selected junction
  const [systemMetrics, setSystemMetrics] = useState({
    avgWaitTime: 0,
    activeSpillbacks: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pilot State must be lifted here to coordinate Map and Panel
  const [greenCorridorState, setGreenCorridorState] = useState({
    active: false,
    corridorId: null,
    currentJunctionIndex: -1,
    startedAt: null,
    expectedEndAt: null
  });

  // Fetch trend for a specific junction
  const fetchTrend = async (junctionId) => {
    try {
      if (!junctionId) return;

      // Attempt to fetch real history
      const history = await getTrafficHistory(junctionId);

      // Check if we have valid data
      if (Array.isArray(history?.data) && history.data.length > 0) {
        setTrendData(history.data);
      } else if (Array.isArray(history) && history.length > 0) {
        setTrendData(history);
      } else {
        // DEMO MODE: If no history exists, generate mock trend data for visualization
        // This ensures the chart is never blank during the presentation
        const mockData = [];
        const now = new Date();
        for (let i = 24; i >= 0; i--) {
          const time = new Date(now.getTime() - i * 3600000); // Past 24 hours
          // Simulate peak hours (9am-11am, 5pm-8pm)
          const hour = time.getHours();
          const isPeak = (hour >= 9 && hour <= 11) || (hour >= 17 && hour <= 20);
          const baseVolume = isPeak ? 800 : 300;
          const randomVar = Math.floor(Math.random() * 200);

          mockData.push({
            time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            volume: baseVolume + randomVar
          });
        }
        setTrendData(mockData);
      }
    } catch (err) {
      console.error(`Failed to fetch trend for ${junctionId}:`, err);
    }
  };

  // Handler for Alert Clicks - Navigates to Detail Page
  const handleAlertClick = (alert) => {
    const target = alert.sourceJunction || pilotJunctions.find(j => j.id === alert.junctionId);
    if (target) {
      navigate(`/junction/${target.id}`);
    }
  };

  // Handler for Map Selection
  const handleJunctionSelect = (junction) => {
    setSelectedJunctionId(junction.id);
    fetchTrend(junction.id);
  };

  useEffect(() => {
    let intervalId;

    const fetchDashboardData = async () => {
      if (!pilotJunctions || pilotJunctions.length === 0) return;

      try {
        // Create a copy of junctions to update their status
        const updatedJunctions = [...pilotJunctions];
        const currentAlerts = [];
        let spillbackCount = 0;
        let totalWaitTime = 0;
        let waitTimeSampleCount = 0;

        // 1. Fetch Spillback Risks & Update Map Status
        const spillbackPromises = updatedJunctions.map(async (junction, index) => {
          try {
            // Fetch Performance Metrics for Wait Time
            try {
              const perf = await getPerformanceMetrics(junction.id, 1); // 1 day lookback
              if (perf && perf.avg_waiting_time) {
                totalWaitTime += perf.avg_waiting_time;
                waitTimeSampleCount++;
              }
            } catch (e) {
              // console.warn(`Perf check failed for ${junction.id}`, e);
            }

            // PILOT SIMULATION / DEMO MODE
            // Randomly trigger congestion on 'Alkapuri' (index 1) occasionally for alert demo
            let demoQueueLength = 12; // Baseline safe

            // 30% chance of high traffic on Alkapuri to show alerts
            if (junction.id === 'alkapuri' && Math.random() > 0.7) {
              demoQueueLength = 85;
            }

            const payload = {
              queue_length: demoQueueLength,
              approach: 'NORTH',
              storage_capacity: 100
            };

            const result = await checkSpillback(junction.id, payload);

            let mapStatus = 'optimal';
            if (result.status === 'CRITICAL' || result.status === 'SPILLBACK') {
              mapStatus = 'critical';
              spillbackCount++;
            }
            else if (result.status === 'WARNING') mapStatus = 'warning';

            updatedJunctions[index] = { ...junction, status: mapStatus };

            if (mapStatus !== 'optimal') {
              currentAlerts.push({
                id: `spill-${junction.id}-${Date.now()}`, // Unique ID
                junctionId: junction.id,
                junction: junction.name,
                sourceJunction: junction,
                severity: mapStatus.toUpperCase(),
                message: result.message || `High congestion detected`,
                timestamp: result.timestamp
              });
            }
          } catch (e) {
            console.warn(`Spillback check failed for ${junction.id}`, e);
          }
        });

        await Promise.all(spillbackPromises);

        // Calculate System Stats or use Mock Defaults if empty
        const avgSystemWait = waitTimeSampleCount > 0 ? (totalWaitTime / waitTimeSampleCount) : 42;

        setSystemMetrics({
          avgWaitTime: Math.round(avgSystemWait),
          activeSpillbacks: spillbackCount
        });

        // 2. Fetch Other Anomalies
        try {
          const legacyAnomalies = await getAnomalies('all');
          if (Array.isArray(legacyAnomalies)) {
            currentAlerts.push(...legacyAnomalies);
          }
        } catch (e) { }

        setJunctions(updatedJunctions);
        setAlerts(currentAlerts);

        // Refresh trend for selected junction
        const targetId = selectedJunctionId || pilotJunctions[0].id;
        if (!selectedJunctionId && !trendData) {
          fetchTrend(targetId);
        }

      } catch (err) {
        console.error("Dashboard data update failed", err);
      }
    };

    const initData = async () => {
      try {
        setLoading(true);
        await fetchDashboardData();
        intervalId = setInterval(fetchDashboardData, 5000);
      } catch (err) {
        console.error("Dashboard init error:", err);
        setError("System disconnected");
      } finally {
        setLoading(false);
      }
    };

    initData();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedJunctionId]); // Re-run if selection changes? Actually fetchTrend handles data.

  return (
    <div className="dashboard-container">
      {/* 1. Page Header */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Vadodara Pilot Zone Dashboard</h2>
          <p className="dashboard-subtitle">Monitoring {pilotJunctions.length} High-Traffic Junctions</p>
        </div>
        <div className={`dashboard-status ${error ? 'status-offline' : 'status-live'}`}>
          {loading ? 'Connecting...' : error ? error : '● Pilot System Active'}
        </div>
      </div>

      {/* 2. KPI Section */}
      <section className="dashboard-section">
        <KpiCards
          junctions={junctions}
          loading={loading}
          avgWaitTime={systemMetrics.avgWaitTime}
          spillbackCount={systemMetrics.activeSpillbacks}
        />
      </section>

      {/* 3. Map & Alerts Section */}
      <section className="dashboard-section map-alerts-row">
        <div className="dashboard-column map-column">
          <CityMap
            junctions={junctions}
            loading={loading}
            onJunctionSelect={handleJunctionSelect}
            selectedId={selectedJunctionId}
            activeGreenCorridorState={greenCorridorState}
          />
        </div>

        {/* Right Column: Visualizer, Controller, Alerts */}
        <div className="dashboard-column right-column">
          {/* New Signal Visualizer */}
          <SignalPhaseVisualizer
            junctionName={junctions.find(j => j.id === selectedJunctionId)?.name || "Select Junction"}
            active={true}
            loading={loading}
          />

          <GreenCorridorPanel
            state={greenCorridorState}
            onUpdate={setGreenCorridorState}
          />
          <AlertsPanel
            alerts={alerts}
            loading={loading}
            error={error}
            onAlertClick={handleAlertClick}
          />
        </div>
      </section>

      {/* 4. Trends Section */}
      <section className="dashboard-section">
        <TrafficTrend
          data={trendData}
          loading={loading}
          junctionName={junctions.find(j => j.id === selectedJunctionId)?.name}
        />
      </section>
    </div>
  );
};

export default Dashboard;
