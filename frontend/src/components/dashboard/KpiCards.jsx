import React, { useEffect, useState } from 'react';
import './Dashboard.css';

const KpiCards = () => {
  // Demo State
  const [data, setData] = useState({
    activeJunctions: { val: 7, total: 8, optimal: 4, warning: 2, critical: 1 },
    waitTime: { val: 32, baseline: 45, trend: -29 },
    spillback: 1,
    efficiency: 87
  });

  return (
    <div className="kpi-grid">
      {/* 1. Active Junctions */}
      <div className="dashboard-card kpi-card">
        <h3 className="kpi-title">Active Junctions</h3>
        <div className="kpi-main">
          <span className="kpi-value">{data.activeJunctions.val} / {data.activeJunctions.total}</span>
        </div>
        <div className="kpi-subtext">88% operational</div>
        <div className="kpi-breakdown">
          <span className="dot dot-green" title="Optimal: 4"></span>
          <span className="dot dot-green"></span>
          <span className="dot dot-green"></span>
          <span className="dot dot-green"></span>
          <span className="dot dot-amber" title="Warning: 2"></span>
          <span className="dot dot-amber"></span>
          <span className="dot dot-red" title="Critical: 1"></span>
        </div>
      </div>

      {/* 2. Avg Wait Time */}
      <div className="dashboard-card kpi-card">
        <h3 className="kpi-title">Average Wait Time</h3>
        <div className="kpi-main">
          <span className="kpi-value">{data.waitTime.val} s</span>
        </div>
        <div className="kpi-footer">
          <span className="kpi-subtext">vs {data.waitTime.baseline}s baseline</span>
          <span className="kpi-trend trend-green">{data.waitTime.trend}%</span>
        </div>
      </div>

      {/* 3. Spillback Events */}
      <div className="dashboard-card kpi-card">
        <h3 className="kpi-title">Active Spillback Events</h3>
        <div className="kpi-main">
          <span className="kpi-value">{data.spillback}</span>
          <span className="kpi-badge badge-critical">CRITICAL</span>
        </div>
        <div className="kpi-footer">
          <a href="#" className="kpi-link">View affected junctions →</a>
        </div>
      </div>

      {/* 4. System Efficiency */}
      <div className="dashboard-card kpi-card">
        <h3 className="kpi-title">System Efficiency</h3>
        <div className="kpi-main">
          <span className="kpi-value">{data.efficiency}%</span>
        </div>
        <div className="kpi-subtext">Overall network performance</div>
        <div className="progress-bar-bg">
          <div className="progress-bar-fill" style={{ width: `${data.efficiency}%` }}></div>
        </div>
      </div>
    </div>
  );
};

// Add internal styles for KPIs to keep it scoped if needed, or rely on Dashboard.css
export default KpiCards;
