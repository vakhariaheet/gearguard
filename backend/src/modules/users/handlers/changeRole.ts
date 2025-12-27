import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ClerkUserService } from '../services/ClerkUserService';
import { ChangeRoleRequest, getAvailableRoles } from '../types';
import { successResponse, handleAsyncError, commonErrors } from '../../../shared/response';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';

const userService = new ClerkUserService();

/**
 * Base handler for changing a user's role (admin only)
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = event.pathParameters?.['userId'];
    if (!userId) {
      return commonErrors.badRequest('User ID is required');
    }

    if (!event.body) {
      return commonErrors.badRequest('Request body is required');
    }

    let roleData: ChangeRoleRequest;
    try {
      roleData = JSON.parse(event.body);
    } catch {
      return commonErrors.badRequest('Invalid JSON in request body');
    }

    if (!roleData.role) {
      return commonErrors.badRequest('Role is required');
    }

    // Validate role against available roles from permissions config
    const availableRoles = getAvailableRoles();
    if (!availableRoles.includes(roleData.role)) {
      return commonErrors.badRequest(`Invalid role. Must be one of: ${availableRoles.join(', ')}`);
    }

    const { userId: adminUserId } = getAuthContext(event);
    const user = await userService.changeUserRole(userId, roleData.role, adminUserId);

    return successResponse(user);
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Change user role handler - Admin only
 * Updates a user's role via Clerk publicMetadata
 *
 * @route PUT /api/admin/users/{userId}/role
 */
export const handler = withRbac(baseHandler, 'users', 'update');
