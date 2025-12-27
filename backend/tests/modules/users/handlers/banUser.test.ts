import { AuthenticatedAPIGatewayEvent } from '../../../../src/shared/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock ClerkUserService
const mockBanUser = jest.fn();

jest.mock('../../../../src/modules/users/services/ClerkUserService', () => ({
  ClerkUserService: jest.fn().mockImplementation(() => ({
    banUser: mockBanUser,
  })),
}));

// Mock RBAC middleware
jest.mock('../../../../src/shared/auth/rbacMiddleware', () => ({
  withRbac: jest.fn((handler) => handler),
}));

import { handler } from '../../../../src/modules/users/handlers/banUser';

describe('banUser Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should ban user successfully', async () => {
    const mockUser = {
      id: 'user_123',
      email: 'user@test.com',
      banned: true,
    };

    mockBanUser.mockResolvedValue(mockUser);

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
    expect(mockBanUser).toHaveBeenCalledWith('user_123', 'admin_123');
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
    expect(mockBanUser).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    mockBanUser.mockRejectedValue(new Error('User not found'));

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
