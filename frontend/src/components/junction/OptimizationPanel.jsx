import React from 'react';

const OptimizationPanel = ({ state }) => {
  if (!state) return null;

  return (
    <div className="detail-panel">
      <h4 className="panel-title">Signal Optimization</h4>
      <div className="optimization-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="metric-row">
          <span className="metric-label">Current Phase</span>
          <span className="status-badge status-active">{state.display_name}</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Cycle Time</span>
          <span className="metric-value">{state.cycle_length}s</span>
        </div>

        <div style={{ background: '#F0F9FF', padding: '10px', borderRadius: '6px', marginTop: '8px' }}>
          <p style={{ fontSize: '11px', color: '#0369A1', marginBottom: '4px' }}><strong>AI Controller Status</strong></p>
          {state.display_name.includes('Green') ? (
            <p style={{ fontSize: '12px', color: '#0C4A6E' }}>
              Holding Green for <strong>{state.active_directions.join('+')}</strong> to clear platoon.
            </p>
          ) : (
            <p style={{ fontSize: '12px', color: '#0C4A6E' }}>
              Analyzing queue length for next phase split adjustment (+5s likely).
            </p>
          )}
        </div>

        {/* Creative Feature: Emergency Vehicle Clearance Est. */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
          <h5 style={{ fontSize: '11px', fontWeight: '700', color: '#DC2626', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>🚑</span> EMERGENCY CLEARANCE
          </h5>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div style={{ background: '#FEF2F2', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#991B1B' }}>FROM N-S</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#B91C1C' }}>
                {state.active_directions.includes('N') ? '0s (OPEN)' : `${state.time_remaining + 5}s`}
              </div>
            </div>
            <div style={{ background: '#FEF2F2', padding: '6px', borderRadius: '4px', textAlign: 'center' }}>
              <div style={{ fontSize: '9px', color: '#991B1B' }}>FROM E-W</div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#B91C1C' }}>
                {state.active_directions.includes('E') ? '0s (OPEN)' : `${state.time_remaining + 5}s`}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '9px', color: '#6B7280', marginTop: '4px', textAlign: 'center' }}>
            *Est. time to clear box for priority vehicle
          </div>
        </div>
      </div>
    </div>
  );
};

export default OptimizationPanel;
