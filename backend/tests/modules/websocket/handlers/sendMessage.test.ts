import { WebSocketAPIGatewayEvent } from '../../../../src/shared/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock WebSocketService BEFORE importing the handler
const mockHandleMessage = jest.fn();

jest.mock('../../../../src/modules/websocket/services/WebSocketService', () => ({
  WebSocketService: jest.fn().mockImplementation(() => ({
    handleMessage: mockHandleMessage,
  })),
}));

// Import handler AFTER the mock is set up
import { handler } from '../../../../src/modules/websocket/handlers/sendMessage';

describe('WebSocket SendMessage Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHandleMessage.mockResolvedValue({ success: true });
  });

  it('should handle valid message', async () => {
    const event = {
      requestContext: {
        connectionId: 'conn_123',
        routeKey: 'sendMessage',
      },
      body: JSON.stringify({
        type: 'ping',
        data: {},
      }),
    } as WebSocketAPIGatewayEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.OK);
    expect(mockHandleMessage).toHaveBeenCalledWith('conn_123', 'conn_123', {
      type: 'ping',
      data: {},
    });
  });

  it('should reject invalid JSON', async () => {
    const event = {
      requestContext: {
        connectionId: 'conn_123',
        routeKey: 'sendMessage',
      },
      body: 'invalid json',
    } as WebSocketAPIGatewayEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(500); // JSON parse error returns 500
  });

  it('should reject missing body', async () => {
    const event = {
      requestContext: {
        connectionId: 'conn_123',
        routeKey: 'sendMessage',
      },
      body: undefined,
    } as any;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
  });
});
