import React from 'react';
import JunctionStatusOverlay from './JunctionStatusOverlay';
import './LiveMonitoring.css';

const VideoCard = ({ junction }) => {
  // Using a sample sample video URL logic or placeholder
  // In a real scenario, this would point to a stream URL
  const demoVideoUrl = "https://www.w3schools.com/html/mov_bbb.mp4"; // Placeholder sample

  return (
    <div className="video-card">
      <div className="video-header">
        <span className="junction-name">{junction.name}</span>
        <span className={`status-badge status-${junction.status}`}>
          {junction.status}
        </span>
      </div>

      <div className="video-player-wrapper">
        {/* Using a placeholder message instead of actual video to prevent bandwidth issues in this environment, 
            but structure supports video tag. Uncomment video tag below to use actual video. */}
        <div className="video-placeholder">
           <div style={{ fontSize: '24px' }}>📹</div>
           <div>Live Feed Restricted</div>
           <div style={{ fontSize: '10px' }}>Demo Mode</div>
        </div>
        
        {/* 
        <video 
          src={demoVideoUrl} 
          autoPlay 
          muted 
          loop 
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        /> 
        */}

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
