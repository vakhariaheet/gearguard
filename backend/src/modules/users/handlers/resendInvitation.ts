import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ClerkUserService } from '../services/ClerkUserService';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { withRbac } from '../../../shared/auth/rbacMiddleware';

const userService = new ClerkUserService();

/**
 * Base handler for resending a pending invitation (admin only)
 */
const baseHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const invitationId = event.pathParameters?.['invitationId'];
    
    if (!invitationId) {
      return successResponse({ error: 'Invitation ID is required' }, 400);
    }

    const result = await userService.resendInvitation(invitationId);

    return successResponse({ 
      message: 'Invitation resent successfully',
      data: {
        oldInvitationId: invitationId,
        newInvitationId: result.newInvitationId,
        emailAddress: result.emailAddress,
      }
    });
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Resend invitation handler - Admin only
 * Resends a pending invitation by revoking the old one and creating a new one
 * 
 * @route POST /api/admin/invitations/{invitationId}/resend
 */
export const handler = withRbac(baseHandler, 'users', 'update');