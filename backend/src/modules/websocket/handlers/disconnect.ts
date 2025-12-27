import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { WebSocketAPIGatewayEvent } from '../../../shared/types';

/**
 * Base handler for WebSocket disconnection
 * This handler is called when a client disconnects from the WebSocket API
 */
const baseHandler = async (
  event: WebSocketAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const connectionId = event.requestContext.connectionId;
    
    console.info(`[WebSocket:Disconnect] Connection closed: connectionId=${connectionId}`);
    
    // Here you could:
    // 1. Remove the connection ID from DynamoDB
    // 2. Clean up any user-specific resources
    // 3. Notify other users about the disconnection
    
    // For WebSocket $disconnect route, return simple 200 status
    return {
      statusCode: 200,
    };
  } catch (error) {
    console.error('[WebSocket:Disconnect] Error:', error);
    return {
      statusCode: 500,
    };
  }
};

/**
 * WebSocket disconnect handler
 * 
 * No RBAC needed for disconnect - it's a cleanup operation
 * 
 * @route $disconnect
 */
export const handler = baseHandler;