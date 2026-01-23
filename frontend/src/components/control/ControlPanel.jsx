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
        <div className="warning-banner" style={{ background: '#FEE2E2', color: '#991B1B', border: '1px solid #F87171' }}>
           ⚠ Manual Control Disabled
        </div>
      </div>

      {/* SAFETY NOTICE - Verified Backend Requirement */}
      <div className="safety-notice-box" style={{ 
          background: '#FFF5F5', 
          border: '1px solid #FED7D7', 
          borderRadius: '8px', 
          padding: '16px', 
          marginBottom: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
      }}>
          <h4 style={{ margin: 0, color: '#C53030', fontSize: '15px', fontWeight: '600' }}>Safety Interlock Active</h4>
          <p style={{ margin: 0, color: '#2D3748', fontSize: '14px', lineHeight: '1.5' }}>
            Manual signal overrides are disabled for this pilot deployment until validated controller feedback is available. 
            This prevents unverified commands from being sent to live junctions.
          </p>
      </div>

      {/* 
         CRITICAL SAFETY ENFORCEMENT:
         Disable all interactions locally. Events blocked. Opacity reduced.
      */}
      <div className="control-grid" style={{ 
          opacity: 0.6, 
          pointerEvents: 'none', 
          filter: 'grayscale(10%)' 
      }}>
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
