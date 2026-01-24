import React, { useState } from 'react';
import './Dashboard.css';

const AlertsPanel = ({ alerts = [], loading = false, error = null, onAlertClick }) => {
  
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

  const displayAlerts = alerts;

  if (loading && alerts.length === 0) {
      return <div className="dashboard-card alerts-panel">Loading alerts...</div>;
  }

  return (
    <div className="dashboard-card alerts-panel">
      <div className="alerts-header">
        <h3 className="panel-title">Traffic Alerts</h3>
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
            const key = alert.id || alert.junction_id + idx;
            
            return (
              <div 
                key={key} 
                className={`alert-item ${severity === 'CRITICAL' || severity === 'HIGH' ? 'alert-critical' : 'alert-warning'}`}
                onClick={() => onAlertClick && onAlertClick(alert)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
              >
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
                  <span className="alert-link">View Details →</span>
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
