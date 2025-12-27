import { AuthenticatedAPIGatewayEvent } from '../../../../src/shared/types';
import { UserRole } from '../../../../src/modules/users/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock ClerkUserService BEFORE importing the handler
const mockGetAdminStats = jest.fn();

jest.mock('../../../../src/modules/users/services/ClerkUserService', () => ({
  ClerkUserService: jest.fn().mockImplementation(() => ({
    getAdminStats: mockGetAdminStats,
  })),
}));

// Import handler AFTER the mock is set up
import { handler } from '../../../../src/modules/users/handlers/getAdminStats';

describe('getAdminStats Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return admin stats for admin user', async () => {
    const mockStats = {
      totalUsers: 100,
      activeUsers: 90,
      bannedUsers: 10,
      usersByRole: {
        [UserRole.ADMIN]: 5,
        [UserRole.USER]: 95,
      },
    };

    mockGetAdminStats.mockResolvedValue(mockStats);

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

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.OK);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockStats);
  });

  it('should deny access for non-admin user', async () => {
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

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    expect(mockGetAdminStats).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    mockGetAdminStats.mockRejectedValue(new Error('Service error'));

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

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });
});
