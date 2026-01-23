import React, { useEffect, useState } from 'react';
import { getVisionMetrics } from '../../services/api';
import './LiveMonitoring.css'; // Utilizing existing monitoring styles

const VisionStatusCard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    try {
      const data = await getVisionMetrics();
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError("Vision system unavailable");
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Poll every 5 seconds
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (error || !metrics) return 'gray';
    return metrics.real_time_capable ? 'green' : 'amber';
  };

  const getStatusText = () => {
    if (error) return 'OFFLINE';
    if (!metrics) return 'CONNECTING...';
    return metrics.real_time_capable ? 'REAL-TIME' : 'DEGRADED';
  };

  return (
    <div className="dashboard-card vision-status-card">
        <div className="vision-card-header">
            <h3 className="panel-title">Vision System Status</h3>
            <span className={`status-badge status-${getStatusColor()}`}>
                {getStatusText()}
            </span>
        </div>

        <div className="vision-metrics-grid">
            <div className="vision-metric">
                <span className="metric-label">Model</span>
                <span className="metric-value">{metrics ? metrics.model : '--'}</span>
            </div>
            
            <div className="vision-metric">
                <span className="metric-label">Inference Latency</span>
                <span className="metric-value">
                    {metrics ? `${metrics.avg_inference_time_ms} ms` : '--'}
                </span>
            </div>

            <div className="vision-metric">
                <span className="metric-label">Processing Rate</span>
                <span className="metric-value">
                    {metrics ? `${metrics.avg_fps} FPS` : '--'}
                </span>
            </div>
            
             <div className="vision-metric">
                <span className="metric-label">Total Frames</span>
                <span className="metric-value">
                    {metrics ? metrics.frames_processed.toLocaleString() : '--'}
                </span>
            </div>
        </div>
        
        <div className="vision-footer">
            <p>
                Metrics reflect operational runtime performance. 
                Model accuracy is evaluated offline on standard datasets.
            </p>
        </div>
    </div>
  );
};

export default VisionStatusCard;
