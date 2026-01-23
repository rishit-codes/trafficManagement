import React, { useState } from 'react';
import './ControlPanel.css';

const SystemActions = () => {
  const [loading, setLoading] = useState(false);

  const handleGlobalOptimize = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log('Global optimization applied');
    }, 1500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>Global Optimization</div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Apply Webster logic to all junctions</div>
        </div>
        <button className="btn btn-primary" onClick={handleGlobalOptimize} disabled={loading}>
          {loading ? 'Applying...' : 'Run Optimize'}
        </button>
      </div>

      <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>System Reset</div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Revert to fixed-time backup schedule</div>
        </div>
        <button className="btn btn-neutral" style={{ fontSize: '12px' }}>
          Restore Defaults
        </button>
      </div>
    </div>
  );
};

export default SystemActions;
