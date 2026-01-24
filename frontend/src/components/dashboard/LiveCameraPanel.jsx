import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const LiveCameraPanel = ({ junction, override }) => {
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
          RECORDED DEMO
        </div>
        <div className="demo-feed-subtitle">
          This is a recorded simulation feed for pilot demonstration.
        </div>
      </div>

      <div className="camera-feed-container">
        {!hasError ? (
          <>
            <video
              className="selected-live-video"
              src={junction.video}
              autoPlay
              loop
              muted
              playsInline
              onError={handleError}
            />
            {/* OVERRIDE OVERLAY */}
            {(override?.active && override.type === 'manual') && (
              <div className="camera-overlay manual-override">
                ⚠ {override.label}
              </div>
            )}
            {(override?.active && override.type === 'emergency') && (
              <div className="camera-overlay emergency-override">
                🚑 EMERGENCY CORRIDOR ACTIVE
              </div>
            )}
          </>
        ) : (
          <div className="video-error-state small">
            <div className="error-icon">☒</div>
            <p>Feed unavailable</p>
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
