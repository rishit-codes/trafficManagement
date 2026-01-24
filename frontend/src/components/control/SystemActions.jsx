import React, { useState } from 'react';
import './ControlPanel.css';

const SystemActions = () => {
  const [loading, setLoading] = useState(false);

  const handleGlobalOptimize = () => {
    setLoading(true);
    
    // Dispatch Optimize Command
    const payload = { 
        junctionId: 'all',
        type: 'optimize', 
        timestamp: Date.now()
    };
    
    // 1. Live Event
    window.dispatchEvent(new CustomEvent('signal-override', { detail: payload }));
    // 2. Persist
    localStorage.setItem('traffic_override_cmd', JSON.stringify(payload));

    setTimeout(() => {
      setLoading(false);
      console.log('Global optimization signal sent');
    }, 1000);
  };

  const handleSystemReset = () => {
      const payload = { 
          junctionId: 'all',
          type: 'reset', 
          timestamp: Date.now()
      };
      window.dispatchEvent(new CustomEvent('signal-override', { detail: payload }));
      localStorage.setItem('traffic_override_cmd', JSON.stringify(payload));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ padding: '12px', border: '1px solid #E5E7EB', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Synchronize network timing</div>
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
        <button className="btn btn-neutral" style={{ fontSize: '12px' }} onClick={handleSystemReset}>
          Restore Defaults
        </button>
      </div>
    </div>
  );
};

export default SystemActions;
