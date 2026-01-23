import api from './api';

/**
 * Control Service
 * 
 * Handles manual control, overrides, and emergency operations.
 * 
 * @example
 * import { controlService } from './services/controlService';
 * await controlService.applyOverride('J001', { action: 'extend_green', duration: 30 });
 */

export const controlService = {
  /**
   * Apply manual control override to a junction
   * @param {string} junctionId - Junction ID
   * @param {Object} overrideData - Override parameters
   * @param {string} overrideData.action - Action type ('extend_green', 'force_red', 'all_red')
   * @param {number} overrideData.duration - Duration in seconds
   * @param {string} overrideData.reason - Reason for override
   * @param {string} overrideData.approach - Affected approach (optional)
   * @returns {Promise<Object>} Override result
   * Structure: { success, appliedAt, autoRevertAt }
   */
  applyOverride: async (junctionId, overrideData) => {
    const response = await api.post('/control/override', {
      junctionId,
      ...overrideData,
    });
    return response.data;
  },

  /**
   * Clear active override
   * @param {string} junctionId - Junction ID
   * @returns {Promise<Object>} Clear result
   */
  clearOverride: async (junctionId) => {
    const response = await api.delete(`/control/override/${junctionId}`);
    return response.data;
  },

  /**
   * Activate emergency vehicle preemption
   * @param {string} routeId - Emergency route ID
   * @param {Object} routeData - Route information
   * @param {Array<string>} routeData.junctions - Junction IDs along route
   * @param {number} routeData.estimatedDuration - Estimated transit time (seconds)
   * @returns {Promise<Object>} Activation result
   * Structure: { success, activatedAt, affectedJunctions }
   */
  activateEmergency: async (routeId, routeData) => {
    const response = await api.post('/control/emergency', {
      routeId,
      ...routeData,
    });
    return response.data;
  },

  /**
   * Deactivate emergency preemption
   * @param {string} routeId - Emergency route ID
   * @returns {Promise<Object>} Deactivation result
   */
  deactivateEmergency: async (routeId) => {
    const response = await api.delete(`/control/emergency/${routeId}`);
    return response.data;
  },

  /**
   * Set junction to manual mode
   * @param {string} junctionId - Junction ID
   * @param {boolean} enabled - Enable/disable manual mode
   * @returns {Promise<Object>} Mode change result
   */
  setManualMode: async (junctionId, enabled) => {
    const response = await api.post(`/junctions/${junctionId}/manual`, { enabled });
    return response.data;
  },

  /**
   * Set specific signal phase
   * @param {string} junctionId - Junction ID
   * @param {string} phase - Phase to activate
   * @returns {Promise<Object>} Phase change result
   */
  setSignalPhase: async (junctionId, phase) => {
    const response = await api.post(`/junctions/${junctionId}/phase`, { phase });
    return response.data;
  },

  /**
   * Get system health status
   * @returns {Promise<Object>} System status
   * Structure: { api: status, vision: status, database: status, uptime }
   */
  getSystemStatus: async () => {
    const response = await api.get('/system/status');
    return response.data;
  },

  /**
   * Health check endpoint
   * @returns {Promise<Object>} Health status
   */
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default controlService;
