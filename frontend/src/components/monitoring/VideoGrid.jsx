import React from 'react';
import VideoCard from './VideoCard';
import './LiveMonitoring.css';

const VideoGrid = ({ cameras = [] }) => {
  // Fallback if no props provided (though parent provides them now)
  const junctions = cameras.length > 0 ? cameras : [
    { id: 1, name: 'Alkapuri Circle', status: 'optimal', phase: 'Green (N-S)', queue: 'Low', flow: 0.8 },
    { id: 2, name: 'Market Cross', status: 'warning', phase: 'Red (All)', queue: 'Med', flow: 0.6 },
    { id: 3, name: 'Station Road', status: 'critical', phase: 'Green (E-W)', queue: 'High', flow: 0.4 },
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
