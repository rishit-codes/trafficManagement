import React from 'react';
import './TrafficSignal.css';

/**
 * TrafficSignal Component
 * Visually represents the backend-controlled signal state.
 * 
 * Props:
 *   - phase: "GREEN" | "YELLOW" | "RED" | null
 *   - timeRemaining: number (seconds)
 *   - loading: boolean
 *   - error: string | null
 */
const TrafficSignal = ({ phase, timeRemaining, loading, error }) => {
  // If there's an error or no data, show honest fallback
  if (error || phase === null) {
    return (
      <div className="traffic-signal-panel empty-state">
        <h4>Signal Phasing</h4>
        <p className="unavailable-message">
          Live signal phase data is currently unavailable for this pilot junction.
        </p>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="traffic-signal-panel loading">
        <h4>Signal Phasing</h4>
        <p>Connecting to signal controller...</p>
      </div>
    );
  }

  return (
    <div className="traffic-signal-panel">
      <h4>Signal Phasing</h4>
      
      <div className="signal-display">
        {/* Three-light vertical signal */}
        <div className="signal-lights">
          <div 
            className={`signal-light red ${phase === 'RED' ? 'active' : ''}`}
            aria-label={phase === 'RED' ? 'Red light active' : 'Red light inactive'}
          />
          <div 
            className={`signal-light yellow ${phase === 'YELLOW' ? 'active' : ''}`}
            aria-label={phase === 'YELLOW' ? 'Yellow light active' : 'Yellow light inactive'}
          />
          <div 
            className={`signal-light green ${phase === 'GREEN' ? 'active' : ''}`}
            aria-label={phase === 'GREEN' ? 'Green light active' : 'Green light inactive'}
          />
        </div>

        {/* Phase info */}
        <div className="signal-info">
          <div className={`phase-name phase-${phase?.toLowerCase()}`}>
            {phase}
          </div>
          <div className="time-remaining">
            <span className="countdown">{timeRemaining}</span>
            <span className="unit">seconds</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficSignal;
