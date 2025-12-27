import { AuthenticatedAPIGatewayEvent } from '../../../../src/shared/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock ClerkUserService
const mockUnbanUser = jest.fn();

jest.mock('../../../../src/modules/users/services/ClerkUserService', () => ({
  ClerkUserService: jest.fn().mockImplementation(() => ({
    unbanUser: mockUnbanUser,
  })),
}));

// Mock RBAC middleware
jest.mock('../../../../src/shared/auth/rbacMiddleware', () => ({
  withRbac: jest.fn((handler) => handler),
}));

import { handler } from '../../../../src/modules/users/handlers/unbanUser';

describe('unbanUser Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should unban user successfully', async () => {
    const mockUser = {
      id: 'user_123',
      email: 'user@test.com',
      banned: false,
    };

    mockUnbanUser.mockResolvedValue(mockUser);

    const event = {
      pathParameters: { userId: 'user_123' },
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

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.OK);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockUser);
    expect(mockUnbanUser).toHaveBeenCalledWith('user_123');
  });

  it('should return 400 when userId is missing', async () => {
    const event = {
      pathParameters: {},
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

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(mockUnbanUser).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    mockUnbanUser.mockRejectedValue(new Error('User not found'));

    const event = {
      pathParameters: { userId: 'user_123' },
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

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });
});
