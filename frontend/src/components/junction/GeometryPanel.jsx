import React from 'react';

const GeometryPanel = () => {
  return (
    <div className="detail-panel">
      <h4 className="panel-title">Physical Geometry</h4>
      
      <div className="metric-row">
        <span className="metric-label">Configuration</span>
        <span className="metric-value">4-Way Signalized</span>
      </div>
      
      <div className="metric-row">
        <span className="metric-label">Total Lanes</span>
        <span className="metric-value">12 (3 per arm)</span>
      </div>

      <div className="metric-row">
        <span className="metric-label">Lane Width</span>
        <span className="metric-value warning-text">2.8m (Narrow)</span>
      </div>

      <div className="metric-row">
        <span className="metric-label">Heavy Vehicle %</span>
        <span className="metric-value">18%</span>
      </div>

      <div className="metric-row">
        <span className="metric-label">Pedestrian Xing</span>
        <span className="metric-value">Yes (All Approaches)</span>
      </div>
    </div>
  );
};

export default GeometryPanel;
