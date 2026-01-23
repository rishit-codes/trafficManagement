import React from 'react';

const TrafficMetrics = () => {
  const approaches = [
    { dir: 'North', flow: 1250, cap: 1800, ratio: 0.69, status: 'green' },
    { dir: 'South', flow: 1400, cap: 1800, ratio: 0.77, status: 'amber' },
    { dir: 'East', flow: 900, cap: 1600, ratio: 0.56, status: 'green' },
    { dir: 'West', flow: 1100, cap: 1600, ratio: 0.68, status: 'green' },
  ];

  return (
    <div className="detail-panel">
      <h4 className="panel-title">Flow Metrics (PCU/hr)</h4>
      <div className="metrics-grid-inner">
        {approaches.map(a => (
          <div key={a.dir} className="metric-gauge-card">
            <div className="direction-label">{a.dir} Approach</div>
            <div className={`gauge-val ${a.status === 'green' ? 'val-green' : 'val-amber'}`}>
              {a.ratio.toFixed(2)}
            </div>
            <div className="gauge-sub">Flow Ratio (y)</div>
            <div style={{ fontSize: '11px', marginTop: '4px', color: '#6B7280' }}>
              Q: {a.flow} / S: {a.cap}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrafficMetrics;
