import React from 'react';
import './dashboard.css';

function DashboardHeader() {
  return (
    <header className="dashboard-header">
      <div className="header-left">
        <h1 className="header-title">City Command Center</h1>
        <p className="header-subtitle">Real-time traffic monitoring across Vadodara</p>
      </div>
      <div className="header-right">
        <div className="status-pill">
          <span className="status-dot"></span>
          Backend unavailable – showing demo data
        </div>
        <div className="auto-refresh">
          <span className="refresh-label">Auto-refresh</span>
          <div className="toggle-switch">
            <div className="toggle-track active">
              <div className="toggle-thumb" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
