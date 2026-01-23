import React from 'react';
import './TrafficSignal4Way.css';

/**
 * TrafficSignal4Way Component
 * Visually represents a 4-arm traffic junction with backend-controlled signals.
 * 
 * Props:
 *   - currentPhase: "NS_GREEN" | "NS_YELLOW" | "EW_GREEN" | "EW_YELLOW" | "ALL_RED"
 *   - activeDirections: ["N", "S"] | ["E", "W"] | []
 *   - timeRemaining: number (seconds)
 *   - displayName: string (e.g., "North–South Green")
 *   - loading: boolean
 *   - error: string | null
 */
const TrafficSignal4Way = ({ 
  currentPhase, 
  activeDirections = [], 
  timeRemaining, 
  displayName,
  loading, 
  error 
}) => {
  // If there's an error or no data, show honest fallback
  if (error || currentPhase === null || currentPhase === undefined) {
    return (
      <div className="traffic-signal-4way-panel empty-state">
        <h4>Signal Phasing</h4>
        <p className="unavailable-message">
          Live 4-way signal phase data is currently unavailable for this pilot junction.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="traffic-signal-4way-panel loading">
        <h4>Signal Phasing</h4>
        <p>Connecting to signal controller...</p>
      </div>
    );
  }

  // Determine light color for each direction
  const getSignalColor = (direction) => {
    const isActive = activeDirections.includes(direction);
    
    if (!isActive) {
      return 'red';
    }
    
    // Active direction - check if yellow or green
    if (currentPhase.includes('YELLOW')) {
      return 'yellow';
    }
    return 'green';
  };

  const directions = ['N', 'E', 'S', 'W'];
  const directionLabels = {
    'N': 'North',
    'S': 'South',
    'E': 'East',
    'W': 'West'
  };

  return (
    <div className="traffic-signal-4way-panel">
      <h4>Signal Phasing</h4>
      
      {/* 4-Way Junction Layout */}
      <div className="junction-display">
        {/* North Position */}
        <div className="signal-position north">
          <span className="direction-label">N</span>
          <div className={`signal-light ${getSignalColor('N')}`} />
        </div>
        
        {/* West Position */}
        <div className="signal-position west">
          <span className="direction-label">W</span>
          <div className={`signal-light ${getSignalColor('W')}`} />
        </div>
        
        {/* Center Intersection */}
        <div className="intersection-center">
          <div className="intersection-box" />
        </div>
        
        {/* East Position */}
        <div className="signal-position east">
          <div className={`signal-light ${getSignalColor('E')}`} />
          <span className="direction-label">E</span>
        </div>
        
        {/* South Position */}
        <div className="signal-position south">
          <div className={`signal-light ${getSignalColor('S')}`} />
          <span className="direction-label">S</span>
        </div>
      </div>

      {/* Phase Info */}
      <div className="phase-info">
        <div className={`phase-name phase-${currentPhase?.toLowerCase().replace('_', '-')}`}>
          {displayName || currentPhase}
        </div>
        <div className="time-remaining">
          <span className="countdown">{timeRemaining}</span>
          <span className="unit">seconds remaining</span>
        </div>
      </div>
    </div>
  );
};

export default TrafficSignal4Way;
