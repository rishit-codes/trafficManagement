import React from 'react';

const OptimizationPanel = () => {
  const phases = [
    { id: 1, name: 'N-S Straight', current: 45, optimal: 52 },
    { id: 2, name: 'E-W Straight', current: 35, optimal: 30 },
    { id: 3, name: 'All Right Turn', current: 20, optimal: 18 },
  ];

  return (
    <div className="detail-panel">
      <h4 className="panel-title">Webster Optimization Logic</h4>
      
      <div style={{ display: 'flex', gap: '32px', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #F3F4F6' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Current Cycle</div>
          <div style={{ fontSize: '24px', fontWeight: '600' }}>100s</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Optimized Cycle</div>
          <div style={{ fontSize: '24px', fontWeight: '600', color: '#059669' }}>100s</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#6B7280' }}>Objective</div>
          <div style={{ fontSize: '14px', fontWeight: '500', marginTop: '6px', color: '#059669' }}>Min. Delay (-12%)</div>
        </div>
      </div>

      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', color: '#6B7280', borderBottom: '1px solid #E5E7EB' }}>
            <th style={{ paddingBottom: '8px' }}>Phase</th>
            <th style={{ paddingBottom: '8px' }}>Current Green (g)</th>
            <th style={{ paddingBottom: '8px' }}>Optimized Green</th>
            <th style={{ paddingBottom: '8px' }}>Change</th>
          </tr>
        </thead>
        <tbody>
          {phases.map(p => (
            <tr key={p.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
              <td style={{ padding: '12px 0', fontWeight: '500' }}>{p.name}</td>
              <td style={{ padding: '12px 0' }}>{p.current}s</td>
              <td style={{ padding: '12px 0', fontWeight: '600' }}>{p.optimal}s</td>
              <td style={{ padding: '12px 0', color: p.optimal > p.current ? '#059669' : '#DC2626' }}>
                {p.optimal > p.current ? '+' : ''}{p.optimal - p.current}s
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OptimizationPanel;
