import React, { useState } from 'react';
import VideoGrid from './VideoGrid';
import VisionStatusCard from './VisionStatusCard';
import { pilotJunctions } from '../../data/pilotJunctions';
import './LiveMonitoring.css';

const LiveMonitoring = () => {
  // Explicitly defined demo videos as per requirements
  const VIDEO_SOURCES = [
    '/videos/trafficdemo8.mp4',
    '/videos/trafficdemo7.mp4',
    '/videos/trafficdemo6.mp4',
    '/videos/trafficdemo5.mp4',
    '/videos/trafficdemo4.mp4'
  ];

  // Map pilot data to video grid format with deterministic mapping
  const videoFeeds = pilotJunctions.map((j, index) => {
      // Use modulo to safely wrap around if we have more junctions than videos
      const videoSrc = VIDEO_SOURCES[index % VIDEO_SOURCES.length];
      
      return {
          id: j.id,
          name: j.name,
          src: videoSrc
      };
  });

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
