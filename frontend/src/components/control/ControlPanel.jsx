import React from 'react';
import ManualOverride from './ManualOverride';
import EmergencyMode from './EmergencyMode';
import SystemActions from './SystemActions';
import './ControlPanel.css';

const ControlPanel = () => {
  return (
    <div className="control-container">
      {/* 1. Page Header */}
      {/* 1. Page Header */}
      <div className="control-header">
        <div>
          <h2 className="control-title">Control Panel</h2>
          <p className="control-subtitle">Operational controls for signal management and emergencies</p>
        </div>
        <div className="live-indicator-badge">
          ● SYSTEM ONLINE
        </div>
      </div>

      <div className="control-grid">
        {/* Left Column: Manual & System */}
        <div className="control-column">
          <section className="control-section">
            <h3 className="section-title">Manual Signal Override</h3>
            <ManualOverride />
          </section>

          <section className="control-section">
            <h3 className="section-title">System Actions</h3>
            <SystemActions />
          </section>
        </div>

        {/* Right Column: Emergency (Critical) */}
        <div className="control-column">
          <section className="control-section">
            <h3 className="section-title critical-text">Emergency Mode</h3>
            <div className="control-row">
              <button className="btn-manual override-btn" onClick={() => {
                fetch('http://localhost:8000/api/emergency/trigger', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ambulance_id: "AMB-01",
                    route: ["J001", "J002"]
                  })
                });
              }}>
                🚑 Trigger Ambulance (J001)
              </button>
            </div>
            {/* <EmergencyMode /> */}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
