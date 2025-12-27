import { withRbac, withRbacOwn, withWebSocketRbac } from '../../../src/shared/auth/rbacMiddleware';
import {
  AuthenticatedAPIGatewayEvent,
  AuthenticatedWebSocketEvent,
} from '../../../src/shared/types';
import { successResponse, HTTP_STATUS } from '../../../src/shared/response';

describe('RBAC Middleware', () => {
  const mockHandler = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockHandler.mockResolvedValue(successResponse({ message: 'Success' }));
  });

  describe('withRbac', () => {
    it('should allow admin to access any module', async () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: 'user_123',
                email: 'admin@test.com',
                role: 'admin',
              },
            },
          },
        },
      } as AuthenticatedAPIGatewayEvent;

      const wrappedHandler = withRbac(mockHandler, 'users', 'read');
      const response = await wrappedHandler(event);

      expect(mockHandler).toHaveBeenCalledWith(event);
      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should allow user to read demo module', async () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: 'user_123',
                email: 'user@test.com',
                role: 'user',
              },
            },
          },
        },
      } as AuthenticatedAPIGatewayEvent;

      const wrappedHandler = withRbac(mockHandler, 'demo', 'read');
      const response = await wrappedHandler(event);

      expect(mockHandler).toHaveBeenCalledWith(event);
      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should deny user from accessing admin module', async () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: 'user_123',
                email: 'user@test.com',
                role: 'user',
              },
            },
          },
        },
      } as AuthenticatedAPIGatewayEvent;

      const wrappedHandler = withRbac(mockHandler, 'admin', 'read');
      const response = await wrappedHandler(event);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it('should handle missing JWT claims', async () => {
      const event = {
        requestContext: {
          authorizer: {},
        },
      } as any;

      const wrappedHandler = withRbac(mockHandler, 'users', 'read');
      const response = await wrappedHandler(event);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should handle unexpected errors', async () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: 'user_123',
                email: 'user@test.com',
                role: 'user',
              },
            },
          },
        },
      } as AuthenticatedAPIGatewayEvent;

      mockHandler.mockRejectedValue(new Error('Unexpected error'));

      const wrappedHandler = withRbac(mockHandler, 'demo', 'read');

      await expect(wrappedHandler(event)).rejects.toThrow('Unexpected error');
    });
  });

  describe('withRbacOwn', () => {
    it('should allow user with Own permission', async () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: 'user_123',
                email: 'user@test.com',
                role: 'user',
              },
            },
          },
        },
      } as AuthenticatedAPIGatewayEvent;

      const wrappedHandler = withRbacOwn(mockHandler, 'users', 'read');
      const response = await wrappedHandler(event);

      expect(mockHandler).toHaveBeenCalledWith(event);
      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should allow admin with Any permission', async () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: 'admin_123',
                email: 'admin@test.com',
                role: 'admin',
              },
            },
          },
        },
      } as AuthenticatedAPIGatewayEvent;

      const wrappedHandler = withRbacOwn(mockHandler, 'users', 'update');
      const response = await wrappedHandler(event);

      expect(mockHandler).toHaveBeenCalledWith(event);
      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should deny user without Own or Any permission', async () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: 'user_123',
                email: 'user@test.com',
                role: 'user',
              },
            },
          },
        },
      } as AuthenticatedAPIGatewayEvent;

      const wrappedHandler = withRbacOwn(mockHandler, 'users', 'delete');
      const response = await wrappedHandler(event);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it('should handle missing JWT claims', async () => {
      const event = {
        requestContext: {
          authorizer: {},
        },
      } as any;

      const wrappedHandler = withRbacOwn(mockHandler, 'users', 'read');
      const response = await wrappedHandler(event);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should handle unexpected errors', async () => {
      const event = {
        requestContext: {
          authorizer: {
            jwt: {
              claims: {
                sub: 'user_123',
                email: 'user@test.com',
                role: 'user',
              },
            },
          },
        },
      } as AuthenticatedAPIGatewayEvent;

      mockHandler.mockRejectedValue(new Error('Unexpected error'));

      const wrappedHandler = withRbacOwn(mockHandler, 'users', 'read');

      await expect(wrappedHandler(event)).rejects.toThrow('Unexpected error');
    });
  });

  describe('withWebSocketRbac', () => {
    it('should allow user to access websocket', async () => {
      const event = {
        requestContext: {
          connectionId: 'conn_123',
          authorizer: {
            jwt: {
              claims: {
                sub: 'user_123',
                email: 'user@test.com',
                role: 'user',
              },
            },
          },
        },
      } as AuthenticatedWebSocketEvent;

      const wrappedHandler = withWebSocketRbac(mockHandler, 'websocket', 'read');
      const response = await wrappedHandler(event);

      expect(mockHandler).toHaveBeenCalledWith(event);
      expect(response.statusCode).toBe(HTTP_STATUS.OK);
    });

    it('should deny unauthorized websocket access', async () => {
      const event = {
        requestContext: {
          connectionId: 'conn_123',
          authorizer: {},
        },
      } as any;

      const wrappedHandler = withWebSocketRbac(mockHandler, 'websocket', 'read');
      const response = await wrappedHandler(event);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should deny user without permission', async () => {
      const event = {
        requestContext: {
          connectionId: 'conn_123',
          authorizer: {
            jwt: {
              claims: {
                sub: 'user_123',
                email: 'user@test.com',
                role: 'user',
              },
            },
          },
        },
      } as AuthenticatedWebSocketEvent;

      const wrappedHandler = withWebSocketRbac(mockHandler, 'admin', 'read');
      const response = await wrappedHandler(event);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it('should handle unexpected errors', async () => {
      const event = {
        requestContext: {
          connectionId: 'conn_123',
          authorizer: {
            jwt: {
              claims: {
                sub: 'user_123',
                email: 'user@test.com',
                role: 'user',
              },
            },
          },
        },
      } as AuthenticatedWebSocketEvent;

      mockHandler.mockRejectedValue(new Error('Unexpected error'));

      const wrappedHandler = withWebSocketRbac(mockHandler, 'websocket', 'read');

      await expect(wrappedHandler(event)).rejects.toThrow('Unexpected error');
    });
  });
});
