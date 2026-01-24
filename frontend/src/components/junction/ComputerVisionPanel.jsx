import React, { useState, useEffect } from 'react';
import './JunctionDetail.css';

const ComputerVisionPanel = ({ signalState, trafficData }) => {
  // Derive aggregate metrics from the centralized traffic state
  // trafficData is expected to be object { north: {...}, south: {...} ... }
  
  if (!trafficData) return <div className="cv-panel loading">Loading Vision System...</div>;

  // Calculate System Averages
  const totalPCU = trafficData.north.pcu + trafficData.south.pcu + trafficData.east.pcu + trafficData.west.pcu;
  const avgSpeed = Math.round((trafficData.north.speed + trafficData.south.speed + trafficData.east.speed + trafficData.west.speed) / 4);
  const totalQueue = trafficData.north.queue + trafficData.south.queue + trafficData.east.queue + trafficData.west.queue;
  
  // Determine dominant congestion status
  let congestionStatus = 'LOW';
  if (totalQueue > 30) congestionStatus = 'HIGH';
  else if (totalQueue > 15) congestionStatus = 'MEDIUM';

  const totalVehicles = totalPCU * 12; // Mock hourly throughput based on current PCU snapshot

  return (
    <div className="detail-panel cv-panel" style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <div className="panel-header-row">
        <h4 className="panel-title">AI Traffic Analysis</h4>
        <span className="live-tag"><span className="pulse-dot-small"></span> LIVE</span>
      </div>

      <div className="cv-metrics-grid" style={{
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '12px',
          marginTop: '12px',
          flex: 1
      }}>
        {/* Speed */}
        <div className="cv-metric-box">
            <span className="cv-label">Avg Speed</span>
            <div className="cv-value">{avgSpeed} <span className="cv-unit">km/h</span></div>
        </div>

        {/* Queue */}
        <div className="cv-metric-box">
            <span className="cv-label">Queue Depth</span>
            <div className="cv-value">{totalQueue} <span className="cv-unit">veh</span></div>
        </div>

        {/* Congestion */}
        <div className="cv-metric-box" style={{gridColumn: 'span 2'}}>
            <span className="cv-label">Congestion Level</span>
            <div className="cv-status-bar">
                <span className={`cv-status-badge status-${congestionStatus.toLowerCase()}`}>
                    {congestionStatus} DENSITY
                </span>
            </div>
        </div>
        
        {/* Active Vehicles Detected */}
        <div className="cv-metric-box" style={{gridColumn: 'span 2', background: '#F0F9FF', border: '1px solid #BAE6FD'}}>
             <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span className="cv-label" style={{color:'#0369A1'}}>Vehicles Detected (Hour)</span>
                <span className="cv-value-sm">{Math.round(totalVehicles)}</span>
             </div>
        </div>

      </div>
    </div>
  );
};

export default ComputerVisionPanel;
