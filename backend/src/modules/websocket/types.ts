/**
 * WebSocket Module Types
 * 
 * Type definitions for WebSocket-related operations
 */

// =============================================================================
// WEBSOCKET MESSAGE TYPES
// =============================================================================

export interface BaseWebSocketMessage {
  type: string;
  timestamp?: number;
  messageId?: string;
}

export interface PingMessage extends BaseWebSocketMessage {
  type: 'ping';
  data?: string;
}

export interface PongMessage extends BaseWebSocketMessage {
  type: 'pong';
  data: {
    timestamp: number;
  };
}

export interface JoinChannelMessage extends BaseWebSocketMessage {
  type: 'join-channel';
  data: {
    channel: string;
  };
}

export interface LeaveChannelMessage extends BaseWebSocketMessage {
  type: 'leave-channel';
  data: {
    channel: string;
  };
}

export interface ChatMessage extends BaseWebSocketMessage {
  type: 'chat-message';
  data: {
    messageId: string;
    userId: string;
    content: string;
    channel: string;
    timestamp: Date;
  };
}

export interface BroadcastMessage extends BaseWebSocketMessage {
  type: 'broadcast';
  data: {
    messageId: string;
    userId: string;
    content: string;
    timestamp: Date;
  };
}

export interface UserJoinedMessage extends BaseWebSocketMessage {
  type: 'user-joined';
  data: {
    userId: string;
    channel: string;
  };
}

export interface UserLeftMessage extends BaseWebSocketMessage {
  type: 'user-left';
  data: {
    userId: string;
    channel: string;
  };
}

export interface NotificationMessage extends BaseWebSocketMessage {
  type: 'notification';
  data: {
    notificationId: string;
    userId: string;
    title: string;
    content: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: Date;
  };
}

export interface ErrorMessage extends BaseWebSocketMessage {
  type: 'error';
  data: {
    error: string;
    code?: string;
    details?: any;
  };
}

// Union type for all WebSocket messages
export type WebSocketMessage = 
  | PingMessage
  | PongMessage
  | JoinChannelMessage
  | LeaveChannelMessage
  | ChatMessage
  | BroadcastMessage
  | UserJoinedMessage
  | UserLeftMessage
  | NotificationMessage
  | ErrorMessage;

// =============================================================================
// CONNECTION TYPES
// =============================================================================

export interface WebSocketConnection {
  connectionId: string;
  userId: string;
  email?: string;
  role?: string;
  connectedAt: Date;
  lastActivity: Date;
  channels: string[];
  metadata?: Record<string, any>;
}

export interface ChannelInfo {
  channelId: string;
  name: string;
  description?: string;
  isPrivate: boolean;
  members: string[];
  createdAt: Date;
  createdBy: string;
}

// =============================================================================
// REQUEST/RESPONSE TYPES
// =============================================================================

export interface SendMessageRequest {
  type: string;
  data: any;
  targetConnectionId?: string;
  channel?: string;
}

export interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface BroadcastRequest {
  message: WebSocketMessage;
  channel?: string;
  excludeConnectionId?: string;
}

export interface BroadcastResponse {
  success: boolean;
  recipientCount: number;
  failedCount: number;
  errors?: string[];
}

export interface ConnectionStatsResponse {
  totalConnections: number;
  connectionsByChannel: Record<string, number>;
  activeUsers: number;
  channels: string[];
}

// =============================================================================
// EVENT TYPES
// =============================================================================

export interface WebSocketEvent {
  requestContext: {
    connectionId: string;
    routeKey: string;
    eventType: 'CONNECT' | 'DISCONNECT' | 'MESSAGE';
    requestTime: string;
    requestTimeEpoch: number;
    apiId: string;
    stage: string;
  };
  body?: string;
  headers?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface WebSocketConfig {
  apiId: string;
  stage: string;
  region: string;
  endpoint?: string;
  defaultChannel?: string;
  maxConnections?: number;
  messageRateLimit?: number;
  heartbeatInterval?: number;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

export type MessageHandler<T extends WebSocketMessage = WebSocketMessage> = (
  connectionId: string,
  userId: string,
  message: T
) => Promise<any>;

export type ConnectionEventHandler = (
  connectionId: string,
  userId: string,
  event: 'connect' | 'disconnect'
) => Promise<void>;

export interface WebSocketMiddleware {
  onConnect?: ConnectionEventHandler;
  onDisconnect?: ConnectionEventHandler;
  onMessage?: MessageHandler;
  onError?: (error: Error, connectionId: string) => Promise<void>;
}