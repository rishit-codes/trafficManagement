import React, { useEffect, useState } from 'react';
import { getJunctions, getAnomalies, getTrafficHistory } from '../../services/api';
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

  const fetchAlerts = async (junctionList) => {
    if (!junctionList || junctionList.length === 0) return;
    
    // Simplification for pilot: fetch alerts for J001-J005 if they exist in backend
    try {
      // Loop through pilot junctions to get anomalies
      const simplePromises = junctionList.map(async (j) => {
          try {
              const anomalies = await getAnomalies(j.id);
              if (Array.isArray(anomalies)) {
                  // Inject pilot metadata into alert for clickable navigation
                  return anomalies.map(a => ({ 
                      ...a, 
                      junction: j.name,
                      junctionId: j.id, // Critical for selection
                      sourceJunction: j // Direct reference
                  }));
              }
              return [];
          } catch (e) {
              return [];
          }
      });
      const nestedAlerts = await Promise.all(simplePromises);
      setAlerts(nestedAlerts.flat());
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

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
    // Determine the target junction from the alert
    // Use injected junctionId or fallback to direct name match
    const target = alert.sourceJunction || pilotJunctions.find(j => j.id === alert.junctionId);
    
    if (target) {
       navigate(`/junction/${target.id}`);
    }
  };

  useEffect(() => {
    let intervalId;

    const initData = async () => {
      try {
        setLoading(true);
        
        // PILOT DEPLOYMENT: Single Source of Truth
        setJunctions(pilotJunctions);
        
        // Verify backend connection
        try {
           await getJunctions();
           setError(null);
        } catch (e) {
           setError("Backend connection verification failed");
        }

        fetchAlerts(pilotJunctions);
        intervalId = setInterval(() => fetchAlerts(pilotJunctions), 10000);
        
        fetchTrend(pilotJunctions[0].id);

      } catch (err) {
        console.error("Dashboard fetch error:", err);
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
