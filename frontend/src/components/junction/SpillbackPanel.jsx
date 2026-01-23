import React from 'react';

const SpillbackPanel = () => {
  return (
    <div className="detail-panel" style={{ minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'white' }}>
      <h4 className="panel-title" style={{ marginBottom: '12px' }}>Queue spillback</h4>
      <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '80%' }}>
        Queue monitoring sensors are not currently active in this zone.
      </p>
    </div>
  );
};

export default SpillbackPanel;
