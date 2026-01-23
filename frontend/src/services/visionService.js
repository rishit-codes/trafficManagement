import api from './api';

/**
 * Vision Service
 * 
 * Handles computer vision API calls for vehicle detection and counts.
 * 
 * @example
 * import { visionService } from './services/visionService';
 * const counts = await visionService.getVehicleCounts('J001');
 */

export const visionService = {
  /**
   * Get processed frame with detections
   * @param {string} junctionId - Junction ID
   * @returns {Promise<Object>} Frame data
   * Structure: { image: base64String, detections: [...], timestamp, confidence }
   */
  getProcessedFrame: async (junctionId) => {
    const response = await api.get(`/vision/${junctionId}/frame`);
    return response.data;
  },

  /**
   * Get current vehicle counts from vision system
   * @param {string} junctionId - Junction ID
   * @returns {Promise<Object>} Vehicle counts
   * Structure: { car, bus, truck, motorcycle, bicycle, person, pcuTotal }
   */
  getVehicleCounts: async (junctionId) => {
    const response = await api.get(`/vision/${junctionId}/counts`);
    return response.data;
  },

  /**
   * Get camera status
   * @param {string} junctionId - Junction ID
   * @returns {Promise<Object>} Camera status
   */
  getCameraStatus: async (junctionId) => {
    const response = await api.get(`/vision/${junctionId}/status`);
    return response.data;
  },

  /**
   * Get detection confidence metrics
   * @param {string} junctionId - Junction ID
   * @returns {Promise<Object>} Confidence metrics
   */
  getDetectionMetrics: async (junctionId) => {
    const response = await api.get(`/vision/${junctionId}/metrics`);
    return response.data;
  },
};

export default visionService;
