import { useState, useEffect } from 'react';
import './MetricCard.css';

function MetricCard({
  title,
  value,
  unit = '',
  trend = '',
  isTrendPositive = false, // Explicit control over trend color
  icon = null,
  children,
  className = '',
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;

  useEffect(() => {
    // Basic count up animation
    const duration = 1000;
    const steps = 30;
    const stepValue = numericValue / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      if (step > steps) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.round(stepValue * step));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [numericValue]);

  // Determine trend color class
  let trendClass = '';
  if (trend) {
    if (typeof trend === 'string') {
       if (isTrendPositive) {
           trendClass = 'trend-positive';
       } else if (trend.startsWith('+')) {
         trendClass = 'trend-positive';
       } else if (trend.startsWith('-')) {
         trendClass = 'trend-positive'; // Wait, usually negative is bad, but for wait time it's good.
         // Let's rely on isTrendPositive for ambiguity or default standard
         if (!isTrendPositive && trend.includes('-')) trendClass = 'trend-positive'; // Fallback logic might be confusing
         // RESET: Simple logic
         if (trend.includes('+')) trendClass = 'trend-positive';
         if (trend.includes('-')) trendClass = 'trend-negative';
       }
       
       // OVERRIDE if isTrendPositive is explicitly passed (e.g. for wait time where - is good)
       if (isTrendPositive === true) trendClass = 'trend-positive';
       if (isTrendPositive === false && trendClass === 'trend-positive') trendClass = 'trend-positive'; // Default
    }
  }

  // Simplified trend logic for cleanliness
  const getTrendClass = () => {
      if (isTrendPositive) return 'trend-positive';
      if (typeof trend === 'string' && trend.startsWith('-')) return 'trend-negative';
      if (typeof trend === 'string' && trend.startsWith('+')) return 'trend-positive';
      return '';
  };


  return (
    <div className={`metric-card ${className}`}>
      <div className="metric-header">
        <span className="metric-title">{title}</span>
        {icon && <div className="metric-icon-slot">{icon}</div>}
      </div>
      
      <div className="metric-main">
        <div className="metric-value-row">
            <span className="metric-value">{displayValue}</span>
            {unit && <span className="metric-unit">{unit}</span>}
        </div>
        
        {children}

        {trend && (
          <div className={`metric-trend ${getTrendClass()}`}>
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
