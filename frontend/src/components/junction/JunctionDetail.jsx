import React, { useState, useEffect } from 'react';
import GeometryPanel from './GeometryPanel';
import TrafficMetrics from './TrafficMetrics';
import SpillbackPanel from './SpillbackPanel';
import OptimizationPanel from './OptimizationPanel';
import SignalVisualization from './SignalVisualization';
import { getJunctionById, getJunctionState } from '../../services/api';
import { pilotJunctions } from '../../data/pilotJunctions';
import './JunctionDetail.css';

const JunctionDetail = () => {
  // Use pilotJunctions as the definitive list
  const [selectedId, setSelectedId] = useState(pilotJunctions[0]?.id);
  const [junctionData, setJunctionData] = useState(null);
  const [junctionState, setJunctionState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Helper to get static info from pilot file
  const selectedPilotJunction = pilotJunctions.find(j => j.id === selectedId) || pilotJunctions[0];

  // 1. Fetch Details when selection changes
  useEffect(() => {
    if (!selectedId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Try to fetch live data
        const [details, state] = await Promise.all([
          getJunctionById(selectedId),
          getJunctionState(selectedId)
        ]);
        
        setJunctionData(details);
        setJunctionState(state);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error(err);
        setJunctionData(null); // Reset live data on error
        setJunctionState(null);
        setError(`Live data unavailable for ${selectedId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    
    // Auto-refresh state every 5 seconds
    const interval = setInterval(fetchDetails, 5000);
    return () => clearInterval(interval);

  }, [selectedId]);

  return (
    <div className="junction-detail-container">
      {/* 1. Junction Header */}
      <div className="junction-header">
        <div className="header-left">
          <div className="junction-selector">
             {/* Always show the pilot list */}
             <select 
                className="junction-select"
                value={selectedId} 
                onChange={(e) => setSelectedId(e.target.value)}
             >
                {pilotJunctions.map(j => (
                    <option key={j.id} value={j.id}>{j.name}</option>
                ))}
             </select>
          </div>
          
          <span className="junction-id">ID: {selectedId}</span>
          
          {/* Status Badge: Active if we have state, else Warning/Offline */}
          <span className={`status-badge status-${junctionState ? 'active' : 'gray'}`}>
             {junctionState ? 'ONLINE' : 'DATA OFFLINE'}
          </span>
        </div>
        
        <div className="header-right">
          <span className="last-updated">
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Waiting for connection...'}
          </span>
        </div>
      </div>

      {/* 2. Content Body */}
      {/* If loading first time and no data yet */}
      {loading && !junctionData && !error && (
          <div className="detail-section loading">Connecting to junction...</div>
      )}

      {/* If error (Data Unavailable) */}
      {(error || (!loading && !junctionData)) ? (
          <div className="detail-section empty-state">
              <p>Live data unavailable for this junction.</p>
              <p className="subtext">The backend controller for {selectedId} may be offline or unreachable.</p>
          </div>
      ) : (
        // Only render panels if we have data
        junctionData && (
            <>
              {/* 2. Live Monitoring Section */}
              <section className="detail-section">
                <h3 className="section-title">Junction Status (Auto-Updated)</h3>
                <div className="monitoring-grid">
                  <GeometryPanel data={junctionData} />
                  <TrafficMetrics state={junctionState} />
                  <SpillbackPanel junctionId={selectedId} />
                </div>
              </section>

              {/* 3. Optimization Section */}
              <section className="detail-section">
                <h3 className="section-title">Signal Optimization & Timing</h3>
                <div className="optimization-grid">
                  <OptimizationPanel junctionId={selectedId} />
                  <SignalVisualization state={junctionState} />
                </div>
              </section>
            </>
        )
      )}
    </div>
  );
};

export default JunctionDetail;
