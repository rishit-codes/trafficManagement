import axios from 'axios';

/**
 * API Configuration
 * 
 * Axios instance with interceptors for:
 * - Request logging and auth token injection
 * - Response transformation and logging
 * - Comprehensive error handling
 */

// Environment configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const IS_DEVELOPMENT = import.meta.env.DEV;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request start times for duration logging
const requestTimestamps = new Map();

/**
 * Request Interceptor
 * - Adds authorization token if present
 * - Logs request in development mode
 * - Adds timestamp to request
 */
api.interceptors.request.use(
  (config) => {
    // Generate unique request ID
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    config.metadata = { requestId, startTime: Date.now() };
    requestTimestamps.set(requestId, Date.now());

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Development logging
    if (IS_DEVELOPMENT) {
      console.log(
        `%c[API Request] ${config.method?.toUpperCase()} ${config.url}`,
        'color: #1E40AF; font-weight: bold;'
      );
    }

    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * - Extracts data from response
 * - Logs response with duration in development
 * - Transforms date strings to Date objects
 */
api.interceptors.response.use(
  (response) => {
    const requestId = response.config.metadata?.requestId;
    const startTime = requestTimestamps.get(requestId);
    const duration = startTime ? Date.now() - startTime : 0;
    requestTimestamps.delete(requestId);

    // Development logging
    if (IS_DEVELOPMENT) {
      console.log(
        `%c[API Response] ${response.status} ${response.config.url} (${duration}ms)`,
        'color: #059669; font-weight: bold;'
      );
    }

    // Transform date strings in response data
    if (response.data) {
      response.data = transformDates(response.data);
    }

    return response;
  },
  (error) => {
    return Promise.reject(handleApiError(error));
  }
);

/**
 * Transform ISO date strings to Date objects
 */
function transformDates(data) {
  if (data === null || data === undefined) return data;
  
  if (typeof data === 'string') {
    // Check if string is ISO date format
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    if (isoDateRegex.test(data)) {
      return new Date(data);
    }
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(transformDates);
  }
  
  if (typeof data === 'object') {
    const transformed = {};
    for (const key in data) {
      transformed[key] = transformDates(data[key]);
    }
    return transformed;
  }
  
  return data;
}

/**
 * Centralized Error Handler
 * Returns structured error object: { message, status, data }
 */
function handleApiError(error) {
  // Network error (no response)
  if (!error.response) {
    return {
      message: 'Network error. Please check your connection.',
      status: 0,
      data: null,
      isNetworkError: true,
    };
  }

  const { status, data } = error.response;
  let message = data?.detail || data?.message || 'An error occurred';

  // Handle specific status codes
  switch (status) {
    case 401:
      message = 'Session expired. Please log in again.';
      // Clear token and could redirect to login
      localStorage.removeItem('authToken');
      // Optionally: window.location.href = '/login';
      break;
    
    case 403:
      message = 'You do not have permission to perform this action.';
      break;
    
    case 404:
      message = 'The requested resource was not found.';
      break;
    
    case 422:
      message = data?.detail?.[0]?.msg || 'Validation error. Please check your input.';
      break;
    
    case 500:
      message = 'Server error. Please try again later.';
      break;
    
    case 502:
    case 503:
    case 504:
      message = 'Service temporarily unavailable. Please try again.';
      break;
    
    default:
      break;
  }

  // Log error in development
  if (IS_DEVELOPMENT) {
    console.error(
      `%c[API Error] ${status} - ${message}`,
      'color: #DC2626; font-weight: bold;',
      data
    );
  }

  return {
    message,
    status,
    data,
    isNetworkError: false,
  };
}

export default api;
