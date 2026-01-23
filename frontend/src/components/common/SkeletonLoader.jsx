import React from 'react';
import PropTypes from 'prop-types';
import './SkeletonLoader.css';

/**
 * SkeletonLoader Component
 * 
 * Animated placeholder for loading states that matches content shape.
 * 
 * @example
 * // Metric cards skeleton
 * <SkeletonLoader type="metric" count={4} />
 * 
 * // Table skeleton
 * <SkeletonLoader type="table" count={5} />
 */
const SkeletonLoader = ({ 
  type = 'card', 
  count = 1,
  className = ''
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'metric':
        return (
          <div className="skeleton skeleton-metric">
            <div className="skeleton-header">
              <div className="skeleton-line skeleton-line-sm"></div>
              <div className="skeleton-circle"></div>
            </div>
            <div className="skeleton-line skeleton-line-lg"></div>
            <div className="skeleton-line skeleton-line-md"></div>
          </div>
        );

      case 'card':
        return (
          <div className="skeleton skeleton-card">
            <div className="skeleton-line skeleton-line-lg"></div>
            <div className="skeleton-line skeleton-line-md"></div>
            <div className="skeleton-line skeleton-line-sm"></div>
          </div>
        );

      case 'table':
        return (
          <div className="skeleton skeleton-table-row">
            <div className="skeleton-line skeleton-line-md"></div>
            <div className="skeleton-line skeleton-line-sm"></div>
            <div className="skeleton-line skeleton-line-sm"></div>
            <div className="skeleton-line skeleton-line-xs"></div>
          </div>
        );

      case 'chart':
        return (
          <div className="skeleton skeleton-chart">
            <div className="skeleton-chart-bars">
              {[40, 65, 50, 80, 70, 55, 90, 60, 75].map((height, i) => (
                <div 
                  key={i} 
                  className="skeleton-bar" 
                  style={{ height: `${height}%` }}
                ></div>
              ))}
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="skeleton skeleton-text">
            <div className="skeleton-line skeleton-line-full"></div>
            <div className="skeleton-line skeleton-line-lg"></div>
            <div className="skeleton-line skeleton-line-md"></div>
          </div>
        );

      default:
        return (
          <div className="skeleton skeleton-card">
            <div className="skeleton-line skeleton-line-lg"></div>
            <div className="skeleton-line skeleton-line-md"></div>
          </div>
        );
    }
  };

  return (
    <div className={`skeleton-container ${className}`} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

SkeletonLoader.propTypes = {
  /** Type of skeleton to display */
  type: PropTypes.oneOf(['card', 'table', 'chart', 'metric', 'text']),
  /** Number of skeleton items to render */
  count: PropTypes.number,
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default SkeletonLoader;
