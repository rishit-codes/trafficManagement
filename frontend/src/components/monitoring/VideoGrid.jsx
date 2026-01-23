import React from 'react';
import VideoCard from './VideoCard';

const VideoGrid = ({ cameras }) => {
  if (!cameras || cameras.length === 0) {
    return <div className="no-feeds">No video feeds available</div>;
  }

  return (
    <div className="video-grid">
      {cameras.map((cam) => (
        <VideoCard 
            key={cam.id} 
            id={cam.id}
            name={cam.name}
            src={cam.src}
        />
      ))}
    </div>
  );
};

export default VideoGrid;
