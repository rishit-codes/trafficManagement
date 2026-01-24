import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const MultiModalPanel = ({ junctionId }) => {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/multimodal/status/${junctionId}`);
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        // Silent fail
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 2000); // Fast poll for priority
    return () => clearInterval(interval);
  }, [junctionId]);

  if (!status || !status.active) return null;

  const isCritical = status.priority_level === 'CRITICAL';
  
  return (
    <div className={`dashboard-card multimodal-card ${isCritical ? 'critical-priority' : 'high-priority'}`}>
      <div className="priority-header">
        <span className="priority-icon">
            {status.type === 'BUS_PRIORITY' ? '🚌' : '🚶'}
        </span>
        <div className="priority-info">
            <h4>{status.type.replace('_', ' ')}</h4>
            <span className="priority-reason">{status.reason}</span>
        </div>
        <div className="priority-action">
            {status.action.replace(/_/g, ' ')}
        </div>
      </div>
    </div>
  );
};

export default MultiModalPanel;
