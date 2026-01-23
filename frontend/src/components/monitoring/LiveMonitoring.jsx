import React from 'react';
import VideoGrid from './VideoGrid';
import './LiveMonitoring.css';

const LiveMonitoring = () => {
  return (
    <div className="monitoring-container">
      {/* 1. Page Header */}
      <div className="monitoring-header">
        <div>
          <h2 className="monitoring-title">Live Monitoring</h2>
          <p className="monitoring-subtitle">Real-time junction video feeds and signal status</p>
        </div>
        
        <div className="live-badge">
          <span className="pulse-dot"></span>
          LIVE FEED • DEMO
        </div>
      </div>

      {/* 2. Video Wall */}
      <VideoGrid />

      {/* 3. Legend */}
      <div className="monitoring-legend">
        <div className="legend-item"><span className="dot dot-green"></span> Optimal Flow</div>
        <div className="legend-item"><span className="dot dot-amber"></span> Congestion Building</div>
        <div className="legend-item"><span className="dot dot-red"></span> Critical Stall</div>
      </div>
    </div>
  );
};

export default LiveMonitoring;
