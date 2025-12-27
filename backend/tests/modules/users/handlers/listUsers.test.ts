import { AuthenticatedAPIGatewayEvent } from '../../../../src/shared/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock ClerkUserService
const mockListUsers = jest.fn();

jest.mock('../../../../src/modules/users/services/ClerkUserService', () => ({
  ClerkUserService: jest.fn().mockImplementation(() => ({
    listUsers: mockListUsers,
  })),
}));

// Mock RBAC middleware
jest.mock('../../../../src/shared/auth/rbacMiddleware', () => ({
  withRbac: jest.fn((handler) => handler),
}));

import { handler } from '../../../../src/modules/users/handlers/listUsers';

describe('listUsers Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list users successfully with default parameters', async () => {
    const mockResult = {
      users: [
        { id: 'user_1', email: 'user1@test.com' },
        { id: 'user_2', email: 'user2@test.com' },
      ],
      totalCount: 2,
    };

    mockListUsers.mockResolvedValue(mockResult);

    const event = {
      queryStringParameters: null,
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
    expect(body.data).toEqual(mockResult);
    expect(mockListUsers).toHaveBeenCalledWith({});
  });

  it('should list users with query parameters', async () => {
    const mockResult = {
      users: [{ id: 'user_1', email: 'user1@test.com' }],
      totalCount: 1,
    };

    mockListUsers.mockResolvedValue(mockResult);

    const event = {
      queryStringParameters: {
        limit: '10',
        offset: '5',
        orderBy: 'created_at',
      },
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
    expect(mockListUsers).toHaveBeenCalledWith({
      limit: 10,
      offset: 5,
      orderBy: 'created_at',
    });
  });

  it('should ignore invalid limit parameter', async () => {
    const mockResult = { users: [], totalCount: 0 };
    mockListUsers.mockResolvedValue(mockResult);

    const event = {
      queryStringParameters: {
        limit: 'invalid',
      },
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
    expect(mockListUsers).toHaveBeenCalledWith({});
  });

  it('should ignore limit over 100', async () => {
    const mockResult = { users: [], totalCount: 0 };
    mockListUsers.mockResolvedValue(mockResult);

    const event = {
      queryStringParameters: {
        limit: '150',
      },
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
    expect(mockListUsers).toHaveBeenCalledWith({});
  });

  it('should ignore invalid offset parameter', async () => {
    const mockResult = { users: [], totalCount: 0 };
    mockListUsers.mockResolvedValue(mockResult);

    const event = {
      queryStringParameters: {
        offset: 'invalid',
      },
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
    expect(mockListUsers).toHaveBeenCalledWith({});
  });

  it('should ignore invalid orderBy parameter', async () => {
    const mockResult = { users: [], totalCount: 0 };
    mockListUsers.mockResolvedValue(mockResult);

    const event = {
      queryStringParameters: {
        orderBy: 'invalid_field',
      },
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
    expect(mockListUsers).toHaveBeenCalledWith({});
  });

  it('should handle service errors', async () => {
    mockListUsers.mockRejectedValue(new Error('Service error'));

    const event = {
      queryStringParameters: null,
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
