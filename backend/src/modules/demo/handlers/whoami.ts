import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { successResponse, handleAsyncError, commonErrors } from '../../../shared/response';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { getRolePermissions } from '../../../config/permissions';

/**
 * Whoami endpoint - returns current user's authentication context and permissions
 * Useful for debugging and understanding what permissions the current user has
 * 
 * This endpoint does NOT use withRbac - it's accessible by any authenticated user
 * 
 * @route GET /api/demo/whoami
 */
export const handler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { userId, email, role } = getAuthContext(event);
    
    console.info(`[Demo:whoami] userId=${userId}, role=${role}`);
    
    // Get all permissions for the user's role
    const permissions = getRolePermissions(role);
    
    // Extract raw JWT claims for debugging
    const rawClaims = event.requestContext?.authorizer?.jwt?.claims;
    
    return successResponse({
      user: {
        userId,
        email,
        role,
      },
      permissions,
      jwtClaims: rawClaims ? {
        // Only include safe-to-expose claims
        sub: rawClaims.sub,
        iss: rawClaims.iss,
        aud: rawClaims.aud,
        exp: rawClaims.exp,
        iat: rawClaims.iat,
      } : null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // Handle case where JWT claims are missing
    if (error instanceof Error && error.message.includes('JWT claims')) {
      return commonErrors.unauthorized('Invalid or missing authentication token');
    }
    return handleAsyncError(error);
  }
};
