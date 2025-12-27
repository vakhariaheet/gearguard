import { AuthenticatedAPIGatewayEvent } from '../../../../src/shared/types';
import { UserRole } from '../../../../src/modules/users/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock ClerkUserService
const mockChangeUserRole = jest.fn();

jest.mock('../../../../src/modules/users/services/ClerkUserService', () => ({
  ClerkUserService: jest.fn().mockImplementation(() => ({
    changeUserRole: mockChangeUserRole,
  })),
}));

// Mock RBAC middleware
jest.mock('../../../../src/shared/auth/rbacMiddleware', () => ({
  withRbac: jest.fn((handler) => handler),
}));

import { handler } from '../../../../src/modules/users/handlers/changeRole';

describe('changeRole Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should change user role successfully', async () => {
    const mockUser = {
      id: 'user_123',
      email: 'user@test.com',
      role: UserRole.ADMIN,
    };

    mockChangeUserRole.mockResolvedValue(mockUser);

    const event = {
      pathParameters: { userId: 'user_123' },
      body: JSON.stringify({ role: UserRole.ADMIN }),
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
    expect(mockChangeUserRole).toHaveBeenCalledWith('user_123', UserRole.ADMIN, 'admin_123');
  });

  it('should return 400 when userId is missing', async () => {
    const event = {
      pathParameters: {},
      body: JSON.stringify({ role: UserRole.ADMIN }),
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
    expect(mockChangeUserRole).not.toHaveBeenCalled();
  });

  it('should return 400 when body is missing', async () => {
    const event = {
      pathParameters: { userId: 'user_123' },
      body: undefined,
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
    expect(mockChangeUserRole).not.toHaveBeenCalled();
  });

  it('should return 400 when role is missing', async () => {
    const event = {
      pathParameters: { userId: 'user_123' },
      body: JSON.stringify({}),
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
    expect(mockChangeUserRole).not.toHaveBeenCalled();
  });

  it('should return 400 when role is invalid', async () => {
    const event = {
      pathParameters: { userId: 'user_123' },
      body: JSON.stringify({ role: 'invalid_role' }),
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
    expect(mockChangeUserRole).not.toHaveBeenCalled();
  });

  it('should return 400 when JSON is invalid', async () => {
    const event = {
      pathParameters: { userId: 'user_123' },
      body: 'invalid json',
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
    expect(mockChangeUserRole).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    mockChangeUserRole.mockRejectedValue(new Error('User not found'));

    const event = {
      pathParameters: { userId: 'user_123' },
      body: JSON.stringify({ role: UserRole.ADMIN }),
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
