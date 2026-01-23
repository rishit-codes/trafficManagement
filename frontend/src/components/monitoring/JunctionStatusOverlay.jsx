import React from 'react';
import './LiveMonitoring.css';

const JunctionStatusOverlay = ({ phase, queue, flow }) => {
  return (
    <div className="video-overlay">
      <div className="overlay-row">
        <span className="overlay-label">Phase:</span>
        <span className="overlay-value">{phase}</span>
      </div>
      <div className="overlay-row">
        <span className="overlay-label">Queue:</span>
        <span className="overlay-value">{queue}</span>
      </div>
      <div className="overlay-row">
        <span className="overlay-label">Flow Ratio:</span>
        <span className="overlay-value">{flow}</span>
      </div>
    </div>
  );
};

export default JunctionStatusOverlay;
