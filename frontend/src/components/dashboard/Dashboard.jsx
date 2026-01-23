import React from 'react';
import KpiCards from './KpiCards';
import CityMap from './CityMap';
import AlertsPanel from './AlertsPanel';
import TrafficTrend from './TrafficTrend';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      {/* 1. Page Header */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">City Command Center</h2>
          <p className="dashboard-subtitle">Real-time traffic monitoring and situational awareness</p>
        </div>
        <div className="dashboard-status">
          Demo mode — backend offline
        </div>
      </div>

      {/* 2. KPI Section */}
      <section className="dashboard-section">
        <KpiCards />
      </section>

      {/* 3. Map & Alerts Section */}
      <section className="dashboard-section map-alerts-row">
        <div className="dashboard-column map-column">
          <CityMap />
        </div>
        <div className="dashboard-column alerts-column">
          <AlertsPanel />
        </div>
      </section>

      {/* 4. Trends Section */}
      <section className="dashboard-section">
        <TrafficTrend />
      </section>
    </div>
  );
};

export default Dashboard;
