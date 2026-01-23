import React from 'react';

const FlowGauge = ({ label, value, color }) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="gauge-container">
      <div className="gauge-circle" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <svg width="120" height="120" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <span style={{ fontSize: '24px', fontWeight: '700', color: color }}>
          {value}%
        </span>
        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
          LEVEL
        </span>
      </div>
      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-main)' }}>{label}</span>
    </div>
  );
};

export default FlowGauge;
