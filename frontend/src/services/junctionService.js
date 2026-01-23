import api from './api';

/**
 * Junction Service
 * 
 * Handles all junction-related API calls.
 * 
 * @example
 * import { junctionService } from './services/junctionService';
 * const junctions = await junctionService.getAllJunctions();
 */

export const junctionService = {
  /**
   * Get all junctions with current status
   * @returns {Promise<Array>} Array of junction objects
   * Structure: { id, name, coordinates: {lat, lon}, status, flowRatio, currentMetrics }
   */
  getAllJunctions: async () => {
    const response = await api.get('/junctions');
    return response.data;
  },

  /**
   * Get detailed junction information
   * @param {string} junctionId - Junction ID
   * @returns {Promise<Object>} Detailed junction object
   * Structure: { id, name, coordinates, approaches, geometricData, currentMetrics, history }
   */
  getJunctionDetail: async (junctionId) => {
    const response = await api.get(`/junctions/${junctionId}`);
    return response.data;
  },

  /**
   * Get real-time metrics for a junction
   * @param {string} junctionId - Junction ID
   * @returns {Promise<Object>} Real-time metrics
   * Structure: { vehicleCounts, pcuTotal, flowRate, saturationFlow, currentPhase, queueLengths }
   */
  getJunctionMetrics: async (junctionId) => {
    const response = await api.get(`/junctions/${junctionId}/metrics`);
    return response.data;
  },

  /**
   * Get junction timing configuration
   * @param {string} junctionId - Junction ID
   * @returns {Promise<Object>} Timing configuration
   */
  getJunctionTiming: async (junctionId) => {
    const response = await api.get(`/junctions/${junctionId}/timing`);
    return response.data;
  },

  /**
   * Update junction configuration
   * @param {string} junctionId - Junction ID
   * @param {Object} configData - Configuration data
   * @param {Object} configData.approaches - Approach configurations
   * @param {Object} configData.signalParameters - Signal timing parameters
   * @param {Object} configData.cameraSettings - Camera settings
   * @returns {Promise<Object>} Updated junction config
   */
  updateJunctionConfig: async (junctionId, configData) => {
    const response = await api.put(`/junctions/${junctionId}/config`, configData);
    return response.data;
  },

  /**
   * Get junction state (current signal phase)
   * @param {string} junctionId - Junction ID
   * @returns {Promise<Object>} Junction state
   */
  getJunctionState: async (junctionId) => {
    const response = await api.get(`/junctions/${junctionId}/state`);
    return response.data;
  },
};

export default junctionService;
