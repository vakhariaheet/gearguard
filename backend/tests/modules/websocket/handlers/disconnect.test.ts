import { handler } from '../../../../src/modules/websocket/handlers/disconnect';
import { WebSocketAPIGatewayEvent } from '../../../../src/shared/types';

describe('WebSocket Disconnect Handler', () => {
  it('should handle disconnection successfully', async () => {
    const event = {
      requestContext: {
        connectionId: 'conn_123',
        routeKey: '$disconnect',
      },
    } as WebSocketAPIGatewayEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
  });

  it('should handle errors gracefully', async () => {
    const event = {
      requestContext: {
        connectionId: undefined,
        routeKey: '$disconnect',
      },
    } as any;

    const response = await handler(event);

    // Should still return 200 even with errors (disconnect should always succeed)
    expect(response.statusCode).toBe(200);
  });
});
