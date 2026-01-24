import React, { useState } from 'react';
import { useTraffic } from '../../context/TrafficContext';
import './ControlPanel.css';

const EmergencyMode = () => {
  // Local state for independent simulation
  const [isActive, setIsActive] = useState(false);
  const [vehicleId, setVehicleId] = useState('AMB-01');
  const [selectedRoute, setSelectedRoute] = useState('hospital_express');
  const [showConfirm, setShowConfirm] = useState(false);

  // Restore state on mount
  React.useEffect(() => {
      const savedCmd = localStorage.getItem('traffic_override_cmd');
      if (savedCmd) {
          try {
              const parsed = JSON.parse(savedCmd);
              // Only restore if it's an emergency command and recent (< 10 mins?? actually keep it until reset)
              if (parsed.type === 'emergency_corridor') {
                  setIsActive(true);
                  if (parsed.vehicleId) setVehicleId(parsed.vehicleId);
                  if (parsed.routeStrategy) setSelectedRoute(parsed.routeStrategy);
              }
          } catch (e) {
              console.error("Failed to restore emergency state", e);
          }
      }
  }, []);

  const toggleEmergency = () => {
    if (isActive) {
      // Deactivate
      setIsActive(false);
      const payload = { type: 'reset', junctionId: 'all', timestamp: Date.now() };
      window.dispatchEvent(new CustomEvent('signal-override', { detail: payload }));
      localStorage.setItem('traffic_override_cmd', JSON.stringify(payload));
    } else {
      setShowConfirm(true);
    }
  };

  const confirmActivation = () => {
    setIsActive(true);
    setShowConfirm(false);
    
    // Simulate Smart Routing
    const payload = {
        type: 'emergency_corridor',
        junctionId: 'all', // Apply to network
        vehicleId: vehicleId,
        routeStrategy: selectedRoute, // 'hospital_express', 'main_street'
        timestamp: Date.now()
    };

    // Dispatch & Persist
    window.dispatchEvent(new CustomEvent('signal-override', { detail: payload }));
    localStorage.setItem('traffic_override_cmd', JSON.stringify(payload));
  };

  return (
    <div>
      {!isActive ? (
        <>
          <div className="control-form-group">
            <label className="control-label">Emergency Vehicle</label>
            <select
              className="control-select"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
            >
              <option value="AMB-01">🚑 Ambulance (AMB-01)</option>
              <option value="AMB-04">🚑 Ambulance (AMB-04)</option>
              <option value="FIRE-01">🚒 Fire Brigade (Station 1)</option>
              <option value="POLICE-99">🚓 Police Convoy (VIP)</option>
            </select>
          </div>

          <div className="control-form-group">
            <label className="control-label">Priority Route</label>
            <select
              className="control-select"
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
            >
              <option value="hospital_express">🏥 Hospital Express (Station Rd → City Hospital)</option>
              <option value="city_center">🏙️ City Center Outbound (Main St → Highway)</option>
              <option value="industrial_zone">🏭 Industrial Response (Ring Road)</option>
            </select>
          </div>

          <div className="control-form-group">
            <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '4px', fontSize: '13px', color: '#991B1B' }}>
              <strong>AI Analysis:</strong> Green Wave possible.
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Est. time saved: 8 mins</div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button className="btn btn-danger" onClick={toggleEmergency}>
              ⚠ ACTIVATE GREEN CORRIDOR
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0', animation: 'pulse 2s infinite' }}>
          <div style={{ width: '80px', height: '80px', background: '#DC2626', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)' }}>
            <span style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>🚑</span>
          </div>
          <h3 style={{ color: '#991B1B', marginBottom: '8px' }}>GREEN CORRIDOR ACTIVE</h3>
          <p style={{ color: '#7F1D1D', marginBottom: '4px', fontWeight: '500' }}>Vehicle: {vehicleId}</p>
          <p style={{ color: '#7F1D1D', marginBottom: '24px', fontSize: '13px'}}>Route: {selectedRoute.replace('_', ' ').toUpperCase()}</p>
          
          <button className="btn btn-neutral" onClick={toggleEmergency} style={{ borderColor: '#DC2626', color: '#DC2626', background: 'white' }}>
            Deactivate & Restore
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ borderTop: '4px solid #DC2626' }}>
            <h3 style={{ marginBottom: '8px', color: '#991B1B' }}>Confirm Emergency Corridor</h3>
            <p style={{ color: '#4B5563', fontSize: '14px' }}>
              This will override signals to create a <strong>Green Wave</strong> for {vehicleId}. Cross-traffic will be stopped immediately.
            </p>
            <div className="modal-actions">
              <button className="btn btn-neutral" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmActivation} style={{ width: 'auto' }}>
                Confirm Activation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyMode;
