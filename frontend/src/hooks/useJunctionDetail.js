import { useQuery } from '@tanstack/react-query';
import { junctionService } from '../services/junctionService';

/**
 * useJunctionDetail Hook
 * 
 * Fetches detailed junction information including metrics.
 * Auto-refreshes every 5 seconds for active monitoring.
 * 
 * @param {string} junctionId - Junction ID to fetch
 * @example
 * const { junction, metrics, isLoading } = useJunctionDetail('J001');
 */
export const useJunctionDetail = (junctionId) => {
  // Fetch junction detail
  const detailQuery = useQuery({
    queryKey: ['junction', junctionId],
    queryFn: () => junctionService.getJunctionDetail(junctionId),
    enabled: !!junctionId,
    staleTime: 5000,
  });

  // Fetch real-time metrics (faster refresh)
  const metricsQuery = useQuery({
    queryKey: ['junction', junctionId, 'metrics'],
    queryFn: () => junctionService.getJunctionMetrics(junctionId),
    enabled: !!junctionId,
    refetchInterval: 5000, // 5 seconds for real-time data
    staleTime: 2000,
  });

  // Fetch timing information
  const timingQuery = useQuery({
    queryKey: ['junction', junctionId, 'timing'],
    queryFn: () => junctionService.getJunctionTiming(junctionId),
    enabled: !!junctionId,
    staleTime: 10000,
  });

  return {
    junction: detailQuery.data,
    metrics: metricsQuery.data,
    timing: timingQuery.data,
    isLoading: detailQuery.isLoading || metricsQuery.isLoading,
    isError: detailQuery.isError || metricsQuery.isError,
    error: detailQuery.error || metricsQuery.error,
    refetch: () => {
      detailQuery.refetch();
      metricsQuery.refetch();
      timingQuery.refetch();
    },
  };
};

export default useJunctionDetail;
