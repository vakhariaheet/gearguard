import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';

/**
 * Base handler for admin-only demo endpoint
 * This endpoint demonstrates admin-only access control
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { userId, email, role } = getAuthContext(event);
    
    console.info(`[Demo:adminOnly] Admin access granted: userId=${userId}, role=${role}`);
    
    return successResponse({
      message: 'Admin Access Granted',
      role,
      userId,
      email,
      accessLevel: 'admin',
      adminCapabilities: [
        'View all users',
        'Modify any user',
        'Delete users',
        'Access system settings',
        'View audit logs',
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Admin-only demo endpoint
 * 
 * Protected by RBAC - requires 'readAny' permission on 'admin' module
 * Only 'admin' role has this permission - 'user' role will get 403 Forbidden
 * 
 * @route GET /api/demo/admin
 */
export const handler = withRbac(baseHandler, 'admin', 'read');
