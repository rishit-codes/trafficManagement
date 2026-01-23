import React, { useState } from 'react';

const VideoCard = ({ id, name, src }) => {
  const [hasError, setHasError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const handleError = () => {
    setHasError(true);
    // console.warn(`Failed to load video source: ${src}`); // Suppressed for cleaner logs
  };

  const handleLoadedData = () => {
    setIsVideoLoaded(true);
  };

  return (
    <div className="video-card">
      <div className="video-header">
        <span className="camera-name">{name}</span>
        <div className="live-indicator">
          <span className="live-dot"></span>
          <span className="live-text">RECORDED DEMO</span>
        </div>
        <div className="demo-feed-subtitle" style={{ fontSize: '0.7rem', color: '#888', marginTop: '2px', width: '100%' }}>
            This is a recorded simulation feed for pilot demonstration.
        </div>
      </div>

      <div className="video-content">
        {!hasError ? (
          <video
            className={`traffic-video ${isVideoLoaded ? 'loaded' : 'loading'}`}
            src={src}
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
            onError={handleError}
            onLoadedData={handleLoadedData}
          />
        ) : (
          <div className="video-error-state">
            <div className="error-icon">☒</div>
            <p>Live feed unavailable for this junction</p>
          </div>
        )}
      </div>

      <div className="video-footer">
        Simulated traffic feed • Camera ID: {id}
      </div>
    </div>
  );
};

export default VideoCard;
