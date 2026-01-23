import React from 'react';

const SignalVisualization = () => {
  return (
    <div className="detail-panel" style={{ alignItems: 'center', justifyContent: 'center', background: '#111827', color: 'white', border: 'none' }}>
      
      <div style={{ fontSize: '12px', color: '#9CA3AF', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Live Signal State
      </div>

      <div style={{ 
        background: '#1F2937', 
        padding: '20px', 
        borderRadius: '16px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Red Light */}
        <div style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          background: '#374151',
          boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)'
        }}></div>

        {/* Yellow Light */}
        <div style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          background: '#374151',
          boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.6)'
        }}></div>

        {/* Green Light (Active) */}
        <div style={{ 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          background: '#10B981',
          boxShadow: '0 0 20px 5px rgba(16, 185, 129, 0.4)'
        }}></div>
      </div>

      <div style={{ fontSize: '32px', fontWeight: '700', marginTop: '24px', fontFamily: 'monospace' }}>
        00:42
      </div>
      <div style={{ fontSize: '13px', color: '#10B981', marginTop: '4px' }}>
        Phase 1: N-S Straight
      </div>
      
    </div>
  );
};

export default SignalVisualization;
