import React from 'react';

const GeometryPanel = () => {
  return (
    <div className="detail-panel" style={{ minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'white' }}>
      <h4 className="panel-title" style={{ marginBottom: '12px' }}>Junction Geometry</h4>
      <p style={{ fontSize: '13px', color: '#6B7280', maxWidth: '80%' }}>
        Detailed geometric configuration data is not available for this site.
      </p>
    </div>
  );
};

export default GeometryPanel;
