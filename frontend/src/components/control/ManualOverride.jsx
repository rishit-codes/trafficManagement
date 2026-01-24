import React, { useState } from 'react';
import './ControlPanel.css';

const ManualOverride = () => {
  const [selectedJunction, setSelectedJunction] = useState('j1');
  const [action, setAction] = useState('extend_green');
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = () => {
    setShowModal(true);
  };

  const [successMsg, setSuccessMsg] = useState('');

  const confirmAction = () => {
    console.log(`Applying ${action} to ${selectedJunction}`);
    // Simulate API call
    setTimeout(() => {
      setSuccessMsg(`Command Sent: ${action.replace('_', ' ').toUpperCase()}`);
      setShowModal(false);
      setTimeout(() => setSuccessMsg(''), 3000);
    }, 500);
  };

  return (
    <div>
      {successMsg && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          background: '#F0FDF4',
          color: '#166534',
          borderRadius: '6px',
          border: '1px solid #BBF7D0',
          fontWeight: '500',
          fontSize: '13px'
        }}>
          ✓ {successMsg}
        </div>
      )}
      <div className="control-form-group">
        <label className="control-label">Target Junction</label>
        <select
          className="control-select"
          value={selectedJunction}
          onChange={(e) => setSelectedJunction(e.target.value)}
        >
          <option value="j1">J-012: Alkapuri Circle</option>
          <option value="j2">J-008: Market Cross</option>
          <option value="j3">J-015: Station Road</option>
        </select>
      </div>

      <div className="control-form-group">
        <label className="control-label">Override Action</label>
        <div className="radio-group">
          <label className={`radio-option ${action === 'extend_green' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="action"
              value="extend_green"
              checked={action === 'extend_green'}
              onChange={(e) => setAction(e.target.value)}
            />
            Extended Green Phase (+30s)
          </label>
          <label className={`radio-option ${action === 'force_red' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="action"
              value="force_red"
              checked={action === 'force_red'}
              onChange={(e) => setAction(e.target.value)}
            />
            Force All Red (Stop Traffic)
          </label>
          <label className={`radio-option ${action === 'flash_yellow' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="action"
              value="flash_yellow"
              checked={action === 'flash_yellow'}
              onChange={(e) => setAction(e.target.value)}
            />
            Maintenance Mode (Flash Yellow)
          </label>
        </div>
      </div>

      <div style={{ marginTop: '24px' }}>
        <button className="btn btn-primary" onClick={handleSubmit}>
          Apply Override
        </button>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ marginBottom: '8px' }}>Confirm Override</h3>
            <p style={{ color: '#6B7280', fontSize: '14px' }}>
              Are you sure you want to apply this manual override? This will disrupt the current automated cycle.
            </p>
            <div className="modal-actions">
              <button className="btn btn-neutral" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmAction}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualOverride;
