import { APIGatewayProxyResultV2 } from "aws-lambda";
import { ClerkUserService } from "../services/ClerkUserService";
import { successResponse, handleAsyncError, commonErrors } from "../../../shared/response";
import { AuthenticatedAPIGatewayEvent } from "../../../shared/types";
import { withRbac } from "../../../shared/auth/rbacMiddleware";

const userService = new ClerkUserService();

/**
 * Base handler for getting a user's details (admin only)
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = event.pathParameters?.['userId'];
    if (!userId) {
      return commonErrors.badRequest("User ID is required");
    }

    const user = await userService.getUserById(userId);
    return successResponse(user);
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Get user details handler - Admin only
 * Returns detailed information about a specific user from Clerk
 * 
 * @route GET /api/admin/users/{userId}
 */
export const handler = withRbac(baseHandler, 'users', 'read');
