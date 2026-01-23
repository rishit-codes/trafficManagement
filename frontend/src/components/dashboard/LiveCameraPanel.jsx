import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const LiveCameraPanel = ({ junction }) => {
  const [hasError, setHasError] = useState(false);
  
  // Reset error when junction changes
  useEffect(() => {
    setHasError(false);
  }, [junction]);

  if (!junction) {
    return (
      <div className="live-camera-panel empty-state">
        <div className="camera-placeholder-icon">📍</div>
        <h3>Select a junction</h3>
        <p>Click a map marker to view live feed</p>
      </div>
    );
  }

  const handleError = () => {
    setHasError(true);
  };

  return (
    <div className="live-camera-panel active-state">
      <div className="camera-header">
        <h3 className="camera-title">{junction.name}</h3>
        <div className="live-indicator">
          <span className="live-dot"></span>
          LIVE
        </div>
      </div>

      <div className="camera-feed-container">
        {!hasError ? (
          <video
            className="selected-live-video"
            src={junction.video}
            autoPlay
            loop
            muted
            playsInline
            onError={handleError}
          />
        ) : (
          <div className="video-error-state small">
             <div className="error-icon">☒</div>
             <p>Live feed unavailable</p>
          </div>
        )}
      </div>

      <div className="camera-footer">
        <span>ID: {junction.id}</span>
        <span>Lat: {junction.lat.toFixed(4)}, Lng: {junction.lng.toFixed(4)}</span>
      </div>
    </div>
  );
};

export default LiveCameraPanel;
