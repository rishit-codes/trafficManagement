import React from 'react';

const SpillbackPanel = () => {
  return (
    <div className="detail-panel">
      <h4 className="panel-title">Queue & Spillback</h4>
      
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
          <span>South Approach Queue</span>
          <span style={{ color: '#D97706', fontWeight: '600' }}>Risk: High</span>
        </div>
        <div style={{ height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: '85%', height: '100%', background: '#D97706' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', color: '#6B7280' }}>
          <span>125m Length</span>
          <span>150m Storage</span>
        </div>
      </div>

      <div style={{ background: '#FEF2F2', padding: '12px', borderRadius: '6px', borderLeft: '4px solid #DC2626' }}>
        <h5 style={{ fontSize: '13px', fontWeight: '700', color: '#991B1B', marginBottom: '4px' }}>SPILLBACK RISK</h5>
        <p style={{ fontSize: '12px', color: '#7F1D1D' }}>
          Queue length approaching upstream junction (85% occupancy). Downstream throttling recommended.
        </p>
      </div>
    </div>
  );
};

export default SpillbackPanel;
