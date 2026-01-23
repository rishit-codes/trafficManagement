import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trafficAPI } from '../services/api';

// Query Keys
export const queryKeys = {
  junctions: ['junctions'],
  junction: (id) => ['junction', id],
  junctionState: (id) => ['junction', id, 'state'],
  liveMetrics: ['metrics', 'live'],
  trafficVolume: (period) => ['metrics', 'volume', period],
  spillbackEvents: ['spillback', 'events'],
  systemStatus: ['system', 'status'],
  analytics: (start, end) => ['analytics', start, end],
};

// Stale time configurations
const STALE_TIMES = {
  realtime: 5000,     // 5 seconds for live data
  frequent: 30000,    // 30 seconds for frequently changing data
  standard: 60000,    // 1 minute for standard data
  static: 300000,     // 5 minutes for rarely changing data
};

// --- JUNCTION HOOKS ---

export const useJunctions = () => {
  return useQuery({
    queryKey: queryKeys.junctions,
    queryFn: async () => {
      const response = await trafficAPI.getJunctions();
      return response.data;
    },
    staleTime: STALE_TIMES.frequent,
    refetchInterval: STALE_TIMES.frequent,
  });
};

export const useJunction = (id) => {
  return useQuery({
    queryKey: queryKeys.junction(id),
    queryFn: async () => {
      const response = await trafficAPI.getJunction(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.frequent,
  });
};

export const useJunctionState = (id) => {
  return useQuery({
    queryKey: queryKeys.junctionState(id),
    queryFn: async () => {
      const response = await trafficAPI.getJunctionState(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: STALE_TIMES.realtime,
    refetchInterval: STALE_TIMES.realtime,
  });
};

// --- METRICS HOOKS ---

export const useLiveMetrics = () => {
  return useQuery({
    queryKey: queryKeys.liveMetrics,
    queryFn: async () => {
      const response = await trafficAPI.getLiveMetrics();
      return response.data;
    },
    staleTime: STALE_TIMES.realtime,
    refetchInterval: STALE_TIMES.realtime,
  });
};

export const useTrafficVolume = (period = '24h') => {
  return useQuery({
    queryKey: queryKeys.trafficVolume(period),
    queryFn: async () => {
      const response = await trafficAPI.getTrafficVolume(period);
      return response.data;
    },
    staleTime: STALE_TIMES.frequent,
    refetchInterval: STALE_TIMES.frequent,
  });
};

// --- SPILLBACK HOOKS ---

export const useSpillbackEvents = () => {
  return useQuery({
    queryKey: queryKeys.spillbackEvents,
    queryFn: async () => {
      const response = await trafficAPI.getSpillbackEvents();
      return response.data;
    },
    staleTime: STALE_TIMES.realtime,
    refetchInterval: STALE_TIMES.realtime,
  });
};

// --- SYSTEM STATUS ---

export const useSystemStatus = () => {
  return useQuery({
    queryKey: queryKeys.systemStatus,
    queryFn: async () => {
      const response = await trafficAPI.getSystemStatus();
      return response.data;
    },
    staleTime: STALE_TIMES.frequent,
    refetchInterval: STALE_TIMES.frequent,
  });
};

// --- MUTATION HOOKS ---

export const useOptimizeJunction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, flows }) => trafficAPI.optimizeJunction(id, flows),
    onSuccess: (data, { id }) => {
      // Invalidate junction queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.junction(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.junctionState(id) });
    },
  });
};

export const useTriggerEmergency = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, direction }) => trafficAPI.triggerEmergency(id, direction),
    onSuccess: () => {
      // Invalidate all junction data
      queryClient.invalidateQueries({ queryKey: queryKeys.junctions });
    },
  });
};

export const useSetManualMode = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, enabled }) => trafficAPI.setManualMode(id, enabled),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.junction(id) });
    },
  });
};
