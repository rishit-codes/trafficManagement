import api from './api';

/**
 * Optimizer Service
 * 
 * Handles traffic signal optimization API calls using Webster's method.
 * 
 * @example
 * import { optimizerService } from './services/optimizerService';
 * const result = await optimizerService.getOptimization('J001', { north: 450, south: 380 });
 */

export const optimizerService = {
  /**
   * Calculate optimal signal timing for a junction
   * @param {string} junctionId - Junction ID
   * @param {Object} flows - PCU flows per approach
   * @param {number} flows.north - North approach PCU
   * @param {number} flows.south - South approach PCU
   * @param {number} flows.east - East approach PCU
   * @param {number} flows.west - West approach PCU
   * @returns {Promise<Object>} Optimization result
   * Structure: { cycleLength, phases: [...], isOversaturated, flowRatios }
   */
  getOptimization: async (junctionId, flows) => {
    const response = await api.post(`/optimize/${junctionId}`, flows);
    return response.data;
  },

  /**
   * Compare current timing with optimized timing
   * @param {string} junctionId - Junction ID
   * @param {Object} flows - PCU flows per approach
   * @returns {Promise<Object>} Comparison data
   */
  compareOptimization: async (junctionId, flows) => {
    const response = await api.post(`/optimize/${junctionId}/compare`, flows);
    return response.data;
  },

  /**
   * Apply optimized timing to junction
   * @param {string} junctionId - Junction ID
   * @param {Object} flows - PCU flows per approach
   * @returns {Promise<Object>} Application result
   */
  applyOptimization: async (junctionId, flows) => {
    const response = await api.post(`/optimize/${junctionId}/apply`, flows);
    return response.data;
  },

  /**
   * Get current timing configuration
   * @param {string} junctionId - Junction ID
   * @returns {Promise<Object>} Current timing
   * Structure: { currentCycle, phases, lastUpdated }
   */
  getCurrentTiming: async (junctionId) => {
    const response = await api.get(`/junctions/${junctionId}/timing`);
    return response.data;
  },
};

export default optimizerService;
