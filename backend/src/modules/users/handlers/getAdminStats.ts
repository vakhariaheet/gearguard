import { APIGatewayProxyResultV2 } from "aws-lambda";
import { ClerkUserService } from "../services/ClerkUserService";
import { successResponse, handleAsyncError } from "../../../shared/response";
import { AuthenticatedAPIGatewayEvent } from "../../../shared/types";
import { withRbac } from "../../../shared/auth/rbacMiddleware";

const userService = new ClerkUserService();

/**
 * Base handler for getting admin statistics (admin only)
 */
const baseHandler = async (
  _event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const stats = await userService.getAdminStats();
    return successResponse(stats);
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Get admin statistics handler - Admin only
 * Returns dashboard statistics from Clerk
 * 
 * @route GET /api/admin/stats
 */
export const handler = withRbac(baseHandler, 'users', 'read');
