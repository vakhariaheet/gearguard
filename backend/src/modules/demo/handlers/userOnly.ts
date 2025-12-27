import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';

/**
 * Base handler for user-level demo endpoint
 * This endpoint is accessible by any authenticated user with 'demo' read permission
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { userId, email, role } = getAuthContext(event);
    
    console.info(`[Demo:userOnly] Accessed by userId=${userId}, role=${role}`);
    
    return successResponse({
      message: 'Hello User!',
      role,
      userId,
      email,
      accessLevel: 'user',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * User-only demo endpoint
 * 
 * Protected by RBAC - requires 'readAny' permission on 'demo' module
 * Both 'user' and 'admin' roles have this permission
 * 
 * @route GET /api/demo/user
 */
export const handler = withRbac(baseHandler, 'demo', 'read');
