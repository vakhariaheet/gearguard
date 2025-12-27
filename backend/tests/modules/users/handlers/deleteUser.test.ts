import { AuthenticatedAPIGatewayEvent } from '../../../../src/shared/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock ClerkUserService
const mockDeleteUser = jest.fn();

jest.mock('../../../../src/modules/users/services/ClerkUserService', () => ({
  ClerkUserService: jest.fn().mockImplementation(() => ({
    deleteUser: mockDeleteUser,
  })),
}));

// Mock RBAC middleware
jest.mock('../../../../src/shared/auth/rbacMiddleware', () => ({
  withRbac: jest.fn((handler) => handler),
}));

import { handler } from '../../../../src/modules/users/handlers/deleteUser';

describe('deleteUser Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should delete user successfully', async () => {
    mockDeleteUser.mockResolvedValue(undefined);

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
    expect(body.data.message).toBe('User deleted successfully');
    expect(body.data.userId).toBe('user_123');
    expect(mockDeleteUser).toHaveBeenCalledWith('user_123', 'admin_123');
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
    expect(mockDeleteUser).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    mockDeleteUser.mockRejectedValue(new Error('User not found'));

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
