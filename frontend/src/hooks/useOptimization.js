import { useMutation, useQueryClient } from '@tanstack/react-query';
import { optimizerService } from '../services/optimizerService';

/**
 * useOptimization Hook
 * 
 * Handles signal timing optimization mutations.
 * Invalidates junction queries on success.
 * 
 * @param {string} junctionId - Junction ID to optimize
 * @example
 * const { optimize, isLoading, data } = useOptimization('J001');
 * optimize({ north: 450, south: 380, east: 320, west: 290 });
 */
export const useOptimization = (junctionId) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (flows) => optimizerService.getOptimization(junctionId, flows),
    onSuccess: (data) => {
      // Invalidate junction queries to refetch updated timing
      queryClient.invalidateQueries({ queryKey: ['junction', junctionId] });
      queryClient.invalidateQueries({ queryKey: ['junction', junctionId, 'timing'] });
      
      console.log('[Optimization] Success:', data);
    },
    onError: (error) => {
      console.error('[Optimization] Error:', error);
    },
  });

  return {
    optimize: mutation.mutate,
    optimizeAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    data: mutation.data,
    error: mutation.error,
    reset: mutation.reset,
  };
};

/**
 * useApplyOptimization Hook
 * 
 * Applies optimized timing to the junction controller.
 */
export const useApplyOptimization = (junctionId) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (flows) => optimizerService.applyOptimization(junctionId, flows),
    onSuccess: () => {
      // Invalidate all junction data
      queryClient.invalidateQueries({ queryKey: ['junction', junctionId] });
      queryClient.invalidateQueries({ queryKey: ['junctions'] });
    },
  });

  return {
    apply: mutation.mutate,
    applyAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    data: mutation.data,
    error: mutation.error,
  };
};

export default useOptimization;
