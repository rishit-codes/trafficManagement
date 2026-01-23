import React from 'react';
import ManualOverride from './ManualOverride';
import EmergencyMode from './EmergencyMode';
import SystemActions from './SystemActions';
import './ControlPanel.css';

const ControlPanel = () => {
  return (
    <div className="control-container">
      {/* 1. Page Header */}
      <div className="control-header">
        <div>
          <h2 className="control-title">Control Panel</h2>
          <p className="control-subtitle">Operational controls for signal management and emergencies</p>
        </div>
        <div className="warning-banner">
          ⚠️ Actions on this page affect live traffic systems
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
            <EmergencyMode />
          </section>
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;
