import React, { useEffect, useState } from 'react';
import { getJunctions, getAnomalies, getTrafficHistory } from '../../services/api';
import { checkSpillback } from '../../services/spillbackService';
import { pilotJunctions } from '../../data/pilotJunctions';
import KpiCards from './KpiCards';
import CityMap from './CityMap';
import AlertsPanel from './AlertsPanel';
import TrafficTrend from './TrafficTrend';
import LiveCameraPanel from './LiveCameraPanel';
import './Dashboard.css';

import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [junctions, setJunctions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Note: Local selection state removed in favor of URL-driven navigation to /junction/:id

  const fetchTrend = async (junctionId) => {
    try {
      const history = await getTrafficHistory(junctionId);
      if (Array.isArray(history)) setTrendData(history);
    } catch (err) {
      console.error("Failed to fetch trend:", err);
    }
  };

  // Handler for Alert Clicks - Navigates to Detail Page
  const handleAlertClick = (alert) => {
    const target = alert.sourceJunction || pilotJunctions.find(j => j.id === alert.junctionId);
    if (target) {
       navigate(`/junction/${target.id}`);
    }
  };

  useEffect(() => {
    let intervalId;

    const fetchDashboardData = async () => {
      if (!pilotJunctions || pilotJunctions.length === 0) return;
      
      try {
        // Create a copy of junctions to update their status
        const updatedJunctions = [...pilotJunctions];
        const currentAlerts = [];

        // 1. Fetch Spillback Risks & Update Map Status
        const spillbackPromises = updatedJunctions.map(async (junction, index) => {
            try {
                // PILOT SIMULATION: In a real deployment, we would fetch live sensor data here.
                // For this pilot, we send a baseline 'safe' queue length (12) to verify connectivity 
                // and backend logic without triggering false alarms.
                // To TEST alerts: Manually increase this value or use the backend/docs to trigger.
                const payload = { 
                    queue_length: 12,  // Baseline safe value
                    approach: 'NORTH',
                    storage_capacity: 100 // Default capacity for pilot
                };
                
                const result = await checkSpillback(junction.id, payload);
                
                // Map Backend Status to Frontend UI Status
                // Backend: NORMAL, WARNING, CRITICAL, SPILLBACK
                // Frontend Map: optimal, warning, critical
                let mapStatus = 'optimal';
                if (result.status === 'CRITICAL' || result.status === 'SPILLBACK') mapStatus = 'critical';
                else if (result.status === 'WARNING') mapStatus = 'warning';
                
                // Update the junction object for the map
                updatedJunctions[index] = { ...junction, status: mapStatus };

                // If risk detected, add to alerts
                if (mapStatus !== 'optimal') {
                    currentAlerts.push({
                        id: `spill-${junction.id}`, // Deduplicate by ID
                        junctionId: junction.id,
                        junction: junction.name,
                        sourceJunction: junction,
                        severity: mapStatus.toUpperCase(),
                        message: result.message || `High congestion detected on ${result.affected_approach || 'approach'}`,
                        timestamp: result.timestamp
                    });
                }
            } catch (e) {
                console.warn(`Spillback check failed for ${junction.id}`, e);
                // Keep default status
            }
        });

        await Promise.all(spillbackPromises);

        // 2. Fetch Other Anomalies (Legacy/Other Systems)
        // Merging with existing pattern if needed, but prioritizing Spillback for this task
        try {
           const legacyAnomalies = await getAnomalies('all'); // specific API call if exists
           if (Array.isArray(legacyAnomalies)) {
               currentAlerts.push(...legacyAnomalies);
           }
        } catch (e) { 
           // Ignore legacy errors
        }

        setJunctions(updatedJunctions);
        setAlerts(currentAlerts);

      } catch (err) {
        console.error("Dashboard data update failed", err);
      }
    };

    const initData = async () => {
      try {
        setLoading(true);
        
        // Initial Fetch
        await fetchDashboardData();
        
        // Start Polling
        intervalId = setInterval(fetchDashboardData, 5000); // 5s poll as requested
        
        fetchTrend(pilotJunctions[0].id);

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
  }, []);

  return (
    <div className="dashboard-container">
      {/* 1. Page Header */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Vadodara Pilot Zone Dashboard</h2>
          <p className="dashboard-subtitle">Monitoring 5 High-Traffic Junctions</p>
        </div>
        <div className={`dashboard-status ${error ? 'status-offline' : 'status-live'}`}>
          {loading ? 'Connecting...' : error ? error : '● Pilot System Active'}
        </div>
      </div>

      {/* 2. KPI Section */}
      <section className="dashboard-section">
        <KpiCards junctions={junctions} loading={loading} />
      </section>

      {/* 3. Map & Alerts Section (Camera moved to Detail view) */}
      <section className="dashboard-section map-alerts-row">
        <div className="dashboard-column map-column">
          <CityMap 
             junctions={junctions} 
             loading={loading} 
             onJunctionSelect={(j) => navigate(`/junction/${j.id}`)}
             selectedId={null} 
          />
        </div>
        
        {/* Right Column: Alerts Only */}
        <div className="dashboard-column right-column">
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
        <TrafficTrend data={trendData} loading={loading} />
      </section>
    </div>
  );
};

export default Dashboard;
