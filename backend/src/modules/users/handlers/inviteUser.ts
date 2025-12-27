import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ClerkUserService } from '../services/ClerkUserService';
import { InviteUserRequest, getAvailableRoles } from '../types';
import { successResponse, handleAsyncError, commonErrors } from '../../../shared/response';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';

const userService = new ClerkUserService();

/**
 * Base handler for inviting a new user (admin only)
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    if (!event.body) {
      return commonErrors.badRequest('Request body is required');
    }

    let inviteData: InviteUserRequest;
    try {
      inviteData = JSON.parse(event.body);
    } catch {
      return commonErrors.badRequest('Invalid JSON in request body');
    }

    if (!inviteData.email) {
      return commonErrors.badRequest('Email is required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteData.email)) {
      return commonErrors.badRequest('Invalid email format');
    }

    // Get default role dynamically
    const availableRoles = getAvailableRoles();
    const defaultRole = availableRoles.includes('user') ? 'user' : availableRoles[0];

    const result = await userService.inviteUser(
      inviteData.email,
      inviteData.role || defaultRole,
      inviteData.redirectUrl
    );

    return successResponse(
      {
        message: 'Invitation sent successfully',
        ...result,
      },
      201
    );
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Invite user handler - Admin only
 * Sends an invitation email via Clerk
 *
 * @route POST /api/admin/users/invite
 */
export const handler = withRbac(baseHandler, 'users', 'create');
