import React from 'react';

const Dashboard = () => {
  return (
    <div className="dashboard-grid">
      <div className="stats-container">
        {/* Placeholder for Stats Cards */}
        <div className="card stat-card">
          <h3>Total Vehicles</h3>
          <p className="stat-value">1,245</p>
        </div>
        <div className="card stat-card">
          <h3>Active Junctions</h3>
          <p className="stat-value">8</p>
        </div>
        <div className="card stat-card">
          <h3>Avg Wait Time</h3>
          <p className="stat-value">45s</p>
        </div>
      </div>

      <div className="main-view">
        {/* Placeholder for Map/Grid */}
        <div className="card map-card">
          <h3>Junction Network</h3>
          <div className="map-placeholder">
            <p>Interactive Map Component Loading...</p>
          </div>
        </div>
      </div>

      <div className="alerts-panel">
        {/* Placeholder for Alerts */}
        <div className="card">
          <h3>Recent Alerts</h3>
          <ul className="alert-list">
            <li className="alert-item critical">
              <span className="alert-time">10:42 AM</span>
              <span>Spillback detected at J001</span>
            </li>
            <li className="alert-item warning">
              <span className="alert-time">10:38 AM</span>
              <span>High congestion at J003</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
