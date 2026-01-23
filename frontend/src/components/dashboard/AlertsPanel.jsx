import React, { useState } from 'react';
import './Dashboard.css';

const AlertsPanel = () => {
  const [alerts] = useState([
    {
      id: 1,
      severity: 'CRITICAL',
      junction: 'Market Rd / 4th Ave',
      message: 'Gridlock detected. Manual override required.',
      time: '5 min ago'
    },
    {
      id: 2,
      severity: 'WARNING',
      junction: 'Main St / Central',
      message: 'Queue length exceeding 80% threshold.',
      time: '12 min ago'
    },
    {
      id: 3,
      severity: 'WARNING',
      junction: 'Tech Park East',
      message: 'Signal controller latency > 200ms.',
      time: '24 min ago'
    },
    {
      id: 4,
      severity: 'WARNING',
      junction: 'North Ring Road',
      message: 'Unusual congestion pattern detected.',
      time: '45 min ago'
    }
  ]);

  return (
    <div className="dashboard-card alerts-panel">
      <div className="alerts-header">
        <h3 className="panel-title">Live Alerts</h3>
        <span className="alerts-count">{alerts.length} Active</span>
      </div>

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <div className="alerts-empty">No active alerts</div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.severity === 'CRITICAL' ? 'alert-critical' : 'alert-warning'}`}>
              <div className="alert-top">
                <span className={`alert-badge ${alert.severity.toLowerCase()}`}>
                  {alert.severity}
                </span>
                <span className="alert-time">{alert.time}</span>
              </div>
              
              <div className="alert-content">
                <strong>{alert.junction}</strong>
                <p>{alert.message}</p>
              </div>

              <div className="alert-footer">
                <a href="#" className="alert-link">View details →</a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
