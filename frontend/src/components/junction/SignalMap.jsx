import React from 'react';

const SignalMap = () => {
  return (
    <div className="signal-map-container" style={{ 
      width: '100%', 
      height: '300px', 
      position: 'relative',
      background: 'rgba(0,0,0,0.3)',
      borderRadius: '8px',
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Intersection Graphics */}
      <div style={{
        position: 'absolute',
        width: '60px',
        height: '100%',
        background: '#1a1d24',
        borderLeft: '2px dashed rgba(255,255,255,0.1)',
        borderRight: '2px dashed rgba(255,255,255,0.1)'
      }}></div>
      
      <div style={{
        position: 'absolute',
        height: '60px',
        width: '100%',
        background: '#1a1d24',
        borderTop: '2px dashed rgba(255,255,255,0.1)',
        borderBottom: '2px dashed rgba(255,255,255,0.1)'
      }}></div>

      {/* Signal Heads */}
      {/* North */}
      <div style={{
        position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
      }}>
        <div style={{width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-signal-red)', boxShadow: '0 0 10px var(--color-signal-red)'}}></div>
        <span style={{fontSize: '10px', fontWeight: 'bold'}}>34s</span>
      </div>

       {/* South */}
       <div style={{
        position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px'
      }}>
        <div style={{width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-signal-red)', boxShadow: '0 0 10px var(--color-signal-red)'}}></div>
         <span style={{fontSize: '10px', fontWeight: 'bold'}}>34s</span>
      </div>

      {/* East */}
      <div style={{
        position: 'absolute', right: '40px', top: '50%', transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
         <span style={{fontSize: '10px', fontWeight: 'bold'}}>12s</span>
        <div style={{width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-signal-green)', boxShadow: '0 0 10px var(--color-signal-green)'}}></div>
      </div>

       {/* West */}
       <div style={{
        position: 'absolute', left: '40px', top: '50%', transform: 'translateY(-50%)',
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <div style={{width: '20px', height: '20px', borderRadius: '50%', background: 'var(--color-signal-green)', boxShadow: '0 0 10px var(--color-signal-green)'}}></div>
        <span style={{fontSize: '10px', fontWeight: 'bold'}}>12s</span>
      </div>

      {/* Center Marker */}
      <div style={{
        width: '10px', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', zIndex: 10
      }}></div>

    </div>
  );
};

export default SignalMap;
