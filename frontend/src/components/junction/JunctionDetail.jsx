import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GeometryPanel from './GeometryPanel';
import TrafficMetrics from './TrafficMetrics';
import SpillbackPanel from './SpillbackPanel';
import OptimizationPanel from './OptimizationPanel';
import TrafficSignal4Way from './TrafficSignal4Way';
import LiveCameraPanel from '../dashboard/LiveCameraPanel';
import { getJunctionById, getJunctionState } from '../../services/api';
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

  // 1. Fetch Junction Details (every 5 seconds)
  useEffect(() => {
    if (!selectedId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const details = await getJunctionById(selectedId);
        setJunctionData(details);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error('Junction details error:', err);
        setJunctionData(null);
        setError(`Live data unavailable for ${selectedId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
    const interval = setInterval(fetchDetails, 5000);
    return () => clearInterval(interval);
  }, [selectedId]);

  // 2. Fetch Signal State (every 1 second for real-time countdown)
  useEffect(() => {
    if (!selectedId) return;

    const fetchSignalState = async () => {
      try {
        const state = await getJunctionState(selectedId);
        setSignalState(state);
        setSignalError(null);
        setSignalLoading(false);
      } catch (err) {
        console.error('Signal state error:', err);
        setSignalState(null);
        setSignalError('Signal data unavailable');
        setSignalLoading(false);
      }
    };

    fetchSignalState();
    const interval = setInterval(fetchSignalState, 1000); // 1-second polling
    return () => clearInterval(interval);
  }, [selectedId]);

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
        <h3 className="section-title">Live Signal Status</h3>
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
          
          {/* CENTER: Compact Video Feed (Static mapping, always works) */}
          <div className="compact-video-wrapper">
            <LiveCameraPanel junction={selectedPilotJunction} />
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
              <TrafficMetrics state={signalState} />
              <SpillbackPanel junctionId={selectedId} />
              <OptimizationPanel junctionId={selectedId} />
            </div>
          </section>
        )
      )}
    </div>
  );
};

export default JunctionDetail;

