import { APIGatewayProxyResultV2 } from "aws-lambda";
import { ClerkUserService } from "../services/ClerkUserService";
import { successResponse, handleAsyncError, commonErrors } from "../../../shared/response";
import { AuthenticatedAPIGatewayEvent, getAuthContext } from "../../../shared/types";
import { withRbac } from "../../../shared/auth/rbacMiddleware";

const userService = new ClerkUserService();

/**
 * Base handler for banning a user (admin only)
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const userId = event.pathParameters?.['userId'];
    if (!userId) {
      return commonErrors.badRequest("User ID is required");
    }

    const { userId: adminUserId } = getAuthContext(event);
    const user = await userService.banUser(userId, adminUserId);

    return successResponse(user);
  } catch (error) {
    return handleAsyncError(error);
  }
}; 

/**
 * Ban user handler - Admin only
 * Bans a user via Clerk API (revokes all sessions)
 * 
 * @route POST /api/admin/users/{userId}/ban
 */
export const handler = withRbac(baseHandler, 'users', 'update');
