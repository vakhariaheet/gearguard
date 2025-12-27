import { AuthenticatedAPIGatewayEvent } from '../../../../src/shared/types';
import { UserRole } from '../../../../src/modules/users/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock ClerkUserService
const mockInviteUser = jest.fn();

jest.mock('../../../../src/modules/users/services/ClerkUserService', () => ({
  ClerkUserService: jest.fn().mockImplementation(() => ({
    inviteUser: mockInviteUser,
  })),
}));

// Mock RBAC middleware
jest.mock('../../../../src/shared/auth/rbacMiddleware', () => ({
  withRbac: jest.fn((handler) => handler),
}));

import { handler } from '../../../../src/modules/users/handlers/inviteUser';

describe('inviteUser Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should invite user successfully', async () => {
    const mockResult = {
      invitationId: 'inv_123',
      email: 'newuser@test.com',
      status: 'pending',
    };

    mockInviteUser.mockResolvedValue(mockResult);

    const event = {
      body: JSON.stringify({
        email: 'newuser@test.com',
        role: UserRole.USER,
        redirectUrl: 'https://app.example.com/signup',
      }),
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

    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Invitation sent successfully');
    expect(mockInviteUser).toHaveBeenCalledWith(
      'newuser@test.com',
      UserRole.USER,
      'https://app.example.com/signup'
    );
  });

  it('should use default role when not provided', async () => {
    const mockResult = {
      invitationId: 'inv_123',
      email: 'newuser@test.com',
      status: 'pending',
    };

    mockInviteUser.mockResolvedValue(mockResult);

    const event = {
      body: JSON.stringify({
        email: 'newuser@test.com',
      }),
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

    expect(response.statusCode).toBe(201);
    expect(mockInviteUser).toHaveBeenCalledWith('newuser@test.com', UserRole.USER, undefined);
  });

  it('should return 400 when body is missing', async () => {
    const event = {
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
    expect(mockInviteUser).not.toHaveBeenCalled();
  });

  it('should return 400 when email is missing', async () => {
    const event = {
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
    expect(mockInviteUser).not.toHaveBeenCalled();
  });

  it('should return 400 when email format is invalid', async () => {
    const event = {
      body: JSON.stringify({
        email: 'invalid-email',
      }),
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
    expect(mockInviteUser).not.toHaveBeenCalled();
  });

  it('should return 400 when JSON is invalid', async () => {
    const event = {
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
    expect(mockInviteUser).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    mockInviteUser.mockRejectedValue(new Error('Email already exists'));

    const event = {
      body: JSON.stringify({
        email: 'newuser@test.com',
      }),
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
