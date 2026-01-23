import React, { useState } from 'react';
import './Dashboard.css';

const AlertsPanel = ({ alerts = [], loading = false, error = null }) => {
  
  // Format relative time
  const formatTime = (isoString) => {
      if (!isoString) return 'Just now';
      const diff = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins} min ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours} hr ago`;
      return '1 day+ ago';
  };

  // No demo alerts.
  const displayAlerts = alerts;

  // If online but strictly no alerts, show empty state (handled below in render)
  // But if using demoAlerts due to error, we use that.
  
  // Override: If passing empty list from parent because truly no alerts, displayAlerts is empty.
  // If error is present, we used demoAlerts.
  // Wait, if error is present, displayAlerts = demoAlerts. Correct.
  // If alerts is empty and NO error, displayAlerts = []. Correct.

  if (loading && alerts.length === 0) {
      return <div className="dashboard-card alerts-panel">Loading alerts...</div>;
  }

  return (
    <div className="dashboard-card alerts-panel">
      <div className="alerts-header">
        <h3 className="panel-title">Live Alerts</h3>
        <span className="alerts-count">{displayAlerts.length} Active</span>
      </div>

      <div className="alerts-list">
        {displayAlerts.length === 0 ? (
          <div className="alerts-empty">
            {error ? "Alert feed unavailable" : "No active traffic alerts"}
          </div>
        ) : (
          displayAlerts.map((alert, idx) => {
            const severity = alert.severity ? alert.severity.toUpperCase() : 'INFO';
            // Handle different ID possibilities
            const key = alert.id || alert.junction_id + idx;
            
            return (
              <div key={key} className={`alert-item ${severity === 'CRITICAL' || severity === 'HIGH' ? 'alert-critical' : 'alert-warning'}`}>
                <div className="alert-top">
                  <span className={`alert-badge ${severity.toLowerCase()}`}>
                    {severity}
                  </span>
                  <span className="alert-time">{alert.time || formatTime(alert.timestamp)}</span>
                </div>
                
                <div className="alert-content">
                  <strong>{alert.junction || alert.junction_id}</strong>
                  <p>{alert.message}</p>
                </div>

                <div className="alert-footer">
                  <a href="#" className="alert-link">View details →</a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AlertsPanel;
