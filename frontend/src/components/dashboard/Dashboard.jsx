import React, { useEffect, useState } from 'react';
import { getJunctions, getAnomalies, getTrafficHistory } from '../../services/api';
import KpiCards from './KpiCards';
import CityMap from './CityMap';
import AlertsPanel from './AlertsPanel';
import TrafficTrend from './TrafficTrend';
import './Dashboard.css';

const Dashboard = () => {
  const [junctions, setJunctions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trendData, setTrendData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  
  // Wait, I can't write psuedocode in thought block to verify.
  // I need to be precise.
  // I will split this into two edits.
  // 1. Update state declarations.
  // 2. Add fetchTrend function.
  // 3. Update useEffect.
  
  // Edit 1: State
  // Edit 2: fetchTrend function
  // Edit 3: useEffect calls
  
  // Actually, I can combine if contiguous.
  // State is at top. Helper functions are below. useEffect is below that.
  // They are somewhat contiguous but strictly `fetchAlerts` is big.
  
  // Let's replace state first.
  
  // Wait, I need to see exactly where to insert fetchTrend.
  // Using `replace_file_content` on Line 9.
  
  // Let's do state update first.


  const fetchAlerts = async (junctionList) => {
    if (!junctionList || junctionList.length === 0) return;
    
    try {
      const alertPromises = junctionList.map(j => getAnomalies(j.id)
        .then(res => ({ junction: j.name, ...res }))
        .catch(() => null) // Ignore errors for individual junctions
      );
      
      const results = await Promise.all(alertPromises);
      
      // Flatten arrays and filter nulls
      // Assuming getAnomalies returns an array of anomalies or a single object. 
      // The requirement example shows an array: [{ ... }]
      // But if it returns a single object, we need to handle that.
      // Let's safe handle both.
      
      const allAlerts = [];
      results.forEach(res => {
         if (!res) return;
         // If response is array (it should be per goal description)
         if (Array.isArray(res)) {
            allAlerts.push(...res);
         } else if (res.junction_id) {
             // It's a single anomaly object
             allAlerts.push(res);
         } else if (res.junction) {
            // It's the object we just created wrapping the response
             if (Array.isArray(res.data)) { // if axios data is nested
                 res.data.forEach(a => allAlerts.push({...a, junction: res.junction}));
             } else {
                 // Try to guess structure or just push if it looks like an alert
                 // Actually, getAnomalies returns response.data which IS the array/object.
                 // So 'res' here IS the data + our manually added 'junction' name? No.
                 // Wait, the map above: .then(res => ({ junction: j.name, ...res }))
                 // This spreads the response (which is data) into a new object with junction name.
                 // Use case: API returns [ {message: "foo"} ] -> we want [ {message: "foo", junction: "Name"} ]
                 // This spread approach `{ junction: j.name, ...res }` only works if `res` is an OBJECT.
                 // If `res` is an ARRAY, `...res` will spread indices. We need to handle this carefully.
             }
         }
      });

      // Let's rewrite the fetch logic to be more robust for Arrays
      const simplePromises = junctionList.map(async (j) => {
          try {
              const anomalies = await getAnomalies(j.id);
              if (Array.isArray(anomalies)) {
                  return anomalies.map(a => ({ ...a, junction: j.name }));
              } else if (anomalies && typeof anomalies === 'object') {
                  return [{ ...anomalies, junction: j.name }];
              }
              return [];
          } catch (e) {
              // 422 means no anomalies or invalid request for this ID, just return empty
              if (e.response && e.response.status === 422) return [];
              return [];
          }
      });

      const nestedAlerts = await Promise.all(simplePromises);
      const flatAlerts = nestedAlerts.flat();
      
      // Sort by severity (high > medium > low) and time (newest first)
      const severityWeight = { 'high': 3, 'medium': 2, 'low': 1, 'critical': 3, 'warning': 2, 'info': 1 };
      
      flatAlerts.sort((a, b) => {
          const wA = severityWeight[a.severity?.toLowerCase()] || 0;
          const wB = severityWeight[b.severity?.toLowerCase()] || 0;
          if (wA !== wB) return wB - wA; // Higher severity first
          return new Date(b.timestamp) - new Date(a.timestamp); // Newer first
      });

      setAlerts(flatAlerts);

    } catch (err) {
      console.error("Failed to fetch alerts", err);
      // Keep displaying old alerts or empty if failed
    }
  };

  const fetchTrend = async (junctionId) => {
    try {
      const history = await getTrafficHistory(junctionId);
      if (Array.isArray(history)) {
        setTrendData(history);
      }
    } catch (err) {
      console.error("Failed to fetch trend:", err);
    }
  };

  useEffect(() => {
    let intervalId;
    let trendIntervalId;

    const initData = async () => {
      try {
        setLoading(true);
        const data = await getJunctions();
        let validJunctions = [];
        
        if (Array.isArray(data)) {
          setJunctions(data);
          validJunctions = data;
        } else if (data && typeof data === 'object') {
           // Handle wrapped response
           if (Array.isArray(data.data)) {
               setJunctions(data.data);
               validJunctions = data.data;
           } else if (Array.isArray(data.junctions)) {
               setJunctions(data.junctions);
               validJunctions = data.junctions;
           } else {
               console.warn("API returned non-array data and no known wrapper found:", data);
               setJunctions([]);
           }
        } else {
          console.warn("API returned invalid data type:", data);
          setJunctions([]);
        }
        setError(null);

        // Fetch alerts immediately after junctions
        if (validJunctions.length > 0) {
            fetchAlerts(validJunctions);
            // Poll alerts every 10 seconds
            intervalId = setInterval(() => fetchAlerts(validJunctions), 10000);

            // Fetch trend for the first junction (or a critical one)
            // Ideally pick one that is interesting. For now, first one.
            const targetJunction = validJunctions[0];
            fetchTrend(targetJunction.id);
            trendIntervalId = setInterval(() => fetchTrend(targetJunction.id), 30000);
        }

      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("System disconnected");
        setJunctions([]);
      } finally {
        setLoading(false);
      }
    };

    initData();

    return () => {
        if (intervalId) clearInterval(intervalId);
        if (trendIntervalId) clearInterval(trendIntervalId);
    };
  }, []);

  return (
    <div className="dashboard-container">
      {/* 1. Page Header */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">City Command Center</h2>
          <p className="dashboard-subtitle">Real-time traffic monitoring and situational awareness</p>
        </div>
        <div className={`dashboard-status ${error ? 'status-offline' : 'status-live'}`}>
          {loading ? 'Connecting...' : error ? error : '● Live system active'}
        </div>
      </div>

      {/* 2. KPI Section */}
      <section className="dashboard-section">
        <KpiCards junctions={junctions} loading={loading} />
      </section>

      {/* 3. Map & Alerts Section */}
      <section className="dashboard-section map-alerts-row">
        <div className="dashboard-column map-column">
          <CityMap junctions={junctions} loading={loading} />
        </div>
        <div className="dashboard-column alerts-column">
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
