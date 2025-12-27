import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock ClerkUserService
const mockResendInvitation = jest.fn();

jest.mock('../../../../src/modules/users/services/ClerkUserService', () => ({
  ClerkUserService: jest.fn().mockImplementation(() => ({
    resendInvitation: mockResendInvitation,
  })),
}));

// Mock RBAC middleware
jest.mock('../../../../src/shared/auth/rbacMiddleware', () => ({
  withRbac: jest.fn((handler) => handler),
}));

import { handler } from '../../../../src/modules/users/handlers/resendInvitation';

describe('resendInvitation Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should resend invitation successfully', async () => {
    const mockResult = {
      newInvitationId: 'inv_new_123',
      emailAddress: 'user@test.com',
    };

    mockResendInvitation.mockResolvedValue(mockResult);

    const event = {
      pathParameters: { invitationId: 'inv_old_123' },
    } as APIGatewayProxyEventV2;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.OK);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Invitation resent successfully');
    expect(body.data.data.oldInvitationId).toBe('inv_old_123');
    expect(body.data.data.newInvitationId).toBe('inv_new_123');
    expect(body.data.data.emailAddress).toBe('user@test.com');
    expect(mockResendInvitation).toHaveBeenCalledWith('inv_old_123');
  });

  it('should return 400 when invitationId is missing', async () => {
    const event = {
      pathParameters: {},
    } as APIGatewayProxyEventV2;

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.data.error).toBe('Invitation ID is required');
    expect(mockResendInvitation).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    mockResendInvitation.mockRejectedValue(new Error('Invitation not found'));

    const event = {
      pathParameters: { invitationId: 'inv_123' },
    } as APIGatewayProxyEventV2;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });
});
