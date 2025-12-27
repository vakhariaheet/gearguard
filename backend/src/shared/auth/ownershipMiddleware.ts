import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ac } from '../../config/permissions';
import { 
  AuthenticatedAPIGatewayEvent, 
  getAuthContext, 
  LambdaHandler,
  OwnershipRepository 
} from '../types';
import { commonErrors } from '../response';

/**
 * Ownership Middleware factory
 * 
 * Creates a higher-order function that wraps handlers with ownership verification.
 * It checks if the authenticated user owns the resource being accessed.
 * 
 * @param repository - Repository instance with getById method
 * @param ownerField - Field name on the resource that contains the owner's user ID
 * @returns Higher-order function that wraps handlers with ownership checking
 * 
 * @example
 * ```typescript
 * // Create ownership checker for users using userId field
 * const checkUserOwnership = withOwnershipCheck(UserRepo, 'userId');
 * 
 * // Wrap your handler
 * export const handler = withRbacOwn(
 *   checkUserOwnership(baseHandler),
 *   'users',
 *   'update'
 * );
 * ```
 */
export const withOwnershipCheck = <T extends Record<string, unknown>>(
  repository: OwnershipRepository<T>,
  ownerField: keyof T
) => {
  /**
   * Higher-order function that wraps a handler with ownership verification
   */
  return (
    handler: LambdaHandler<AuthenticatedAPIGatewayEvent, APIGatewayProxyResultV2>
  ): LambdaHandler<AuthenticatedAPIGatewayEvent, APIGatewayProxyResultV2> => {
    return async (event: AuthenticatedAPIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
      try {
        // Extract authentication context
        const { userId, role } = getAuthContext(event);
        
        // Admin role bypasses ownership check (they have *Any permissions)
        // Check if user has any 'Any' permission on any resource
        const isAdmin = ac.can(role).readAny('users').granted;
        
        if (isAdmin) {
          console.info(`[Ownership] Admin bypass: userId=${userId}, role=${role}`);
          return handler(event);
        }
        
        // Extract resource ID from path parameters
        // Supports common patterns: /users/{id}, /users/{userId}, /items/{itemId}
        const resourceId = event.pathParameters?.['id'] 
          || event.pathParameters?.['userId'] 
          || event.pathParameters?.['resourceId'];
        
        if (!resourceId) {
          console.warn('[Ownership] Resource ID not found in path parameters');
          return commonErrors.badRequest('Resource ID is required');
        }
        
        // Fetch the resource from repository
        const resource = await repository.getById(resourceId);
        
        // Handle resource not found
        if (!resource) {
          console.warn(`[Ownership] Resource not found: id=${resourceId}`);
          return commonErrors.notFound('Resource');
        }
        
        // Check ownership
        const resourceOwnerId = resource[ownerField];
        const isOwner = resourceOwnerId === userId;
        
        console.info(
          `[Ownership] userId=${userId}, resourceId=${resourceId}, ` +
          `ownerField=${String(ownerField)}, resourceOwnerId=${resourceOwnerId}, isOwner=${isOwner}`
        );
        
        if (!isOwner) {
          console.warn(
            `[Ownership] Access denied: userId=${userId} attempted to access ` +
            `resource owned by ${resourceOwnerId}`
          );
          return commonErrors.forbidden('You can only access your own resources');
        }
        
        // Ownership verified - call the original handler
        return handler(event);
        
      } catch (error) {
        // Handle authentication errors
        if (error instanceof Error && error.message.includes('JWT claims')) {
          console.error('[Ownership] Authentication error:', error.message);
          return commonErrors.unauthorized('Invalid or missing authentication token');
        }
        
        // Handle repository errors
        console.error('[Ownership] Error checking ownership:', error);
        throw error;
      }
    };
  };
};

/**
 * Simplified ownership check for self-access patterns
 * 
 * Use this when the resource ID in the path is expected to match the user's own ID.
 * Common for endpoints like GET /users/me or PUT /users/{userId} where
 * userId should match the authenticated user.
 * 
 * @param handler - The Lambda handler to wrap
 * @param pathParamName - Name of the path parameter containing the user ID (default: 'userId')
 * @returns Wrapped handler that verifies self-access
 * 
 * @example
 * ```typescript
 * // Only allow users to access their own profile
 * export const handler = withSelfAccess(
 *   async (event) => {
 *     // Handler code - guaranteed userId matches authenticated user
 *   },
 *   'userId'
 * );
 * ```
 */
export const withSelfAccess = (
  handler: LambdaHandler<AuthenticatedAPIGatewayEvent, APIGatewayProxyResultV2>,
  pathParamName: string = 'userId'
): LambdaHandler<AuthenticatedAPIGatewayEvent, APIGatewayProxyResultV2> => {
  return async (event: AuthenticatedAPIGatewayEvent): Promise<APIGatewayProxyResultV2> => {
    try {
      const { userId, role } = getAuthContext(event);
      
      // Admin bypass
      if (role === 'admin') {
        console.info(`[SelfAccess] Admin bypass: userId=${userId}`);
        return handler(event);
      }
      
      // Get the user ID from path
      const pathUserId = event.pathParameters?.[pathParamName];
      
      if (!pathUserId) {
        console.warn(`[SelfAccess] Path parameter '${pathParamName}' not found`);
        return commonErrors.badRequest(`Path parameter '${pathParamName}' is required`);
      }
      
      // Check if accessing own resource
      const isSelf = pathUserId === userId;
      
      console.info(
        `[SelfAccess] userId=${userId}, pathUserId=${pathUserId}, isSelf=${isSelf}`
      );
      
      if (!isSelf) {
        console.warn(
          `[SelfAccess] Access denied: userId=${userId} attempted to access ${pathUserId}'s resource`
        );
        return commonErrors.forbidden('You can only access your own resources');
      }
      
      return handler(event);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('JWT claims')) {
        console.error('[SelfAccess] Authentication error:', error.message);
        return commonErrors.unauthorized('Invalid or missing authentication token');
      }
      throw error;
    }
  };
};
