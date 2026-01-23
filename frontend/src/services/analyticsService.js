import api from './api';

/**
 * Analytics Service
 * 
 * Handles analytics, reporting, and historical data API calls.
 * 
 * @example
 * import { analyticsService } from './services/analyticsService';
 * const summary = await analyticsService.getSystemSummary('today');
 */

export const analyticsService = {
  /**
   * Get system-wide summary metrics
   * @param {string} period - Time period ('today', 'week', 'month')
   * @returns {Promise<Object>} System summary
   * Structure: { activeJunctions, avgWaitTime, spillbackEvents, throughput, efficiency }
   */
  getSystemSummary: async (period = 'today') => {
    const response = await api.get(`/analytics/summary?period=${period}`);
    return response.data;
  },

  /**
   * Get analytics for a specific junction
   * @param {string} junctionId - Junction ID
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @returns {Promise<Object>} Junction analytics
   * Structure: { waitTimeTrend: [...], volumeTrend: [...], spillbackEvents: [...] }
   */
  getJunctionAnalytics: async (junctionId, startDate, endDate) => {
    const response = await api.get(
      `/analytics/junction/${junctionId}?start=${startDate}&end=${endDate}`
    );
    return response.data;
  },

  /**
   * Get traffic volume data for charts
   * @param {string} period - Time period (e.g., '24h', '7d', '30d')
   * @returns {Promise<Array>} Volume data points
   */
  getTrafficVolume: async (period = '24h') => {
    const response = await api.get(`/analytics/volume?period=${period}`);
    return response.data;
  },

  /**
   * Get efficiency report
   * @returns {Promise<Object>} Efficiency metrics
   */
  getEfficiencyReport: async () => {
    const response = await api.get('/analytics/efficiency');
    return response.data;
  },

  /**
   * Get SUMO simulation comparison results
   * @returns {Promise<Object>} Simulation results
   * Structure: { baseline: {...}, adaptive: {...}, improvements: {...} }
   */
  getSimulationResults: async () => {
    const response = await api.get('/simulation/results');
    return response.data;
  },

  /**
   * Get historical data for a junction
   * @param {string} junctionId - Junction ID
   * @param {number} days - Number of days to fetch (default: 7)
   * @returns {Promise<Array>} Historical data
   */
  getHistoricalData: async (junctionId, days = 7) => {
    const response = await api.get(`/analytics/history/${junctionId}?days=${days}`);
    return response.data;
  },

  /**
   * Export analytics report
   * @param {Array<string>} junctionIds - Junction IDs to include
   * @param {string} startDate - Start date (ISO format)
   * @param {string} endDate - End date (ISO format)
   * @param {string} format - Export format ('pdf' or 'excel')
   * @returns {Promise<Blob>} Report file blob for download
   */
  exportReport: async (junctionIds, startDate, endDate, format = 'pdf') => {
    const response = await api.post(
      '/analytics/export',
      { junctions: junctionIds, startDate, endDate, format },
      { responseType: 'blob' }
    );
    return response.data;
  },

  /**
   * Get live metrics for dashboard
   * @returns {Promise<Object>} Live metrics
   */
  getLiveMetrics: async () => {
    const response = await api.get('/metrics/live');
    return response.data;
  },
};

export default analyticsService;
