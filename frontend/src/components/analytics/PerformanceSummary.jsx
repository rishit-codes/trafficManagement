import React from 'react';

const PerformanceSummary = () => {
  const metrics = [
    { label: 'Avg Wait Time', value: '-15%', sub: 'vs. fixed-time baseline' },
    { label: 'Spillback Events', value: '-32%', sub: 'congestion reduction' },
    { label: 'Vehicle Throughput', value: '+18%', sub: 'efficiency gain' },
    { label: 'Signal Green Efficiency', value: '91%', sub: 'active green utilization' },
  ];

  return (
    <div className="summary-grid">
      {metrics.map((m, i) => (
        <div key={i} className="analytics-card summary-card">
          <span className="summary-label">{m.label}</span>
          <span 
            className="summary-value" 
            style={{ color: m.value.startsWith('-') || m.value.startsWith('+') || m.value > '90' ? '#059669' : '#1E40AF' }}
          >
            {m.value}
          </span>
          <span className="summary-subtext">{m.sub}</span>
        </div>
      ))}
    </div>
  );
};

export default PerformanceSummary;
