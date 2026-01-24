import React, { useState } from 'react';
import { useTraffic } from '../../context/TrafficContext';
import './ControlPanel.css';

const EmergencyMode = () => {
  const { emergencyMode, activateEmergency, deactivateEmergency } = useTraffic();
  const active = emergencyMode.active;
  const [type, setType] = useState('ambulance');
  const [showConfirm, setShowConfirm] = useState(false);

  const toggleEmergency = () => {
    if (active) {
      deactivateEmergency();
    } else {
      setShowConfirm(true);
    }
  };

  const confirmActivation = () => {
    // Hardcoded route logic for demo
    const routeIds = ['J004', 'J002', 'J003']; // Manjalpur -> Sayaji -> Fatehgunj
    activateEmergency(type, routeIds);
    setShowConfirm(false);
  };

  return (
    <div>
      {!active ? (
        <>
          <div className="control-form-group">
            <label className="control-label">Emergency Type</label>
            <select
              className="control-select"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="ambulance">Ambulance / Medical</option>
              <option value="fire">Fire Brigade</option>
              <option value="vip">VIP Protocol (Convoy)</option>
            </select>
          </div>

          <div className="control-form-group">
            <label className="control-label">Corridor route</label>
            <div style={{ padding: '12px', background: '#F3F4F6', borderRadius: '4px', fontSize: '13px', color: '#374151' }}>
              <strong>Detected Route:</strong> Station Rd → Main St → City Hospital
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Est. Clearance: 4 mins</div>
            </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <button className="btn btn-danger" onClick={toggleEmergency}>
              ⚠ ACTIVATE EMERGENCY MODE
            </button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: '80px', height: '80px', background: '#DC2626', borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(220, 38, 38, 0.5)' }}>
            <span style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>!</span>
          </div>
          <h3 style={{ color: '#991B1B', marginBottom: '8px' }}>EMERGENCY ACTIVE</h3>
          <p style={{ color: '#7F1D1D', marginBottom: '24px' }}>Configuring Green Wave for {type.toUpperCase()}...</p>
          <button className="btn btn-neutral" onClick={() => setActive(false)} style={{ borderColor: '#DC2626', color: '#DC2626' }}>
            Deactivate / Safe
          </button>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ borderTop: '4px solid #DC2626' }}>
            <h3 style={{ marginBottom: '8px', color: '#991B1B' }}>Confirm Emergency Activation</h3>
            <p style={{ color: '#4B5563', fontSize: '14px' }}>
              This will override all signals along the <strong>{type} route</strong> to GREEN instantly. Cross-traffic will be stopped. Proceed?
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
