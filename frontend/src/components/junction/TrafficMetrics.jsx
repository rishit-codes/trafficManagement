import React, { useState, useEffect } from 'react';
import './JunctionDetail.css'; // Re-use main styles or specific ones

const TrafficMetrics = ({ state, trafficData }) => {
  // Derive metrics from the unified central traffic engine
  // Default values to prevent crash if data not yet passed
  
  if (!trafficData) return <div className="detail-panel loading-metrics">Loading Real-Time Metrics...</div>;

  // Calculate Aggregates
  const nsPCU = trafficData.north.pcu + trafficData.south.pcu;
  const ewPCU = trafficData.east.pcu + trafficData.west.pcu;
  const avgSpeed = Math.round((trafficData.north.speed + trafficData.south.speed + trafficData.east.speed + trafficData.west.speed) / 4);
  const totalQueue = trafficData.north.queue + trafficData.south.queue + trafficData.east.queue + trafficData.west.queue;

  // Derived KPIs
  // Efficiency inversely correlated to queue length (approx)
  const efficiency = Math.max(60, Math.min(99, 100 - totalQueue));
  // Wait Time correlated to total density
  const waitTime = Math.round((totalQueue * 1.5) + 20);

  // Simple prediction simulation based on time of day
  const getPrediction = () => {
    const hour = new Date().getHours();
    if (hour < 9) return { text: "Morning Peak approaching (+15% flow)", trend: 'up' };
    if (hour >= 9 && hour < 11) return { text: "Peak traffic subsiding (-5% flow)", trend: 'down' };
    if (hour >= 17 && hour < 20) return { text: "Evening Rush Hour Active", trend: 'stable' };
    return { text: "Traffic flow stable (Off-Peak)", trend: 'stable' };
  };

  const prediction = getPrediction();

  return (
    <div className="metric-panel-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
      
      {/* 1. Flow Capacity Analysis */}
      <div className="detail-panel" style={{ flex: 1 }}>
        <h4 className="panel-title">Flow Capacity (PCU/hr)</h4>
        <div className="metrics-grid-inner">
          <div className="metric-gauge-card">
            <div className="direction-label">NORTH–SOUTH</div>
            <div className="gauge-val val-green">{Math.round(nsPCU * 20).toLocaleString()}</div>
            <div className="gauge-sub">
              <span className="trend-arrow up">↑</span> {Math.round((nsPCU/150)*100)}% Capacity
            </div>
          </div>
          <div className="metric-gauge-card">
            <div className="direction-label">EAST–WEST</div>
            <div className="gauge-val val-amber">{Math.round(ewPCU * 20).toLocaleString()}</div>
            <div className="gauge-sub">
              <span className="trend-arrow up">↑</span> {Math.round((ewPCU/150)*100)}% Capacity
            </div>
          </div>
        </div>
      </div>

      {/* 2. System Efficiency & Wait Time */}
      <div className="detail-panel" style={{ flex: 1 }}>
        <h4 className="panel-title">System Performance</h4>
        <div className="metrics-row-compact" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          
          <div className="mini-metric">
            <label>Avg Speed</label>
            <div className="mini-val">{avgSpeed} km/h</div>
            <div className="mini-bar-bg"><div className="mini-bar-fill" style={{ width: `${(avgSpeed/60)*100}%`, background: '#3B82F6' }}></div></div>
          </div>

          <div className="mini-metric">
            <label>Efficiency</label>
            <div className="mini-val" style={{ color: '#10B981' }}>{efficiency}%</div>
            <div className="mini-bar-bg"><div className="mini-bar-fill" style={{ width: `${efficiency}%`, background: '#10B981' }}></div></div>
          </div>

          <div className="mini-metric" style={{ gridColumn: 'span 2' }}>
            <label>Avg Wait Time</label>
            <div className="mini-val" style={{ color: waitTime > 60 ? '#EF4444' : '#F59E0B' }}>
              {waitTime}s
            </div>
            <span style={{ fontSize: '10px', color: '#6B7280' }}>Estimated delay per vehicle</span>
          </div>

        </div>
      </div>

      {/* 3. Predictive Analytics */}
      <div style={{ padding: '12px', background: '#F0F9FF', borderRadius: '8px', borderLeft: '4px solid #0EA5E9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#0369A1', textTransform: 'uppercase' }}>AI FORECAST</p>
          <span style={{ fontSize: '10px', fontWeight: '600', color: '#0284C7' }}>Next 30 mins</span>
        </div>
        <p style={{ fontSize: '13px', color: '#0C4A6E', fontWeight: '500' }}>
          {prediction.text}
        </p>
      </div>

    </div>
  );
};

export default TrafficMetrics;
