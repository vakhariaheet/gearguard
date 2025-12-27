import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { ClerkUserService } from '../services/ClerkUserService';
import { ListUsersQuery } from '../types';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';

const userService = new ClerkUserService();

/**
 * Base handler for listing users (admin only)
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Parse query parameters
    const query: ListUsersQuery = {};

    if (event.queryStringParameters) {
      const { limit, offset, orderBy, query: searchQuery } = event.queryStringParameters;

      if (limit) {
        const parsedLimit = parseInt(limit, 10);
        if (!isNaN(parsedLimit) && parsedLimit > 0 && parsedLimit <= 100) {
          query.limit = parsedLimit;
        }
      }

      if (offset) {
        const parsedOffset = parseInt(offset, 10);
        if (!isNaN(parsedOffset) && parsedOffset >= 0) {
          query.offset = parsedOffset;
        }
      }

      if (orderBy && ['created_at', 'updated_at', 'last_sign_in_at'].includes(orderBy)) {
        query.orderBy = orderBy as ListUsersQuery['orderBy'];
      }

      if (searchQuery && searchQuery.trim()) {
        query.query = searchQuery.trim();
      }
    }

    const result = await userService.listUsers(query);
    return successResponse(result);
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * List users handler - Admin only
 * Returns paginated list of all users from Clerk
 *
 * @route GET /api/admin/users
 */
export const handler = withRbac(baseHandler, 'users', 'read');
