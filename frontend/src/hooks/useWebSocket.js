import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useWebSocket Hook
 * 
 * WebSocket connection for real-time updates.
 * Auto-reconnects on disconnect with exponential backoff.
 * 
 * @param {string} path - WebSocket endpoint path (e.g., '/ws/alerts')
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Auto-connect on mount (default: true)
 * @param {number} options.reconnectAttempts - Max reconnect attempts (default: 5)
 * @param {number} options.reconnectInterval - Base reconnect interval ms (default: 1000)
 * 
 * @example
 * const { data, isConnected, send } = useWebSocket('/ws/alerts');
 */
export const useWebSocket = (path, options = {}) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 1000,
  } = options;

  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  const wsRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  // Build WebSocket URL
  const getWsUrl = useCallback(() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const wsProtocol = baseUrl.startsWith('https') ? 'wss' : 'ws';
    const wsBase = baseUrl.replace(/^https?/, wsProtocol);
    return `${wsBase}${path}`;
  }, [path]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      const url = getWsUrl();
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log(`[WebSocket] Connected to ${path}`);
        setIsConnected(true);
        setError(null);
        reconnectCountRef.current = 0;
      };

      wsRef.current.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          setData(parsed);
        } catch (e) {
          // If not JSON, use raw data
          setData(event.data);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('[WebSocket] Error:', event);
        setError(new Error('WebSocket connection error'));
      };

      wsRef.current.onclose = (event) => {
        console.log(`[WebSocket] Disconnected from ${path}`, event.code);
        setIsConnected(false);

        // Attempt reconnect if not a clean close
        if (event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
          const delay = reconnectInterval * Math.pow(2, reconnectCountRef.current);
          console.log(`[WebSocket] Reconnecting in ${delay}ms...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectCountRef.current++;
            connect();
          }, delay);
        }
      };
    } catch (err) {
      console.error('[WebSocket] Connect error:', err);
      setError(err);
    }
  }, [getWsUrl, path, reconnectAttempts, reconnectInterval]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Send message through WebSocket
  const send = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const payload = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(payload);
    } else {
      console.warn('[WebSocket] Cannot send - not connected');
    }
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    data,
    isConnected,
    error,
    connect,
    disconnect,
    send,
  };
};

export default useWebSocket;
