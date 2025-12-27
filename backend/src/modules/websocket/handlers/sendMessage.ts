import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { WebSocketAPIGatewayEvent } from '../../../shared/types';
import { WebSocketService } from '../services/WebSocketService';

const webSocketService = new WebSocketService();

/**
 * Base handler for sending WebSocket messages
 * This handler processes incoming WebSocket messages and routes them appropriately
 */
const baseHandler = async (
  event: WebSocketAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const connectionId = event.requestContext.connectionId;
    
    if (!event.body) {
      console.error('[WebSocket:SendMessage] No message body provided');
      return { statusCode: 400 };
    }

    const message = JSON.parse(event.body);
    
    console.info(`[WebSocket:SendMessage] Message from connectionId=${connectionId}, type=${message.type}`);
    
    // For now, we'll use the connectionId as userId since we can't easily get user info here
    // In a production app, you'd store the user info when they connect and retrieve it here
    const result = await webSocketService.handleMessage(connectionId, connectionId, message);
    
    console.info(`[WebSocket:SendMessage] Message processed successfully: ${JSON.stringify(result)}`);
    
    // For WebSocket message handlers, return simple 200 status
    return { statusCode: 200 };
  } catch (error) {
    console.error('[WebSocket:SendMessage] Error:', error);
    return { statusCode: 500 };
  }
};

/**
 * WebSocket message handler
 * 
 * @route sendMessage
 */
export const handler = baseHandler;