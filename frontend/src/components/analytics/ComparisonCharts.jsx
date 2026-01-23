import React from 'react';

const ComparisonCharts = () => {
  return (
    <div className="analytics-card" style={{ 
      background: 'white', 
      border: '1px solid #E5E7EB', 
      borderRadius: '8px', 
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '300px',
      textAlign: 'center'
    }}>
      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>
        Before/After Analysis
      </h3>
      <p style={{ fontSize: '14px', color: '#6B7280', maxWidth: '300px' }}>
        comparative impact analysis will be available after sufficient historical data is collected.
      </p>
    </div>
  );
};

export default ComparisonCharts;
