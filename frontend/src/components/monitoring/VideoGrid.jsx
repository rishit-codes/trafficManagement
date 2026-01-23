import React from 'react';
import VideoCard from './VideoCard';
import './LiveMonitoring.css';

const VideoGrid = () => {
  const junctions = [
    { id: 1, name: 'Alkapuri Circle', status: 'optimal', phase: 'Green (N-S)', queue: 'Low', flow: 0.8 },
    { id: 2, name: 'Market Cross', status: 'warning', phase: 'Red (All)', queue: 'Med', flow: 0.6 },
    { id: 3, name: 'Station Road', status: 'critical', phase: 'Green (E-W)', queue: 'High', flow: 0.4 },
    { id: 4, name: 'Tech Park East', status: 'optimal', phase: 'Red', queue: 'Low', flow: 0.9 },
    { id: 5, name: 'North Ring Road', status: 'optimal', phase: 'Green (S-Turn)', queue: 'Low', flow: 0.85 },
    { id: 6, name: 'City Hospital', status: 'warning', phase: 'Yellow', queue: 'Med', flow: 0.7 },
  ];

  return (
    <div className="video-grid">
      {junctions.map((j) => (
        <VideoCard key={j.id} junction={j} />
      ))}
    </div>
  );
};

export default VideoGrid;
