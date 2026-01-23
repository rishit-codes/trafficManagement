import React from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner';
import './PageLoader.css';

/**
 * PageLoader Component
 * 
 * Full-page loading overlay for route transitions and initial data loads.
 * 
 * @example
 * {isLoading && <PageLoader text="Loading dashboard..." />}
 */
const PageLoader = ({ text = 'Loading...' }) => {
  return (
    <div className="page-loader" role="status" aria-live="polite">
      <div className="page-loader-content">
        <LoadingSpinner size="large" />
        <p className="page-loader-text">{text}</p>
      </div>
    </div>
  );
};

PageLoader.propTypes = {
  /** Loading text to display */
  text: PropTypes.string,
};

export default PageLoader;
