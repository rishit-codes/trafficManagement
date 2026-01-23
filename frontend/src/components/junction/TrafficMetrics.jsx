import React from 'react';

const TrafficMetrics = () => {
  return (
    <div className="detail-panel" style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'white' }}>
      <h4 className="panel-title" style={{ marginBottom: '12px' }}>Flow Metrics</h4>
      <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '80%' }}>
        Real-time flow sensor data is not currently available for this junction.
      </p>
    </div>
  );
};

export default TrafficMetrics;
