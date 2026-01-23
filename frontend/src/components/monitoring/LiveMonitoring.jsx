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
          LIVE FEED • CONNECTED
        </div>
      </div>

      {/* 2. Video Wall */}
      <VideoGrid cameras={[
          { id: 'J001', name: 'Alkapuri Circle', status: 'optimal', phase: 'Green (N-S)', queue: 'Low', flow: 0.8, video: 'junction1.mp4' },
          { id: 'J002', name: 'Market Cross', status: 'warning', phase: 'Red (All)', queue: 'Med', flow: 0.6, video: 'junction2.mp4' },
          { id: 'J003', name: 'Station Road', status: 'critical', phase: 'Green (E-W)', queue: 'High', flow: 0.4, video: 'junction3.mp4' },
          { id: 'J004', name: 'Tech Park East', status: 'optimal', phase: 'Red', queue: 'Low', flow: 0.9, video: 'junction4.mp4' },
          { id: 'J005', name: 'North Ring Road', status: 'optimal', phase: 'Green (S-Turn)', queue: 'Low', flow: 0.85, video: 'junction1.mp4' },
          { id: 'J006', name: 'City Hospital', status: 'warning', phase: 'Yellow', queue: 'Med', flow: 0.7, video: 'junction2.mp4' },
      ]} />

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
