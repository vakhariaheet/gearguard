import { APIGatewayProxyResultV2 } from "aws-lambda";
import { ClerkUserService } from "../services/ClerkUserService";
import { successResponse, handleAsyncError, commonErrors } from "../../../shared/response";
import { AuthenticatedAPIGatewayEvent } from "../../../shared/types";
import { withRbac } from "../../../shared/auth/rbacMiddleware";

const userService = new ClerkUserService();

/**
 * Base handler for revoking an invitation (admin only)
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const invitationId = event.pathParameters?.['invitationId'];
    
    if (!invitationId) {
      return commonErrors.badRequest("Invitation ID is required");
    }

    await userService.revokeInvitation(invitationId);

    return successResponse({ 
      message: "Invitation revoked successfully" 
    });
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Revoke invitation handler - Admin only
 * Revokes a pending invitation
 * 
 * @route DELETE /api/admin/invitations/{invitationId}
 */
export const handler = withRbac(baseHandler, 'users', 'delete');