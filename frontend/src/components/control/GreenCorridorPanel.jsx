import React, { useEffect, useState } from 'react';
import { GREEN_CORRIDORS } from '../../config/greenCorridors';
import { getOptimizationPreview } from '../../services/optimizerService';
import { checkSpillback } from '../../services/spillbackService';
import './GreenCorridorPanel.css';

const GreenCorridorPanel = ({ state, onUpdate }) => {
  // Local state for advisory data (preview only)
  const [advisory, setAdvisory] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch Advisory Data when Junction Changes
  useEffect(() => {
    if (!state.active || !state.corridorId || state.currentJunctionIndex < 0) return;

    const activeCorridor = GREEN_CORRIDORS.find(c => c.id === state.corridorId);
    if (!activeCorridor) return;

    const junctionId = activeCorridor.junctions[state.currentJunctionIndex];
    if (!junctionId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      setAdvisory(null);
      setRisk(null);

      try {
        // Parallel Fetch for Advisory & Safety
        // Using pilot defaults for payload as we don't have live sensors in this panel
        const [optData, spillData] = await Promise.all([
          getOptimizationPreview(junctionId, {
            current_green: 30, // Default assumption
            queue_length: 15   // Moderate traffic assumption
          }),
          checkSpillback(junctionId, {
            queue_length: 12,
            approach: "NORTH", // Default
            storage_capacity: 100
          })
        ]);

        setAdvisory(optData);
        setRisk(spillData);
      } catch (err) {
        console.error("Advisory fetch error:", err);
        setError("Advisory data unavailable");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [state.active, state.corridorId, state.currentJunctionIndex]);


  const handleActivate = (corridorId) => {
    onUpdate({
      active: true,
      corridorId: corridorId,
      currentJunctionIndex: 0,
      startedAt: new Date(),
      expectedEndAt: null
    });
  };

  const handleDeactivate = () => {
    onUpdate({
      active: false,
      corridorId: null,
      currentJunctionIndex: -1,
      startedAt: null,
      expectedEndAt: null
    });
  };

  const handleNext = () => {
    onUpdate({
      ...state,
      currentJunctionIndex: state.currentJunctionIndex + 1
    });
  };

  const handlePrev = () => {
    onUpdate({
      ...state,
      currentJunctionIndex: state.currentJunctionIndex - 1
    });
  };

  // -- Render Inactive State --
  if (!state.active) {
    return (
      <div className="dashboard-card green-corridor-panel">
        <h3 className="panel-title">Green Corridor Controls</h3>
        <p className="panel-subtitle">Select a corridor to activate pilot mode</p>

        <div className="corridor-list">
          {GREEN_CORRIDORS.map(corridor => (
            <div key={corridor.id} className={`corridor-item ${!corridor.allowed ? 'disabled' : ''}`}>
              <div className="corridor-info">
                <strong>{corridor.name}</strong>
                <span className="corridor-desc">{corridor.description}</span>
                <div className="corridor-meta">
                  <span>{corridor.junctions.length} Junctions</span>
                  <span>{corridor.direction}</span>
                </div>
              </div>
              <button
                className="btn-activate"
                disabled={!corridor.allowed}
                onClick={() => handleActivate(corridor.id)}
              >
                ACTIVATE
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -- Render Active State --
  const activeCorridor = GREEN_CORRIDORS.find(c => c.id === state.corridorId);
  if (!activeCorridor) return null;

  const isFirst = state.currentJunctionIndex === 0;
  const isLast = state.currentJunctionIndex === activeCorridor.junctions.length - 1;
  const currentJunctionId = activeCorridor.junctions[state.currentJunctionIndex];

  return (
    <div className="dashboard-card green-corridor-panel active-mode">
      <div className="panel-header-active">
        <div>
          <h3 className="panel-title-active">ACTIVE GREEN CORRIDOR</h3>
          <div className="panel-corridor-name">{activeCorridor.name}</div>
        </div>
        <button className="btn-terminate" onClick={handleDeactivate}>
          User Terminate
        </button>
      </div>

      <div className="control-status-box">
        <div className="status-label">CURRENT PRIORITY JUNCTION</div>
        <div className="status-value">{currentJunctionId}</div>
        <div className="status-helper">
          {state.currentJunctionIndex + 1} of {activeCorridor.junctions.length}
        </div>
      </div>

      <div className="control-actions">
        <button
          className="btn-control"
          disabled={isFirst}
          onClick={handlePrev}
        >
          ← Previous Junction
        </button>
        <button
          className="btn-control btn-primary"
          disabled={isLast}
          onClick={handleNext}
        >
          Next Junction →
        </button>
      </div>

      <div className="control-warning">
        <span className="warning-icon">⚠</span>
        Operator-controlled progression. No automatic signal changes.
      </div>

      <div className="simulation-controls">
        <div className="sim-header">Test Multi-Modal Logic</div>
        <div className="sim-buttons">
          <button className="btn-sim bus" onClick={() => fetch('http://localhost:8000/api/multimodal/simulate-detection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ vehicles: { bus: 1 } })
          })}>
            🚌 Sim Bus
          </button>
          <button className="btn-sim crowd" onClick={() => fetch('http://localhost:8000/api/multimodal/simulate-detection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pedestrians: { count: 15 } })
          })}>
            🚶 Sim Crowd
          </button>
        </div>
      </div>

      {/* Priority Impact Preview (Advisory) */}
      <div className="advisory-panel">
        <div className="advisory-header">Priority Impact Preview (Advisory)</div>

        {loading ? (
          <div className="advisory-loading">Fetching advisory data...</div>
        ) : error ? (
          <div className="advisory-error">{error}</div>
        ) : advisory ? (
          <>
            {/* Safety Check */}
            {risk && (risk.status === 'CRITICAL' || risk.status === 'SPILLBACK') && (
              <div className="advisory-alert-box">
                <strong>Priority not recommended</strong> — spillback risk detected
              </div>
            )}

            <div className="advisory-grid">
              <div className="advisory-item">
                <label>Current Cycle</label>
                <span>{advisory.current_cycle || 120}s</span>
              </div>
              <div className="advisory-item">
                <label>Recommended</label>
                <span>{advisory.optimized_cycle || 130}s</span>
              </div>
              <div className="advisory-item highlight">
                <label>Green Ext.</label>
                <span>+{advisory.green_split_adjustment || 10}s</span>
              </div>
              <div className="advisory-item success">
                <label>Delay Redux</label>
                <span>{advisory.estimated_delay_reduction || '15%'}</span>
              </div>
            </div>
          </>
        ) : null}

        <div className="advisory-disclaimer">
          Preview only. Signal timings are NOT applied. Operator must coordinate with field controllers.
        </div>
      </div>
    </div>
  );
};

export default GreenCorridorPanel;
