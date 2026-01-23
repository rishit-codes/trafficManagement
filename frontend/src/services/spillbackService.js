import api from './api';

/**
 * Spillback Service
 * 
 * Handles spillback detection and alert management.
 * 
 * @example
 * import { spillbackService } from './services/spillbackService';
 * const alerts = await spillbackService.getActiveAlerts();
 */

export const spillbackService = {
  /**
   * Check spillback status for a junction
   * @param {string} junctionId - Junction ID
   * @param {Object} queueData - Queue lengths per approach
   * @param {number} queueData.north - North queue count
   * @param {number} queueData.south - South queue count
   * @param {number} queueData.east - East queue count
   * @param {number} queueData.west - West queue count
   * @returns {Promise<Object>} Spillback analysis
   * Structure: { overallStatus, approaches: {...}, recommendedAction }
   */
  checkSpillback: async (junctionId, queueData) => {
    const response = await api.post(`/spillback/${junctionId}`, queueData);
    return response.data;
  },

  /**
   * Get all active spillback alerts
   * @returns {Promise<Array>} Active alerts
   * Structure: [{ junctionId, severity, approach, occupancy, trend, timestamp }]
   */
  getActiveAlerts: async () => {
    const response = await api.get('/spillback/alerts');
    return response.data;
  },

  /**
   * Get spillback events for analytics
   * @returns {Promise<Array>} Spillback events list
   */
  getSpillbackEvents: async () => {
    const response = await api.get('/spillback/events');
    return response.data;
  },

  /**
   * Acknowledge/dismiss an alert
   * @param {string} alertId - Alert ID
   * @returns {Promise<Object>} Acknowledgement result
   */
  acknowledgeAlert: async (alertId) => {
    const response = await api.post(`/spillback/alerts/${alertId}/acknowledge`);
    return response.data;
  },
};

export default spillbackService;
