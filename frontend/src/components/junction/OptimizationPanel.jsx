import React from 'react';

const OptimizationPanel = () => {
  return (
    <div className="detail-panel" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'white' }}>
      <h4 className="panel-title" style={{ marginBottom: '16px' }}>Signal Optimization</h4>
      
      <div style={{ maxWidth: '300px' }}>
        <p style={{ fontSize: '15px', fontWeight: '500', color: '#111827', marginBottom: '8px' }}>
          Real-time signal optimization is unavailable for the Vadodara pilot deployment.
        </p>
        <p style={{ fontSize: '13px', color: '#6B7280' }}>
          This module activates once validated controller feedback is available.
        </p>
      </div>
    </div>
  );
};

export default OptimizationPanel;
