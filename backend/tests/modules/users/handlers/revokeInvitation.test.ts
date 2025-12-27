import { AuthenticatedAPIGatewayEvent } from '../../../../src/shared/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock ClerkUserService
const mockRevokeInvitation = jest.fn();

jest.mock('../../../../src/modules/users/services/ClerkUserService', () => ({
  ClerkUserService: jest.fn().mockImplementation(() => ({
    revokeInvitation: mockRevokeInvitation,
  })),
}));

// Mock RBAC middleware
jest.mock('../../../../src/shared/auth/rbacMiddleware', () => ({
  withRbac: jest.fn((handler) => handler),
}));

import { handler } from '../../../../src/modules/users/handlers/revokeInvitation';

describe('revokeInvitation Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should revoke invitation successfully', async () => {
    mockRevokeInvitation.mockResolvedValue(undefined);

    const event = {
      pathParameters: { invitationId: 'inv_123' },
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
    expect(body.data.message).toBe('Invitation revoked successfully');
    expect(mockRevokeInvitation).toHaveBeenCalledWith('inv_123');
  });

  it('should return 400 when invitationId is missing', async () => {
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
    expect(mockRevokeInvitation).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    mockRevokeInvitation.mockRejectedValue(new Error('Invitation not found'));

    const event = {
      pathParameters: { invitationId: 'inv_123' },
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
