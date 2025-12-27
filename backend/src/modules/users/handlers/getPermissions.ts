import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import {
  getRolePermissions,
  getAvailableRoles,
  getAvailableModules,
  getAvailableActions,
} from '../../../config/permissions';

/**
 * Base handler for getting system permissions and roles (admin only)
 */
const baseHandler = async (
  _event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Get all available roles from the permissions configuration
    const roles = getAvailableRoles();

    // Get detailed permissions for each role
    const rolePermissions = roles.reduce(
      (acc, role) => {
        acc[role] = getRolePermissions(role);
        return acc;
      },
      {} as Record<string, Record<string, string[]>>
    );

    const response = {
      roles,
      permissions: rolePermissions,
      modules: getAvailableModules(),
      actions: getAvailableActions(),
    };

    return successResponse(response);
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Get system permissions and roles handler - Admin only
 * Returns available roles, their permissions, and system configuration
 *
 * @route GET /api/admin/permissions
 */
export const handler = withRbac(baseHandler, 'admin', 'read');
