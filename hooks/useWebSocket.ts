// hooks/useWebSocket.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
}

interface WebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (event: MessageEvent) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
}

interface WebSocketHook extends WebSocketState {
  sendMessage: (data: any) => void;
  subscribe: (requestId: string) => void;
  unsubscribe: (requestId: string) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(options: WebSocketOptions = {}): WebSocketHook {
  const { data: session } = useSession();
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
  });
  
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);
  const maxReconnectAttempts = options.reconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 3000;
  const messagesQueueRef = useRef<any[]>([]);
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const WS_URL = API_URL.replace(/^http/, 'ws');
  
  const connect = useCallback(() => {
    if (!session?.user?.id) return;
    
    // Close existing connection
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setState((prev) => ({ ...prev, isConnecting: true, error: null }));
    
    // Create new WebSocket connection
    try {
      const ws = new WebSocket(`${WS_URL}/ws?token=${session.user.id}`);
      websocketRef.current = ws;
      
      ws.onopen = (event) => {
        setState({
          isConnected: true,
          isConnecting: false,
          error: null,
        });
        
        reconnectAttemptsRef.current = 0;
        
        // Send any queued messages
        while (messagesQueueRef.current.length > 0) {
          const message = messagesQueueRef.current.shift();
          ws.send(JSON.stringify(message));
        }
        
        // Call custom onOpen handler
        options.onOpen?.(event);
      };
      
      ws.onmessage = (event) => {
        options.onMessage?.(event);
      };
      
      ws.onclose = (event) => {
        setState({
          isConnected: false,
          isConnecting: false,
          error: event.reason || "Connection closed",
        });
        
        options.onClose?.(event);
        
        // Attempt to reconnect if not closed cleanly
        if (event.code !== 1000 && event.code !== 1001) {
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttemptsRef.current++;
              connect();
            }, reconnectInterval);
          }
        }
      };
      
      ws.onerror = (event) => {
        setState((prev) => ({
          ...prev,
          error: "WebSocket connection error",
        }));
        
        options.onError?.(event);
      };
    } catch (error) {
      setState({
        isConnected: false,
        isConnecting: false,
        error: error instanceof Error ? error.message : "Failed to connect",
      });
    }
  }, [session, WS_URL, maxReconnectAttempts, reconnectInterval, options]);
  
  const disconnect = useCallback(() => {
    if (websocketRef.current) {
      websocketRef.current.close(1000, "Client disconnected");
      websocketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    setState({
      isConnected: false,
      isConnecting: false,
      error: null,
    });
  }, []);
  
  const sendMessage = useCallback((data: any) => {
    const payload = typeof data === 'string' ? data : JSON.stringify(data);
    
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.send(payload);
    } else {
      // Queue message to send when connection is established
      messagesQueueRef.current.push(data);
      
      // If not connecting, try to connect
      if (!state.isConnecting && !websocketRef.current) {
        connect();
      }
    }
  }, [state.isConnecting, connect]);
  
  const subscribe = useCallback((requestId: string) => {
    sendMessage({
      type: 'subscribe',
      request_id: requestId,
    });
  }, [sendMessage]);
  
  const unsubscribe = useCallback((requestId: string) => {
    sendMessage({
      type: 'unsubscribe',
      request_id: requestId,
    });
  }, [sendMessage]);
  
  // Connect when session is available
  useEffect(() => {
    if (session?.user?.id) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [session, connect, disconnect]);
  
  // Keep connection alive with ping/pong
  useEffect(() => {
    let pingInterval: NodeJS.Timeout;
    
    if (state.isConnected) {
      pingInterval = setInterval(() => {
        sendMessage({
          type: 'ping',
          timestamp: Date.now(),
        });
      }, 30000); // Send ping every 30 seconds
    }
    
    return () => {
      if (pingInterval) clearInterval(pingInterval);
    };
  }, [state.isConnected, sendMessage]);
  
  return {
    ...state,
    sendMessage,
    subscribe,
    unsubscribe,
    disconnect,
    reconnect: connect,
  };
}

// Utility hook for tracking story generation status
export function useStoryGenerationStatus(requestId: string | null) {
  const [status, setStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'status_update' && data.request_id === requestId) {
        setStatus(data.status);
        setProgress(data.progress);
        
        if (data.result) {
          setResult(data.result);
        }
        
        if (data.error) {
          setError(data.error);
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }, [requestId]);
  
  const { isConnected, subscribe, unsubscribe } = useWebSocket({
    onMessage: handleMessage,
  });
  
  useEffect(() => {
    if (isConnected && requestId) {
      subscribe(requestId);
    }
    
    return () => {
      if (requestId) {
        unsubscribe(requestId);
      }
    };
  }, [isConnected, requestId, subscribe, unsubscribe]);
  
  return {
    status,
    progress,
    result,
    error,
    isConnected,
  };
}