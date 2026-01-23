import React from 'react';

const PerformanceSummary = ({ data, loading }) => {
  if (loading) {
     return <div className="summary-grid loading-state">Loading performance metrics...</div>;
  }

  if (!data) {
     return (
        <div className="analytics-card empty-state" style={{ padding: '24px', textAlign: 'center', color: '#6B7280' }}>
            Analytics data not yet available for this junction.
        </div>
     );
  }

  // Map backend response to UI cards
  // Backend returns negative values for reductions (e.g., -15 means 15% reduction/improvement)
  
  const metrics = [
    { 
        label: 'Avg Wait Time', 
        value: data.avg_wait_reduction != null ? `${Math.abs(data.avg_wait_reduction)}%` : '--', 
        sub: 'vs. fixed-time baseline',
        good: data.avg_wait_reduction < 0 // Negative value means improvement
    },
    { 
        label: 'Spillback Events', 
        value: data.spillback_reduction != null ? `${Math.abs(data.spillback_reduction)}%` : '--', 
        sub: 'congestion reduction',
        good: data.spillback_reduction < 0 // Negative value means improvement
    },
    { 
        label: 'Vehicle Throughput', 
        value: data.throughput_increase != null ? `+${data.throughput_increase}%` : '--', 
        sub: 'efficiency gain',
        good: true
    },
    { 
        label: 'Signal Green Efficiency', 
        value: data.green_efficiency != null ? `${data.green_efficiency}%` : '--', 
        sub: 'active green utilization',
        good: true
    },
  ];

  return (
    <div className="summary-grid">
      {metrics.map((m, i) => (
        <div key={i} className="analytics-card summary-card">
          <span className="summary-label">{m.label}</span>
          <span 
            className="summary-value" 
            style={{ color: m.value !== '--' && m.good ? '#059669' : (m.value !== '--' ? '#B91C1C' : '#6B7280') }}
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
