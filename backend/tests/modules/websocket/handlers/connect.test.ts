/// <reference types="jest" />

import { handler } from '../../../../src/modules/websocket/handlers/connect';
import { WebSocketAPIGatewayEvent } from '../../../../src/shared/types';
import { verifyClerkJWT } from '../../../../src/shared/auth/clerkAuth';

jest.mock('../../../../src/shared/auth/clerkAuth', () => ({
  verifyClerkJWT: jest.fn(),
}));

describe('WebSocket Connect Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accept connection with valid token', async () => {
    const mockUser = {
      sub: 'user_123',
      email: 'user@test.com',
      role: 'user',
    };

    (verifyClerkJWT as jest.Mock).mockResolvedValue(mockUser);

    const event = {
      requestContext: {
        connectionId: 'conn_123',
        routeKey: '$connect',
      },
      queryStringParameters: {
        token: 'valid_jwt_token',
      },
    } as any;

    const response = (await handler(event)) as any;

    expect(response.statusCode).toBe(200);
    expect(verifyClerkJWT).toHaveBeenCalledWith('valid_jwt_token');
  });

  it('should accept connection without token (testing mode)', async () => {
    const event = {
      requestContext: {
        connectionId: 'conn_123',
        routeKey: '$connect',
      },
      queryStringParameters: {},
    } as WebSocketAPIGatewayEvent;

    const response = (await handler(event)) as any;

    expect(response.statusCode).toBe(200);
  });

  it('should accept connection even with invalid token (logs warning)', async () => {
    (verifyClerkJWT as jest.Mock).mockResolvedValue(null);

    const event = {
      requestContext: {
        connectionId: 'conn_123',
        routeKey: '$connect',
      },
      queryStringParameters: {
        token: 'invalid_token',
      },
    } as any;

    const response = (await handler(event)) as any;

    expect(response.statusCode).toBe(200);
  });

  it('should handle auth errors gracefully', async () => {
    (verifyClerkJWT as jest.Mock).mockRejectedValue(new Error('Auth error'));

    const event = {
      requestContext: {
        connectionId: 'conn_123',
        routeKey: '$connect',
      },
      queryStringParameters: {
        token: 'token',
      },
    } as any;

    const response = (await handler(event)) as any;

    expect(response.statusCode).toBe(200);
  });
});
