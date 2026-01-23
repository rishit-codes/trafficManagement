import React from 'react';

const ForecastPanel = () => {
  return (
    <div className="analytics-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="forecast-text">
        <strong>Prediction:</strong> Congestion likely on <span style={{ color: '#1E40AF' }}>East Approach</span> in next 45 mins due to increasing inflow rate (+12% / 10min).
      </div>
      
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #E5E7EB', borderRadius: '6px', background: '#F9FAFB', color: '#9CA3AF', fontSize: '12px' }}>
        [Forecast Model Visualization Placeholder]
      </div>

      <div className="forecast-meta">
        Confidence: 89% • Model: LSTM-Traffic-v2
      </div>
    </div>
  );
};

export default ForecastPanel;
