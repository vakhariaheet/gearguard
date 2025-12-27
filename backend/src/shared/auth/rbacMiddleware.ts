import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ac, Action } from '../../config/permissions';
import { 
  AuthenticatedAPIGatewayEvent, 
  AuthenticatedWebSocketEvent,
  getAuthContext, 
  getWebSocketAuthContext,
  LambdaHandler,
  WebSocketHandler
} from '../types';
import { commonErrors } from '../response';

/**
 * Maps simple action names to accesscontrol method names
 * By default, checks *Any permission first
 */
const mapActionToMethod = (action: Action): `${Action}Any` => {
  return `${action}Any` as `${Action}Any`;
};

/**
 * RBAC Middleware wrapper for Lambda handlers
 * 
 * Checks if the authenticated user's role has permission to perform
 * the specified action on the specified module.
 * 
 * @param handler - The Lambda handler to wrap
 * @param moduleName - The module/resource being accessed (e.g., 'users', 'demo')
 * @param actionName - The action being performed (e.g., 'create', 'read', 'update', 'delete')
 * @returns Wrapped handler that performs RBAC check before executing
 * 
 * @example
 * ```typescript
 * // Protect a handler that reads from the demo module
 * export const handler = withRbac(
 *   async (event) => {
 *     return successResponse({ message: 'Hello!' });
 *   },
 *   'demo',
 *   'read'
 * );
 * ```
 */
export const withRbac = <TEvent extends AuthenticatedAPIGatewayEvent>(
  handler: LambdaHandler<TEvent, APIGatewayProxyResultV2>,
  moduleName: string,
  actionName: Action
): LambdaHandler<TEvent, APIGatewayProxyResultV2> => {
  return async (event: TEvent): Promise<APIGatewayProxyResultV2> => {
    try {
      // Extract authentication context from JWT claims
      const { userId, email, role } = getAuthContext(event);
      
      // Map simple action to accesscontrol method name
      const mappedAction = mapActionToMethod(actionName);
      
      // Check permission using accesscontrol
      const permission = ac.can(role)[mappedAction](moduleName);
      const granted = permission.granted;
      
      // Audit log for security monitoring
      console.info(
        `[RBAC] userId=${userId}, email=${email}, role=${role}, ` +
        `action=${actionName}, module=${moduleName}, granted=${granted}`
      );
      
      // If permission denied, return 403 Forbidden
      if (!granted) {
        console.warn(
          `[RBAC] Access denied: userId=${userId}, role=${role}, ` +
          `attempted ${actionName} on ${moduleName}`
        );
        return commonErrors.forbidden(
          `You don't have permission to ${actionName} ${moduleName}`
        );
      }
      
      // Permission granted - call the original handler
      return handler(event);
      
    } catch (error) {
      // Handle authentication context extraction errors
      if (error instanceof Error && error.message.includes('JWT claims')) {
        console.error('[RBAC] Authentication error:', error.message);
        return commonErrors.unauthorized('Invalid or missing authentication token');
      }
      
      // Re-throw unexpected errors
      console.error('[RBAC] Unexpected error:', error);
      throw error;
    }
  };
};

/**
 * RBAC Middleware with Own permission check
 * 
 * Similar to withRbac but checks *Own permissions instead of *Any.
 * Use this when you need to verify the user can access their own resources
 * but the actual ownership verification is done by ownershipMiddleware.
 * 
 * @param handler - The Lambda handler to wrap
 * @param moduleName - The module/resource being accessed
 * @param actionName - The action being performed
 * @returns Wrapped handler that performs RBAC Own check
 */
export const withRbacOwn = <TEvent extends AuthenticatedAPIGatewayEvent>(
  handler: LambdaHandler<TEvent, APIGatewayProxyResultV2>,
  moduleName: string,
  actionName: Action
): LambdaHandler<TEvent, APIGatewayProxyResultV2> => {
  return async (event: TEvent): Promise<APIGatewayProxyResultV2> => {
    try {
      const { userId, email, role } = getAuthContext(event);
      
      // Check Own permission
      const ownMethod = `${actionName}Own` as `${Action}Own`;
      const ownPermission = ac.can(role)[ownMethod](moduleName);
      
      // Also check Any permission (admins typically have *Any)
      const anyMethod = `${actionName}Any` as `${Action}Any`;
      const anyPermission = ac.can(role)[anyMethod](moduleName);
      
      const granted = ownPermission.granted || anyPermission.granted;
      
      console.info(
        `[RBAC-Own] userId=${userId}, email=${email}, role=${role}, ` +
        `action=${actionName}, module=${moduleName}, granted=${granted}`
      );
      
      if (!granted) {
        console.warn(
          `[RBAC-Own] Access denied: userId=${userId}, role=${role}, ` +
          `attempted ${actionName} on ${moduleName}`
        );
        return commonErrors.forbidden(
          `You don't have permission to ${actionName} ${moduleName}`
        );
      }
      
      return handler(event);
      
    } catch (error) {
      if (error instanceof Error && error.message.includes('JWT claims')) {
        console.error('[RBAC-Own] Authentication error:', error.message);
        return commonErrors.unauthorized('Invalid or missing authentication token');
      }
      throw error;
    }
  };
};

/**
 * RBAC Middleware wrapper for WebSocket Lambda handlers
 * 
 * Similar to withRbac but designed for WebSocket events
 * 
 * @param handler - The WebSocket Lambda handler to wrap
 * @param moduleName - The module/resource being accessed
 * @param actionName - The action being performed
 * @returns Wrapped handler that performs RBAC check before executing
 */
export const withWebSocketRbac = (
  handler: WebSocketHandler<APIGatewayProxyResultV2>,
  moduleName: string,
  actionName: Action
): WebSocketHandler<APIGatewayProxyResultV2> => {
  return async (event: AuthenticatedWebSocketEvent): Promise<APIGatewayProxyResultV2> => {
    try {
      // Extract authentication context from JWT claims
      const { userId, email, role } = getWebSocketAuthContext(event);
      
      // Map simple action to accesscontrol method name
      const mappedAction = mapActionToMethod(actionName);
      
      // Check permission using accesscontrol
      const permission = ac.can(role)[mappedAction](moduleName);
      const granted = permission.granted;
      
      // Audit log for security monitoring
      console.info(
        `[WebSocket-RBAC] connectionId=${event.requestContext.connectionId}, ` +
        `userId=${userId}, email=${email}, role=${role}, ` +
        `action=${actionName}, module=${moduleName}, granted=${granted}`
      );
      
      // If permission denied, return 403 Forbidden
      if (!granted) {
        console.warn(
          `[WebSocket-RBAC] Access denied: connectionId=${event.requestContext.connectionId}, ` +
          `userId=${userId}, role=${role}, attempted ${actionName} on ${moduleName}`
        );
        return commonErrors.forbidden(
          `You don't have permission to ${actionName} ${moduleName}`
        );
      }
      
      // Permission granted - call the original handler
      return handler(event);
      
    } catch (error) {
      // Handle authentication context extraction errors
      if (error instanceof Error && error.message.includes('JWT claims')) {
        console.error('[WebSocket-RBAC] Authentication error:', error.message);
        return commonErrors.unauthorized('Invalid or missing authentication token');
      }
      
      // Re-throw unexpected errors
      console.error('[WebSocket-RBAC] Unexpected error:', error);
      throw error;
    }
  };
};
