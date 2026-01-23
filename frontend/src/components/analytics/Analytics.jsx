import React, { useState, useEffect, useRef } from 'react';
import PerformanceSummary from './PerformanceSummary';
import ComparisonCharts from './ComparisonCharts';
import TimePatterns from './TimePatterns';
import ForecastPanel from './ForecastPanel';
import { getJunctions, getPerformanceMetrics } from '../../services/api';
import './Analytics.css';

const Analytics = () => {
  const [junctions, setJunctions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(7); // Default 7 days
  const [isLiveUpdating, setIsLiveUpdating] = useState(true); // Enable real-time updates
  const pollIntervalRef = useRef(null);

  // 1. Initial Load: Get list of junctions
  useEffect(() => {
    const init = async () => {
       try {
         const data = await getJunctions();
         const list = data.junctions || data; 
         
         if (list && list.length > 0) {
           setJunctions(list);
           setSelectedId(list[0].id); // Select first by default
         }
       } catch (err) {
         console.error("Failed to load junction list", err);
       }
    };
    init();
  }, []);

  // 2. Fetch Metrics when selection or range changes
  useEffect(() => {
    if (!selectedId) return;

    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const data = await getPerformanceMetrics(selectedId, timeRange);
        setMetrics(data);
      } catch (err) {
        console.error("Failed to load performance metrics", err);
        setMetrics(null);
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchMetrics();

    // Set up polling for real-time updates every 15 seconds
    if (isLiveUpdating) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      
      pollIntervalRef.current = setInterval(() => {
        fetchMetrics();
      }, 15000); // Update every 15 seconds for real-time feel
    }

    // Cleanup
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [selectedId, timeRange, isLiveUpdating]);

  return (
    <div className="analytics-container">
      {/* 1. Page Header */}
      <div className="analytics-header">
        <div>
          <h2 className="analytics-title">System Performance Analytics</h2>
          <p className="analytics-subtitle">Evaluating traffic efficiency and congestion reduction</p>
          
          {/* Junction Selector */}
          <div style={{ marginTop: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              {junctions.length > 0 && (
                <select 
                    className="junction-select"
                    value={selectedId || ''} 
                    onChange={(e) => setSelectedId(e.target.value)}
                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F9FAFB' }}
                >
                    {junctions.map(j => (
                        <option key={j.id} value={j.id}>{j.name} ({j.id})</option>
                    ))}
                </select>
              )}
              {/* Live Update Toggle */}
              <button
                onClick={() => setIsLiveUpdating(!isLiveUpdating)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  background: isLiveUpdating ? '#10B981' : '#F9FAFB',
                  color: isLiveUpdating ? 'white' : '#6B7280',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500
                }}
              >
                {isLiveUpdating ? '● Live' : 'Live'}
              </button>
          </div>
        </div>
        
        <div className="time-selector">
          <button 
            className={`time-option ${timeRange === 1 ? 'active' : ''}`}
            onClick={() => setTimeRange(1)}
          >
            Today
          </button>
          <button 
            className={`time-option ${timeRange === 7 ? 'active' : ''}`}
            onClick={() => setTimeRange(7)}
          >
            7 Days
          </button>
          <button 
            className={`time-option ${timeRange === 30 ? 'active' : ''}`}
            onClick={() => setTimeRange(30)}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* 2. Top KPIs */}
      <section className="analytics-section">
        <PerformanceSummary data={metrics} loading={loading} />
      </section>

      {/* 3. Main Comparison Chart */}
      <section className="analytics-section">
        <h3 className="section-title">Wait Time Comparison (GeoFlow vs. Fixed Signal)</h3>
        {/* Placeholder for now until chart is dynamic */}
        {metrics ? <ComparisonCharts data={metrics} /> : <div className="chart-placeholder">Select a junction to view comparison</div>}
      </section>

      {/* 4. Secondary Insights Row */}
      <section className="analytics-section insights-row">
        <div className="insight-column">
          <h3 className="section-title">Adaptive Peak Handling</h3>
          <TimePatterns junctionId={selectedId} />
        </div>
        <div className="insight-column">
          <h3 className="section-title">Predictive Insight (Next 60m)</h3>
          <ForecastPanel junctionId={selectedId} />
        </div>
      </section>
    </div>
  );
};

export default Analytics;
