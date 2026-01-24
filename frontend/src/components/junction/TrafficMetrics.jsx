import React from 'react';

const TrafficMetrics = ({ state }) => {
  // Simulate active metrics since our backend mostly returns static config
  // In a real system, this would come from `junctionData.metrics`

  // Simple prediction simulation based on time of day
  const getPrediction = () => {
    const hour = new Date().getHours();
    if (hour < 9) return "Morning Peak expected at 09:30";
    if (hour < 17) return "Evening Peak expected at 18:00";
    return "Traffic flow decreasing (Off-Peak)";
  };

  // Using the original hardcoded values for demonstration
  const nsCapacity = 1240;
  const ewCapacity = 2480;

  return (
    <div className="detail-panel">
      <h4 className="panel-title">Flow Capacity (Simulated)</h4>
      <div className="metrics-grid-inner">
        <div className="metric-gauge-card">
          <div className="direction-label">NORTH–SOUTH</div>
          <div className="gauge-val val-green">{nsCapacity.toLocaleString()}</div>
          <div className="gauge-sub">Max PCU/hr</div>
        </div>
        <div className="metric-gauge-card">
          <div className="direction-label">EAST–WEST</div>
          <div className="gauge-val val-amber">{ewCapacity.toLocaleString()}</div>
          <div className="gauge-sub">Max PCU/hr</div>
        </div>
      </div>

      {/* Prediction Section */}
      <div style={{ marginTop: '16px', padding: '8px', background: '#FEF3C7', borderRadius: '6px', borderLeft: '3px solid #D97706' }}>
        <p style={{ fontSize: '11px', fontWeight: '700', color: '#92400E', marginBottom: '2px' }}>PREDICTION</p>
        <p style={{ fontSize: '12px', color: '#B45309' }}>{getPrediction()}</p>
      </div>
    </div>
  );
};

export default TrafficMetrics;
