import React, { useEffect, useState } from 'react';
import { getJunctions, getAnomalies, getTrafficHistory } from '../../services/api';
import { pilotJunctions } from '../../data/pilotJunctions';
import KpiCards from './KpiCards';
import CityMap from './CityMap';
import AlertsPanel from './AlertsPanel';
import TrafficTrend from './TrafficTrend';
import LiveCameraPanel from './LiveCameraPanel';
import './Dashboard.css';

const Dashboard = () => {
  const [junctions, setJunctions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Interactive State
  const [selectedJunction, setSelectedJunction] = useState(null);

  const fetchAlerts = async (junctionList) => {
    if (!junctionList || junctionList.length === 0) return;
    
    // Simplification for pilot: fetch alerts for J001-J005 if they exist in backend
    try {
      // Logic same as before...
      const simplePromises = junctionList.map(async (j) => {
          try {
              const anomalies = await getAnomalies(j.id);
              if (Array.isArray(anomalies)) {
                  return anomalies.map(a => ({ ...a, junction: j.name }));
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

      {/* 3. Map & Camera & Alerts Section */}
      <section className="dashboard-section map-alerts-row">
        <div className="dashboard-column map-column">
          <CityMap 
             junctions={junctions} 
             loading={loading} 
             onJunctionSelect={setSelectedJunction}
             selectedId={selectedJunction?.id}
          />
        </div>
        
        {/* Right Column: Camera + Alerts */}
        <div className="dashboard-column right-column">
          <LiveCameraPanel junction={selectedJunction} />
          <AlertsPanel alerts={alerts} loading={loading} error={error} />
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
