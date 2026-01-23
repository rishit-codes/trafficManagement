import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (optional login/logging)
api.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed in future
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Suppress logging for 422 (Unprocessable Entity) which is used for 'no data' scenarios
    if (!error.response || error.response.status !== 422) {
      console.error('API Response Error:', error);
    }
    
    // Check for network errors or server offline
    if (!error.response) {
       // Network error or server offline
       throw new Error('Backend unavailable. Please check if the server is running.');
    }
    
    // Re-throw to be handled by specific service functions
    return Promise.reject(error);
  }
);

/**
 * Get all junctions
 * GET /junctions
 */
export const getJunctions = async () => {
  try {
    const response = await api.get('/junctions');
    return response.data;
  } catch (error) {
    if (error.response?.status !== 422) {
      console.error('Failed to fetch junctions:', error);
    }
    throw new Error(error.response?.data?.detail || error.message || 'Failed to fetch junctions');
  }
};

/**
 * Get a specific junction by ID
 * GET /junctions/{id}
 */
export const getJunctionById = async (id) => {
  try {
    const response = await api.get(`/junctions/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status !== 422) {
      console.error(`Failed to fetch junction ${id}:`, error);
    }
    throw new Error(error.response?.data?.detail || error.message || `Failed to fetch junction ${id}`);
  }
};

/**
 * Get state for a specific junction
 * GET /junctions/{id}/state
 */
export const getJunctionState = async (id) => {
  try {
    const response = await api.get(`/junctions/${id}/state`);
    return response.data;
  } catch (error) {
    if (error.response?.status !== 422) {
      console.error(`Failed to fetch state for junction ${id}:`, error);
    }
    throw new Error(error.response?.data?.detail || error.message || `Failed to fetch state for junction ${id}`);
  }
};

/**
 * Get traffic history for a specific junction
 * GET /history/{id}
 */
export const getTrafficHistory = async (id) => {
  try {
    const response = await api.get(`/history/${id}`);
    return response.data;
  } catch (error) {
    if (error.response?.status !== 422) {
        console.error(`Failed to fetch history for junction ${id}:`, error);
    }
    throw new Error(error.response?.data?.detail || error.message || `Failed to fetch history for junction ${id}`);
  }
};

/**
 * Get anomalies for a specific junction
 * GET /analytics/anomalies/{id}
 */
export const getAnomalies = async (id) => {
  try {
    const response = await api.get(`/analytics/anomalies/${id}`);
    return response.data;
  } catch (error) {
    // 422 means no anomalies found or invalid ID - return empty array
    if (error.response && error.response.status === 422) {
      return [];
    }
    console.error(`Failed to fetch anomalies for junction ${id}:`, error);
    throw new Error(error.response?.data?.detail || error.message || `Failed to fetch anomalies for junction ${id}`);
  }
};

/**
 * Get vision system runtime metrics
 * GET /vision/metrics
 */
export const getVisionMetrics = async () => {
  try {
    const response = await api.get('/vision/metrics');
    return response.data;
  } catch (error) {
     console.error("Failed to fetch vision metrics:", error);
     throw new Error(error.response?.data?.detail || error.message || 'Failed to fetch vision metrics');
  }
};

/**
 * Get performance metrics for a junction
 * GET /analytics/performance/{id}
 */
export const getPerformanceMetrics = async (id, days = 7) => {
  try {
    const response = await api.get(`/analytics/performance/${id}`, { params: { days } });
    return response.data;
  } catch (error) {
    if (error.response?.status !== 422) {
      console.error(`Failed to fetch performance metrics for ${id}:`, error);
    }
    throw new Error(error.response?.data?.detail || error.message || 'Failed to fetch performance metrics');
  }
};

export default api;
