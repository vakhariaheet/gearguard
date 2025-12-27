import { APIGatewayProxyResultV2 } from "aws-lambda";
import { ClerkUserService } from "../services/ClerkUserService";
import { successResponse, handleAsyncError, commonErrors } from "../../../shared/response";
import { AuthenticatedAPIGatewayEvent } from "../../../shared/types";
import { withRbac } from "../../../shared/auth/rbacMiddleware";

const userService = new ClerkUserService();

/**
 * Base handler for unbanning a user (admin only)
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = event.pathParameters?.['userId'];
    if (!userId) {
      return commonErrors.badRequest("User ID is required");
    }

    const user = await userService.unbanUser(userId);
    return successResponse(user);
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Unban user handler - Admin only
 * Unbans a user via Clerk API
 * 
 * @route POST /api/admin/users/{userId}/unban
 */
export const handler = withRbac(baseHandler, 'users', 'update');
