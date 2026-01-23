import React, { useEffect, useState } from 'react';
import './Dashboard.css';

const KpiCards = ({ junctions = [], loading = false }) => {
  // Calculate specific metrics from junctions data
  const total = junctions.length;
  const optimal = junctions.filter(j => j.status === 'optimal').length;
  const warning = junctions.filter(j => j.status === 'warning').length;
  const critical = junctions.filter(j => j.status === 'critical').length;
  
  // Calculate efficiency based on optimal ratio (mock calculation)
  const efficiency = total > 0 ? Math.round(((optimal + (warning * 0.5)) / total) * 100) : 0;

  // No demo data. Pure live or empty.
  const hasData = total > 0;

  if (loading) {
    return <div className="kpi-grid">Loading KPIs...</div>;
  }

  return (
    <div className="kpi-grid">
      {/* 1. Active Junctions */}
      <div className="dashboard-card kpi-card">
        <h3 className="kpi-title">Active Junctions</h3>
        <div className="kpi-main">
          <span className="kpi-value">{hasData ? `${total} / ${total}` : '--'}</span>
        </div>
        <div className="kpi-subtext">Online status</div>
        <div className="kpi-breakdown">
          {hasData ? junctions.map((j, i) => (
             <span key={i} className={`dot dot-${j.status === 'critical' ? 'red' : j.status === 'warning' ? 'amber' : 'green'}`} title={`${j.name}: ${j.status}`}></span>
          )) : <span className="kpi-empty-text">Data unavailable</span>}
        </div>
      </div>

      {/* 2. Avg Wait Time */}
      <div className="dashboard-card kpi-card">
        <h3 className="kpi-title">Average Wait Time</h3>
        <div className="kpi-main">
          {/* Honest: No live wait time data yet */}
          <span className="kpi-value">--</span>
        </div>
        <div className="kpi-footer">
           <span className="kpi-subtext">Baselining in progress...</span>
        </div>
      </div>

      {/* 3. Spillback Events */}
      <div className="dashboard-card kpi-card">
        <h3 className="kpi-title">Active Spillback Events</h3>
        <div className="kpi-main">
          {/* Honest: No live spillback monitoring */}
          <span className="kpi-value">--</span>
        </div>
        <div className="kpi-footer">
          <span className="kpi-subtext">Real-time alerts inactive</span>
        </div>
      </div>

      {/* 4. System Efficiency */}
      <div className="dashboard-card kpi-card">
        <h3 className="kpi-title">System Efficiency</h3>
        <div className="kpi-main">
          <span className="kpi-value">{hasData ? `${efficiency}%` : '-- %'}</span>
        </div>
        <div className="kpi-subtext">Based on connection status</div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: hasData ? `${efficiency}%` : '0%' }}></div>
        </div>
      </div>
    </div>
  );
};

// Add internal styles for KPIs to keep it scoped if needed, or rely on Dashboard.css
export default KpiCards;
