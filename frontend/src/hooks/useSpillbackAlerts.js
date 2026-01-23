import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { spillbackService } from '../services/spillbackService';

/**
 * useSpillbackAlerts Hook
 * 
 * Fetches active spillback alerts with critical priority.
 * Auto-refreshes every 3 seconds.
 * Shows browser notification for new critical alerts.
 * 
 * @example
 * const { alerts, criticalCount, isLoading } = useSpillbackAlerts();
 */
export const useSpillbackAlerts = () => {
  const previousAlertsRef = useRef([]);

  const query = useQuery({
    queryKey: ['spillback-alerts'],
    queryFn: spillbackService.getActiveAlerts,
    refetchInterval: 3000, // 3 seconds - critical data
    staleTime: 1000,
  });

  const alerts = query.data ?? [];
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  // Show browser notification for new critical alerts
  useEffect(() => {
    if (!query.data) return;

    const previousIds = new Set(previousAlertsRef.current.map(a => a.id || `${a.junctionId}-${a.approach}`));
    const newCriticalAlerts = query.data.filter(
      alert => alert.severity === 'critical' && !previousIds.has(alert.id || `${alert.junctionId}-${alert.approach}`)
    );

    if (newCriticalAlerts.length > 0 && 'Notification' in window) {
      // Request permission if needed
      if (Notification.permission === 'granted') {
        newCriticalAlerts.forEach(alert => {
          new Notification('🚨 Critical Spillback Alert', {
            body: `Junction ${alert.junctionId}: ${alert.approach} approach at ${Math.round(alert.occupancy * 100)}% occupancy`,
            icon: '/favicon.ico',
            tag: `spillback-${alert.junctionId}`,
          });
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }

    previousAlertsRef.current = query.data;
  }, [query.data]);

  return {
    alerts,
    criticalCount,
    warningCount: alerts.filter(a => a.severity === 'warning').length,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
};

export default useSpillbackAlerts;
