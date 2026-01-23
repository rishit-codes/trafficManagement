import React from 'react';
import GeometryPanel from './GeometryPanel';
import TrafficMetrics from './TrafficMetrics';
import SpillbackPanel from './SpillbackPanel';
import OptimizationPanel from './OptimizationPanel';
import SignalVisualization from './SignalVisualization';
import './JunctionDetail.css';

const JunctionDetail = () => {
  return (
    <div className="junction-detail-container">
      {/* 1. Junction Header */}
      <div className="junction-header">
        <div className="header-left">
          <h2 className="junction-name">Alkapuri Circle</h2>
          <span className="junction-id">ID: J-012</span>
          <span className="status-badge status-warning">WARNING</span>
        </div>
        <div className="header-right">
          <span className="last-updated">Updated 3s ago</span>
        </div>
      </div>

      {/* 2. Live Monitoring Section */}
      <section className="detail-section">
        <h3 className="section-title">Live Traffic Monitoring</h3>
        <div className="monitoring-grid">
          <GeometryPanel />
          <TrafficMetrics />
          <SpillbackPanel />
        </div>
      </section>

      {/* 3. Optimization Section */}
      <section className="detail-section">
        <h3 className="section-title">Signal Optimization & Timing</h3>
        <div className="optimization-grid">
          <OptimizationPanel />
          <SignalVisualization />
        </div>
      </section>
    </div>
  );
};

export default JunctionDetail;
