import React from 'react';

const SpillbackPanel = ({ junctionData }) => {
  if (!junctionData) return null;
  const nStor = junctionData.approaches?.north?.storage_length_m || 0;
  const eStor = junctionData.approaches?.east?.storage_length_m || 0;

  return (
    <div className="detail-panel">
      <h4 className="panel-title">Queue Limits</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="metric-row">
          <span className="metric-label">Storage (N)</span>
          <span className="metric-value">{nStor}m</span>
        </div>
        <div className="metric-row">
          <span className="metric-label">Storage (E)</span>
          <span className="metric-value">{eStor}m</span>
        </div>
        <p style={{ fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>
          Fixed storage length from geometry config.
        </p>
      </div>
    </div>
  );
};

export default SpillbackPanel;
