import React, { useState } from 'react';
import { Play, Pause, Zap, Disc, Activity } from 'lucide-react';
import FlowGauge from '../../components/junction/FlowGauge'; // Will create
import SignalMap from '../../components/junction/SignalMap'; // Will create

const JunctionDetails = () => {
  const [activeMode, setActiveMode] = useState('auto'); // auto, manual, emergency

  return (
    <div className="junction-grid">
      {/* 1. Live Video Feed */}
      <div className="section video-section">
        <div className="video-placeholder">
          <div className="video-overlay">
            <span className="live-badge">LIVE</span>
            <span style={{ fontSize: '12px', color: 'var(--color-primary)' }}>CAM-01 [J001]</span>
          </div>
          <p>NO SIGNAL CONNECTION</p>
        </div>
      </div>

      {/* 2. Signal Schematic */}
      <div className="section schematic-section">
        <h3 className="section-title" style={{color: 'var(--color-text-muted)', fontSize: '12px', marginBottom: '10px'}}>REAL-TIME SIGNAL MAP</h3>
        <SignalMap />
      </div>

      {/* 3. Control Panel */}
      <div className="section control-panel">
        <h2 style={{fontSize: '18px', fontWeight: '500', marginBottom: '20px', letterSpacing: '1px'}}>CONTROL PANEL</h2>
        
        <div className="gauges-row">
          <FlowGauge label="Queue Density" value={85} color="var(--color-signal-red)" />
          <FlowGauge label="Flow Rate" value={60} color="var(--color-primary)" />
        </div>

        <div className="controls-grid">
          <button 
            className={`control-btn ${activeMode === 'auto' ? 'active' : ''}`}
            onClick={() => setActiveMode('auto')}
          >
            <Activity />
            Auto Mode
          </button>
          
          <button 
            className={`control-btn ${activeMode === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveMode('manual')}
          >
            <Zap />
            Force Green
          </button>
          
          <button 
            className={`control-btn ${activeMode === 'all-red' ? 'active' : ''} danger`}
            onClick={() => setActiveMode('all-red')}
          >
            <Disc />
            All Red
          </button>

           <button className="control-btn warning">
            <Pause />
            Suspend
          </button>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <span>TRAFFIC VOL (LAST HR)</span>
            <span style={{color: 'var(--color-primary)'}}>4,832 VEH</span>
          </div>
          {/* Chart Placeholder */}
          <div style={{height: '100%', display: 'flex', alignItems: 'end', gap: '4px', paddingBottom: '10px'}}>
             {/* Mock bars */}
             {[40, 60, 45, 70, 85, 60, 75, 50, 65, 80, 55, 90].map((h, i) => (
               <div key={i} style={{flex: 1, height: `${h}%`, backgroundColor: 'rgba(0, 242, 234, 0.2)', borderRadius: '2px'}}></div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JunctionDetails;
