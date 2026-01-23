import React from 'react';
import PerformanceSummary from './PerformanceSummary';
import ComparisonCharts from './ComparisonCharts';
import TimePatterns from './TimePatterns';
import ForecastPanel from './ForecastPanel';
import './Analytics.css';

const Analytics = () => {
  return (
    <div className="analytics-container">
      {/* 1. Page Header */}
      <div className="analytics-header">
        <div>
          <h2 className="analytics-title">System Performance Analytics</h2>
          <p className="analytics-subtitle">Evaluating traffic efficiency and congestion reduction</p>
        </div>
        
        <div className="time-selector">
          <button className="time-option active">Today</button>
          <button className="time-option">7 Days</button>
          <button className="time-option">30 Days</button>
        </div>
      </div>

      {/* 2. Top KPIs */}
      <section className="analytics-section">
        <PerformanceSummary />
      </section>

      {/* 3. Main Comparison Chart */}
      <section className="analytics-section">
        <h3 className="section-title">Wait Time Comparison (GeoFlow vs. Fixed Signal)</h3>
        <ComparisonCharts />
      </section>

      {/* 4. Secondary Insights Row */}
      <section className="analytics-section insights-row">
        <div className="insight-column">
          <h3 className="section-title">Adaptive Peak Handling</h3>
          <TimePatterns />
        </div>
        <div className="insight-column">
          <h3 className="section-title">Predictive Insight (Next 60m)</h3>
          <ForecastPanel />
        </div>
      </section>
    </div>
  );
};

export default Analytics;
