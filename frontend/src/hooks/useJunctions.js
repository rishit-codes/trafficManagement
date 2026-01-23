import { useQuery } from '@tanstack/react-query';
import { junctionService } from '../services/junctionService';

/**
 * useJunctions Hook
 * 
 * Fetches all junctions and sorts by status (critical first).
 * Auto-refreshes every 10 seconds.
 * 
 * @example
 * const { junctions, isLoading, isError, refetch } = useJunctions();
 */
export const useJunctions = () => {
  const query = useQuery({
    queryKey: ['junctions'],
    queryFn: junctionService.getAllJunctions,
    refetchInterval: 10000, // 10 seconds
    staleTime: 5000,
    select: (data) => {
      // Sort junctions by status priority: critical > warning > optimal > offline
      const statusOrder = { critical: 0, warning: 1, optimal: 2, offline: 3 };
      return [...data].sort((a, b) => {
        const aOrder = statusOrder[a.status] ?? 4;
        const bOrder = statusOrder[b.status] ?? 4;
        return aOrder - bOrder;
      });
    },
  });

  return {
    junctions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
};

export default useJunctions;
