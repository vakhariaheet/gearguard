/**
 * React WebSocket Hook
 * 
 * Provides a React hook for WebSocket connections with Clerk authentication
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

// =============================================================================
// TYPES
// =============================================================================

export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp?: number;
  messageId?: string;
}

export interface WebSocketOptions {
  url?: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onError?: (event: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onReconnect?: (attempt: number) => void;
  onReconnectFailed?: () => void;
}

export interface WebSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  lastMessage: WebSocketMessage | null;
}

// =============================================================================
// WEBSOCKET HOOK
// =============================================================================

export const useWebSocket = (options: WebSocketOptions = {}) => {
  const { getToken, isSignedIn } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const messageQueueRef = useRef<string[]>([]);

  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    reconnectAttempts: 0,
    lastMessage: null,
  });

  const {
    url = import.meta.env.VITE_WEBSOCKET_URL || 'wss://localhost:3001',
    reconnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000,
    onOpen,
    onClose,
    onError,
    onMessage,
    onReconnect,
    onReconnectFailed,
  } = options;

  // Clear timers
  const clearTimers = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
  }, []);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (heartbeatInterval > 0) {
      heartbeatTimerRef.current = setInterval(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'ping',
            data: 'ping',
            timestamp: Date.now(),
          }));
        }
      }, heartbeatInterval);
    }
  }, [heartbeatInterval]);

  // Process message queue
  const processMessageQueue = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN && messageQueueRef.current.length > 0) {
      const queue = [...messageQueueRef.current];
      messageQueueRef.current = [];
      
      queue.forEach(message => {
        wsRef.current?.send(message);
      });
    }
  }, []);

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (!isSignedIn) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }));
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Get JWT token from Clerk
      const token = await getToken();
      if (!token) {
        throw new Error('Failed to get authentication token');
      }

      // Construct WebSocket URL with token
      const wsUrl = new URL(url);
      wsUrl.searchParams.set('token', token);

      // Create WebSocket connection
      const ws = new WebSocket(wsUrl.toString());
      wsRef.current = ws;

      ws.onopen = () => {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null,
          reconnectAttempts: 0,
        }));

        // Process queued messages
        processMessageQueue();
        
        // Start heartbeat
        startHeartbeat();
        
        onOpen?.();
      };

      ws.onclose = (event) => {
        clearTimers();
        
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false,
        }));

        onClose?.(event);

        // Auto-reconnect if enabled and not a clean close
        if (reconnect && !event.wasClean && state.reconnectAttempts < maxReconnectAttempts) {
          setState(prev => ({ ...prev, reconnectAttempts: prev.reconnectAttempts + 1 }));
          
          onReconnect?.(state.reconnectAttempts + 1);
          
          reconnectTimerRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (state.reconnectAttempts >= maxReconnectAttempts) {
          onReconnectFailed?.();
        }
      };

      ws.onerror = (event) => {
        setState(prev => ({
          ...prev,
          error: 'WebSocket connection error',
          isConnecting: false,
        }));
        onError?.(event);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setState(prev => ({ ...prev, lastMessage: message }));
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Connection failed',
        isConnecting: false,
      }));
    }
  }, [
    isSignedIn,
    getToken,
    url,
    reconnect,
    reconnectInterval,
    maxReconnectAttempts,
    state.reconnectAttempts,
    onOpen,
    onClose,
    onError,
    onMessage,
    onReconnect,
    onReconnectFailed,
    processMessageQueue,
    startHeartbeat,
    clearTimers,
  ]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    clearTimers();
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
    }));
  }, [clearTimers]);

  // Send message
  const sendMessage = useCallback(<T>(type: string, data: T, options?: { messageId?: string }) => {
    const message: WebSocketMessage<T> = {
      type,
      data,
      timestamp: Date.now(),
      ...(options?.messageId && { messageId: options.messageId }),
    };

    const messageStr = JSON.stringify(message);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(messageStr);
    } else {
      // Queue message for when connection is established
      messageQueueRef.current.push(messageStr);
    }
  }, []);

  // Send raw message
  const sendRaw = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      messageQueueRef.current.push(message);
    }
  }, []);

  // Auto-connect when authenticated
  useEffect(() => {
    if (isSignedIn) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isSignedIn, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [clearTimers]);

  return {
    ...state,
    connect,
    disconnect,
    sendMessage,
    sendRaw,
  };
};

// =============================================================================
// CONVENIENCE HOOKS
// =============================================================================

// Type definitions for chat messages
interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  channel: string;
  timestamp: Date;
}

interface ChatUser {
  userId: string;
  username: string;
  isOnline: boolean;
}

interface UserJoinedData {
  userId: string;
  username: string;
  channel: string;
}

interface UserLeftData {
  userId: string;
  username: string;
  channel: string;
}

/**
 * Hook for chat functionality
 */
export const useWebSocketChat = (channel: string = 'general') => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);

  const ws = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'chat-message':
          const chatData = message.data as ChatMessage;
          setMessages(prev => [...prev, chatData]);
          break;
        case 'user-joined':
          const joinData = message.data as UserJoinedData;
          setUsers(prev => {
            const existing = prev.find(u => u.userId === joinData.userId);
            if (existing) {
              return prev.map(u => 
                u.userId === joinData.userId 
                  ? { ...u, isOnline: true }
                  : u
              );
            }
            return [...prev, { 
              userId: joinData.userId, 
              username: joinData.username, 
              isOnline: true 
            }];
          });
          break;
        case 'user-left':
          const leftData = message.data as UserLeftData;
          setUsers(prev => 
            prev.map(u => 
              u.userId === leftData.userId 
                ? { ...u, isOnline: false }
                : u
            )
          );
          break;
        case 'pong':
          // Handle heartbeat response
          console.debug('WebSocket heartbeat received');
          break;
      }
    },
  });

  // Join channel when connected
  useEffect(() => {
    if (ws.isConnected) {
      ws.sendMessage('join-channel', { channel });
    }
  }, [ws.isConnected, ws.sendMessage, channel]);

  const sendChatMessage = useCallback((content: string) => {
    ws.sendMessage('chat-message', {
      channel,
      content,
    });
  }, [ws, channel]);

  const joinChannel = useCallback((newChannel: string) => {
    ws.sendMessage('join-channel', { channel: newChannel });
  }, [ws]);

  const leaveChannel = useCallback((channelToLeave: string) => {
    ws.sendMessage('leave-channel', { channel: channelToLeave });
  }, [ws]);

  return {
    ...ws,
    messages,
    users,
    sendChatMessage,
    joinChannel,
    leaveChannel,
  };
};

// Type definitions for notifications
interface NotificationData {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
}

interface Notification extends NotificationData {
  read: boolean;
}

/**
 * Hook for notifications
 */
export const useWebSocketNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const ws = useWebSocket({
    onMessage: (message) => {
      if (message.type === 'notification') {
        const notificationData = message.data as NotificationData;
        setNotifications(prev => [
          {
            ...notificationData,
            read: false,
          },
          ...prev,
        ]);
      }
    },
  });

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId 
          ? { ...n, read: true }
          : n
      )
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    ...ws,
    notifications,
    unreadCount: notifications.filter(n => !n.read).length,
    markAsRead,
    clearNotifications,
  };
};