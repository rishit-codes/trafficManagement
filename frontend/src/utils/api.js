import axios from 'axios';

const API_BASE = import.meta.env.PROD ? 'http://localhost:8000' : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const trafficAPI = {
  // Health check
  healthCheck: () => api.get('/health'),

  // Junction endpoints
  getJunctions: () => api.get('/junctions'),
  getJunction: (id) => api.get(`/junctions/${id}`),
  getJunctionState: (id) => api.get(`/junctions/${id}/state`),

  // Optimization
  optimizeJunction: (id, flows) => api.post(`/optimize/${id}`, flows),
  compareOptimization: (id, flows) => api.post(`/optimize/${id}/compare`, flows),
  applyOptimization: (id, flows) => api.post(`/optimize/${id}/apply`, flows),

  // Spillback
  analyzeSpillback: (id, queues) => api.post(`/spillback/${id}`, queues),

  // Emergency
  triggerEmergency: (id, direction) => api.post(`/emergency/${id}`, { direction }),

  // PCU conversion
  convertToPCU: (vehicleCounts) => api.post('/pcu/convert', vehicleCounts),
};

export default trafficAPI;
