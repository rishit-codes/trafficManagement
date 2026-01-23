import React from 'react';
import JunctionStatusOverlay from './JunctionStatusOverlay';
import './LiveMonitoring.css';

// Backend should expose samples folder via:
// app.mount("/videos", StaticFiles(directory="samples"), name="videos")

const VideoCard = ({ junction }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasError, setHasError] = React.useState(false);
  const videoRef = React.useRef(null);

  const videoUrl = `http://localhost:8000/videos/${junction.video}`;

  const handleLoadedData = () => {
    setIsPlaying(true);
    setHasError(false);
  };

  const handleError = () => {
    setHasError(true);
    setIsPlaying(false);
  };

  return (
    <div className="video-card">
      <div className="video-header">
        <span className="junction-name">{junction.name}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
             {/* Live indicator only if playing and no error */}
             {isPlaying && !hasError && (
                 <span className="live-indicator">
                    <span className="pulse-dot-small"></span> LIVE
                 </span>
             )}
            <span className={`status-badge status-${junction.status}`}>
            {junction.status}
            </span>
        </div>
      </div>

      <div className="video-player-wrapper">
        {hasError ? (
            <div className="video-placeholder error-state">
                <div style={{ fontSize: '24px', color: '#6b7280' }}>📹</div>
                <div style={{ color: '#9ca3af' }}>Feed unavailable</div>
                <div style={{ fontSize: '10px', color: '#4b5563' }}>OFFLINE</div>
            </div>
        ) : (
             <>
                {!isPlaying && (
                    <div className="video-placeholder loading-state">
                        <div className="spinner"></div>
                        <div style={{ fontSize: '12px', marginTop: '8px' }}>Connecting to live feed...</div>
                    </div>
                )}
                <video 
                  ref={videoRef}
                  src={videoUrl} 
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  preload="metadata"
                  onLoadedData={handleLoadedData}
                  onError={handleError}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: isPlaying ? 'block' : 'none' }}
                /> 
            </>
        )}

        <JunctionStatusOverlay 
          phase={junction.phase} 
          queue={junction.queue} 
          flow={junction.flow} 
        />
      </div>

      <div className="video-footer">
        <span>Cam-0{junction.id}</span>
        <span>Latency: 24ms</span>
      </div>
    </div>
  );
};

export default VideoCard;
