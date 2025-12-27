import { APIGatewayProxyResultV2 } from "aws-lambda";
import { ClerkUserService } from "../services/ClerkUserService";
import { successResponse, handleAsyncError, commonErrors } from "../../../shared/response";
import { AuthenticatedAPIGatewayEvent, getAuthContext } from "../../../shared/types";
import { withRbac } from "../../../shared/auth/rbacMiddleware";

const userService = new ClerkUserService();

/**
 * Base handler for deleting a user (admin only)
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
    await userService.deleteUser(userId, adminUserId);

    return successResponse({ 
      message: "User deleted successfully",
      userId 
    });
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Delete user handler - Admin only
 * Permanently deletes a user from Clerk
 * 
 * @route DELETE /api/admin/users/{userId}
 */
export const handler = withRbac(baseHandler, 'users', 'delete');
