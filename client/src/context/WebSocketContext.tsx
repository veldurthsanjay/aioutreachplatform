import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface WebSocketContextType {
  isConnected: boolean;
  lastEvent: { type: string; payload: any; timestamp: string } | null;
  subscribe: (eventType: string, callback: (payload: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; payload: any; timestamp: string } | null>(null);
  const [listeners, setListeners] = useState<Map<string, Set<(payload: any) => void>>>(new Map());

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any;

    function connect() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const hostname = window.location.hostname || 'localhost';
      const wsUrl = `${protocol}//${hostname}:5000`;

      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WebSocket] Connected to real-time events');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastEvent(data);

          if (data.type && listeners.has(data.type)) {
            const cbs = listeners.get(data.type);
            cbs?.forEach(cb => cb(data.payload));
          }
        } catch (e) {
          console.error('[WebSocket] Failed to parse message', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[WebSocket] Disconnected. Retrying in 3 seconds...');
        reconnectTimeout = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        // Will trigger ws.onclose which auto-reconnects smoothly
        try {
          ws?.close();
        } catch {
          // ignore
        }
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, [listeners]);

  const subscribe = useCallback((eventType: string, callback: (payload: any) => void) => {
    setListeners(prev => {
      const newMap = new Map(prev);
      if (!newMap.has(eventType)) {
        newMap.set(eventType, new Set());
      }
      newMap.get(eventType)!.add(callback);
      return newMap;
    });

    return () => {
      setListeners(prev => {
        const newMap = new Map(prev);
        const set = newMap.get(eventType);
        if (set) {
          set.delete(callback);
          if (set.size === 0) {
            newMap.delete(eventType);
          }
        }
        return newMap;
      });
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ isConnected, lastEvent, subscribe }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
