import React, { useState } from 'react';
import VideoGrid from './VideoGrid';
import VisionStatusCard from './VisionStatusCard';
import { pilotJunctions } from '../../data/pilotJunctions';
import './LiveMonitoring.css';

const LiveMonitoring = () => {
  // Map pilot data to video grid format
  const videoFeeds = pilotJunctions.map(j => ({
      id: j.id,
      name: j.name,
      src: j.video
  }));

  return (
    <div className="monitoring-container">
      {/* 1. Page Header */}
      <div className="monitoring-header">
        <div>
          <h2 className="monitoring-title">Live Traffic Monitoring</h2>
          <p className="monitoring-subtitle">Real-time junction video feeds from Vadodara Pilot Zone</p>
        </div>
        
        <div className="live-badge">
          <span className="pulse-dot"></span>
          SYSTEM ONLINE
        </div>
      </div>

      {/* 2. Video Wall */}
      <VideoGrid cameras={videoFeeds} />

      {/* 3. Vision System Metrics */}
      <VisionStatusCard />
    </div>
  );
};

export default LiveMonitoring;
