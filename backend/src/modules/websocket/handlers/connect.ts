import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { WebSocketAPIGatewayEvent } from '../../../shared/types';
import { verifyClerkJWT } from '../../../shared/auth/clerkAuth';

/**
 * Base handler for WebSocket connection
 * This handler is called when a client connects to the WebSocket API
 */
const baseHandler = async (
  event: WebSocketAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const connectionId = event.requestContext.connectionId;
    
    console.info(`[WebSocket:Connect] Connection attempt: connectionId=${connectionId}`);
    
    // TODO: Re-enable authentication after testing basic connection
    // Extract JWT token from query parameters
    const token = event.queryStringParameters?.['token'];
    
    if (token) {
      try {
        // Verify JWT token with Clerk
        const user = await verifyClerkJWT(token);
        
        if (user) {
          console.info(`[WebSocket:Connect] Authenticated connection: connectionId=${connectionId}, userId=${user.sub}, role=${user.role || 'user'}`);
        } else {
          console.warn(`[WebSocket:Connect] Invalid token: connectionId=${connectionId}`);
        }
      } catch (error) {
        console.error(`[WebSocket:Connect] Auth error: connectionId=${connectionId}`, error);
      }
    } else {
      console.info(`[WebSocket:Connect] Unauthenticated connection (testing): connectionId=${connectionId}`);
    }
    
    // Here you could:
    // 1. Store the connection ID with user info in DynamoDB
    // 2. Join the user to default channels based on their role
    // 3. Send initial
    
    // For WebSocket $connect route, return simple 200 status
    return {
      statusCode: 200,
    };
  } catch (error) {
    console.error('[WebSocket:Connect] Error:', error);
    return {
      statusCode: 500,
    };
  }
};

/**
 * WebSocket connect handler
 * 
 * @route $connect
 */
export const handler = baseHandler;