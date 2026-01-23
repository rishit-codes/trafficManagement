import React from 'react';
import './JunctionDetail.css';

const ApproachMetric = ({ label, value, unit }) => (
  <div className="geo-metric" style={{ display: 'flex', alignItems: 'center', fontSize: '12px', lineHeight: '1.6' }}>
    <span className="geo-label" style={{ width: '55px', flexShrink: 0 }}>{label}</span>
    <span style={{ margin: '0 4px', color: '#9CA3AF' }}>:</span>
    <span className="geo-value" style={{ fontWeight: '500' }}>{value} {unit}</span>
  </div>
);

const LaneVisual = ({ count }) => (
  <div className="lane-visual" title={`${count} Lanes`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="lane-marker"></div>
    ))}
  </div>
);

const ApproachCard = ({ direction, data }) => {
  if (!data) return null;

  // Color coding for directions
  const colors = {
    north: '#3B82F6', // Blue
    south: '#8B5CF6', // Purple
    east: '#10B981',  // Green
    west: '#F59E0B'   // Amber
  };

  const borderColor = colors[direction.toLowerCase()] || '#E5E7EB';

  return (
    <div className="geo-approach-card" style={{ borderTop: `3px solid ${borderColor}` }}>
      <div className="geo-card-header">
        <div className="geo-dir-badge">{direction.toUpperCase()}</div>
        <LaneVisual count={data.lanes} />
      </div>

      <div className="geo-metrics-grid">
        <ApproachMetric label="Width" value={data.width_m} unit="m" />
        <ApproachMetric label="Radius" value={data.turn_radius_m} unit="m" />
        <ApproachMetric label="Storage" value={data.storage_length_m} unit="m" />
        <div className="geo-metric highlight" style={{ display: 'flex', alignItems: 'center', marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #E5E7EB', fontSize: '12px', lineHeight: '1.6' }}>
          <span className="geo-label" style={{ width: '55px', flexShrink: 0, fontWeight: '600' }}>Capacity</span>
          <span style={{ margin: '0 4px', color: '#9CA3AF' }}>:</span>
          <span className="geo-value-lg" style={{ fontWeight: '700', color: '#059669' }}>
            {Math.round(data.saturation_flow)} <span className="geo-unit" style={{ fontSize: '11px', color: '#6B7280', fontWeight: '400' }}> PCU/hr</span>
          </span>
        </div>
      </div>
    </div>
  );
};

const GeometryPanel = ({ data }) => {
  if (!data || !data.approaches) {
    return (
      <div className="detail-panel empty-geometry">
        <h4 className="panel-title">Junction Geometry</h4>
        <p className="text-muted">No geometric configurations found.</p>
      </div>
    );
  }

  return (
    <div className="detail-panel geometry-panel">
      <div className="panel-header-row">
        <h4 className="panel-title">Geometry Configuration</h4>
        <span className="geo-source-badge">Config: {data.name}</span>
      </div>

      <div className="geometry-compass-grid">
        {/* Order optimized for 2x2 grid reading */}
        <ApproachCard direction="north" data={data.approaches.north} />
        <ApproachCard direction="south" data={data.approaches.south} />
        <ApproachCard direction="east" data={data.approaches.east} />
        <ApproachCard direction="west" data={data.approaches.west} />
      </div>
    </div>
  );
};

export default GeometryPanel;
