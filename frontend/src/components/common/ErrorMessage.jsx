import React from 'react';
import PropTypes from 'prop-types';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Button from './Button';
import './ErrorMessage.css';

/**
 * ErrorMessage Component
 * 
 * Displays inline error messages with optional retry functionality.
 * 
 * @example
 * <ErrorMessage 
 *   error={{ message: 'Failed to load data' }}
 *   retry={() => refetch()}
 * />
 */
const ErrorMessage = ({ 
  error, 
  retry,
  title = 'Error',
  className = ''
}) => {
  const message = error?.message || 'An unexpected error occurred.';

  return (
    <div className={`error-message-container ${className}`} role="alert">
      <div className="error-message-icon">
        <AlertCircle size={20} />
      </div>
      <div className="error-message-content">
        <span className="error-message-title">{title}</span>
        <span className="error-message-text">{message}</span>
      </div>
      {retry && (
        <Button 
          variant="ghost" 
          size="small"
          icon={RefreshCw}
          onClick={retry}
          ariaLabel="Retry"
        >
          Retry
        </Button>
      )}
    </div>
  );
};

ErrorMessage.propTypes = {
  /** Error object with message property */
  error: PropTypes.shape({
    message: PropTypes.string,
  }),
  /** Retry function */
  retry: PropTypes.func,
  /** Error title */
  title: PropTypes.string,
  /** Additional CSS classes */
  className: PropTypes.string,
};

export default ErrorMessage;
