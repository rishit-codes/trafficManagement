import React from 'react';

const SignalVisualization = () => {
  return (
    <div className="detail-panel" style={{ minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'white' }}>
      <h4 className="panel-title" style={{ marginBottom: '16px' }}>Signal Phasing</h4>
      
      <div style={{ maxWidth: '300px' }}>
        <p style={{ fontSize: '15px', color: '#374151', marginBottom: '8px' }}>
          Live signal phase visualization is unavailable for this pilot junction.
        </p>
      </div>
    </div>
  );
};

export default SignalVisualization;
