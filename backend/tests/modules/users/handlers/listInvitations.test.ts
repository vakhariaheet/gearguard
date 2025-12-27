import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock ClerkUserService
const mockListInvitations = jest.fn();

jest.mock('../../../../src/modules/users/services/ClerkUserService', () => ({
  ClerkUserService: jest.fn().mockImplementation(() => ({
    listInvitations: mockListInvitations,
  })),
}));

// Mock RBAC middleware
jest.mock('../../../../src/shared/auth/rbacMiddleware', () => ({
  withRbac: jest.fn((handler) => handler),
}));

import { handler } from '../../../../src/modules/users/handlers/listInvitations';

describe('listInvitations Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should list invitations successfully with default parameters', async () => {
    const mockResult = {
      invitations: [
        { id: 'inv_1', email: 'user1@test.com', status: 'pending' },
        { id: 'inv_2', email: 'user2@test.com', status: 'pending' },
      ],
      totalCount: 2,
    };

    mockListInvitations.mockResolvedValue(mockResult);

    const event = {
      queryStringParameters: null,
    } as APIGatewayProxyEventV2;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.OK);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data).toEqual(mockResult);
    expect(mockListInvitations).toHaveBeenCalledWith({
      limit: undefined,
      offset: undefined,
      email: undefined,
    });
  });

  it('should list invitations with query parameters', async () => {
    const mockResult = {
      invitations: [{ id: 'inv_1', email: 'user1@test.com', status: 'pending' }],
      totalCount: 1,
    };

    mockListInvitations.mockResolvedValue(mockResult);

    const event = {
      queryStringParameters: {
        limit: '10',
        offset: '5',
        email: 'user1@test.com',
      },
    } as APIGatewayProxyEventV2;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.OK);
    expect(mockListInvitations).toHaveBeenCalledWith({
      limit: 10,
      offset: 5,
      email: 'user1@test.com',
    });
  });

  it('should handle invalid query parameters', async () => {
    const mockResult = { invitations: [], totalCount: 0 };
    mockListInvitations.mockResolvedValue(mockResult);

    const event = {
      queryStringParameters: {
        limit: 'invalid',
        offset: 'invalid',
      },
    } as APIGatewayProxyEventV2;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.OK);
    expect(mockListInvitations).toHaveBeenCalledWith({
      limit: NaN,
      offset: NaN,
      email: undefined,
    });
  });

  it('should handle service errors', async () => {
    mockListInvitations.mockRejectedValue(new Error('Service error'));

    const event = {
      queryStringParameters: null,
    } as APIGatewayProxyEventV2;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });
});
