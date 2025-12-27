/**
 * WebSocket Service
 * 
 * Service for managing WebSocket connections and message routing
 * Demonstrates usage of the WebSocket client wrapper
 */

import { ApiGatewayManagementApiClient, PostToConnectionCommand } from '@aws-sdk/client-apigatewaymanagementapi';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('WebSocketService');

// =============================================================================
// TYPES
// =============================================================================

export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp?: number;
  messageId?: string;
}

export interface WebSocketConnection {
  connectionId: string;
  userId: string;
  connectedAt: Date;
  lastActivity: Date;
  channels: string[];
}

export interface ChatMessage {
  messageId: string;
  userId: string;
  content: string;
  channel: string;
  timestamp: Date;
}

export interface NotificationMessage {
  notificationId: string;
  userId: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
}

// =============================================================================
// WEBSOCKET SERVICE CLASS
// =============================================================================

export class WebSocketService {
  private apiGatewayClient: ApiGatewayManagementApiClient;
  private connections: Map<string, WebSocketConnection> = new Map();

  constructor() {
    // Initialize API Gateway Management API client
    const endpoint = process.env['WEBSOCKET_API_ENDPOINT'] || 
                    `https://${process.env['WEBSOCKET_API_ID']}.execute-api.${process.env['AWS_REGION'] || 'ap-south-1'}.amazonaws.com/${process.env['STAGE'] || 'dev'}`;
    
    this.apiGatewayClient = new ApiGatewayManagementApiClient({
      endpoint,
      region: process.env['AWS_REGION'] || 'ap-south-1',
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  async handleMessage(connectionId: string, userId: string, message: WebSocketMessage): Promise<any> {
    logger.info('Processing WebSocket message', { 
      connectionId, 
      userId, 
      type: message.type 
    });

    switch (message.type) {
      case 'ping':
        return this.handlePing(connectionId);
      
      case 'join-channel':
        return this.handleJoinChannel(connectionId, userId, message.data as { channel: string });
      
      case 'leave-channel':
        return this.handleLeaveChannel(connectionId, userId, message.data as { channel: string });
      
      case 'chat-message':
        return this.handleChatMessage(connectionId, userId, message.data as { channel: string; content: string });
      
      case 'broadcast':
        return this.handleBroadcast(connectionId, userId, message.data as { content: string });
      
      default:
        logger.warn('Unknown message type', { type: message.type });
        return { error: 'Unknown message type' };
    }
  }

  /**
   * Send message to a specific connection
   */
  async sendToConnection(connectionId: string, message: WebSocketMessage): Promise<void> {
    try {
      const command = new PostToConnectionCommand({
        ConnectionId: connectionId,
        Data: JSON.stringify(message),
      });

      await this.apiGatewayClient.send(command);
      logger.debug('Message sent to connection', { connectionId, type: message.type });
    } catch (error: any) {
      if (error.statusCode === 410) {
        // Connection is gone, remove it
        logger.info('Connection gone, removing', { connectionId });
        this.connections.delete(connectionId);
      } else {
        logger.error('Failed to send message to connection', error, { connectionId });
        throw error;
      }
    }  
  }

  /**
   * Broadcast message to all connections in a channel
   */
  async broadcastToChannel(channel: string, message: WebSocketMessage, excludeConnectionId?: string): Promise<void> {
    const channelConnections = Array.from(this.connections.values())
      .filter(conn => conn.channels.includes(channel) && conn.connectionId !== excludeConnectionId);

    const promises = channelConnections.map(conn => 
      this.sendToConnection(conn.connectionId, message).catch(error => {
        logger.error('Failed to broadcast to connection', error, { 
          connectionId: conn.connectionId,
          channel 
        });
      })
    );

    await Promise.allSettled(promises);
    logger.info('Broadcast completed', { 
      channel, 
      recipients: channelConnections.length,
      excluded: excludeConnectionId 
    });
  }

  /**
   * Broadcast message to all connections
   */
  async broadcastToAll(message: WebSocketMessage, excludeConnectionId?: string): Promise<void> {
    const allConnections = Array.from(this.connections.values())
      .filter(conn => conn.connectionId !== excludeConnectionId);

    const promises = allConnections.map(conn => 
      this.sendToConnection(conn.connectionId, message).catch(error => {
        logger.error('Failed to broadcast to connection', error, { 
          connectionId: conn.connectionId 
        });
      })
    );

    await Promise.allSettled(promises);
    logger.info('Global broadcast completed', { 
      recipients: allConnections.length,
      excluded: excludeConnectionId 
    });
  }

  /**
   * Add connection
   */
  addConnection(connectionId: string, userId: string): void {
    const connection: WebSocketConnection = {
      connectionId,
      userId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      channels: [],
    };

    this.connections.set(connectionId, connection);
    logger.info('Connection added', { connectionId, userId });
  }

  /**
   * Remove connection
   */
  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
    logger.info('Connection removed', { connectionId });
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    connectionsByChannel: Record<string, number>;
    activeUsers: number;
  } {
    const connections = Array.from(this.connections.values());
    const channelStats: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    connections.forEach(conn => {
      uniqueUsers.add(conn.userId);
      conn.channels.forEach(channel => {
        channelStats[channel] = (channelStats[channel] || 0) + 1;
      });
    });

    return {
      totalConnections: connections.length,
      connectionsByChannel: channelStats,
      activeUsers: uniqueUsers.size,
    };
  }

  // ===========================================================================
  // PRIVATE MESSAGE HANDLERS
  // ===========================================================================

  private async handlePing(connectionId: string): Promise<any> {
    await this.sendToConnection(connectionId, {
      type: 'pong',
      data: { timestamp: Date.now() },
      timestamp: Date.now(),
    });

    return { type: 'pong' };
  }

  private async handleJoinChannel(connectionId: string, userId: string, data: { channel: string }): Promise<any> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (!connection.channels.includes(data.channel)) {
      connection.channels.push(data.channel);
      connection.lastActivity = new Date();

      // Notify channel about new member
      await this.broadcastToChannel(data.channel, {
        type: 'user-joined',
        data: { userId, channel: data.channel },
        timestamp: Date.now(),
      }, connectionId);

      logger.info('User joined channel', { userId, channel: data.channel });
    }

    return { joined: data.channel };
  }

  private async handleLeaveChannel(connectionId: string, userId: string, data: { channel: string }): Promise<any> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const channelIndex = connection.channels.indexOf(data.channel);
    if (channelIndex > -1) {
      connection.channels.splice(channelIndex, 1);
      connection.lastActivity = new Date();

      // Notify channel about member leaving
      await this.broadcastToChannel(data.channel, {
        type: 'user-left',
        data: { userId, channel: data.channel },
        timestamp: Date.now(),
      }, connectionId);

      logger.info('User left channel', { userId, channel: data.channel });
    }

    return { left: data.channel };
  }

  private async handleChatMessage(connectionId: string, userId: string, data: { channel: string; content: string }): Promise<any> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    if (!connection.channels.includes(data.channel)) {
      throw new Error('Not a member of this channel');
    }

    const chatMessage: ChatMessage = {
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      content: data.content,
      channel: data.channel,
      timestamp: new Date(),
    };

    // Broadcast to channel
    await this.broadcastToChannel(data.channel, {
      type: 'chat-message',
      data: chatMessage,
      timestamp: Date.now(),
    });

    connection.lastActivity = new Date();
    logger.info('Chat message sent', { userId, channel: data.channel, messageId: chatMessage.messageId });

    return { messageId: chatMessage.messageId };
  }

  private async handleBroadcast(connectionId: string, userId: string, data: { content: string }): Promise<any> {
    // Only allow admins to broadcast (you might want to add RBAC check here)
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error('Connection not found');
    }

    const broadcastMessage = {
      messageId: `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      content: data.content,
      timestamp: new Date(),
    };

    // Broadcast to all connections
    await this.broadcastToAll({
      type: 'broadcast',
      data: broadcastMessage,
      timestamp: Date.now(),
    }, connectionId);

    connection.lastActivity = new Date();
    logger.info('Broadcast message sent', { userId, messageId: broadcastMessage.messageId });

    return { messageId: broadcastMessage.messageId };
  }
}

export default WebSocketService;