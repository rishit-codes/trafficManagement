import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from './Button';
import './ErrorBoundary.css';

/**
 * ErrorBoundary Component
 * 
 * Catches React errors and displays user-friendly error message.
 * Logs errors to console in development.
 * 
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log error in development
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary] Caught error:', error);
      console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
    }

    // In production, send to error tracking service
    // e.g., Sentry.captureException(error, { extra: errorInfo });
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <div className="error-icon">
              <AlertTriangle size={64} />
            </div>
            
            <h1 className="error-title">Something went wrong</h1>
            
            <p className="error-message">
              {this.state.error?.message || 'An unexpected error occurred. Please try refreshing the page.'}
            </p>

            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre>{this.state.error?.stack}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}

            <div className="error-actions">
              <Button 
                variant="primary" 
                icon={RefreshCw}
                onClick={this.handleRefresh}
              >
                Refresh Page
              </Button>
              <Button 
                variant="secondary" 
                icon={Home}
                onClick={this.handleGoHome}
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
