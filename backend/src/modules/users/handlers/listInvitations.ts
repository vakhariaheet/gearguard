import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { ClerkUserService } from "../services/ClerkUserService";
import { successResponse, handleAsyncError } from "../../../shared/response";
import { withRbac } from "../../../shared/auth/rbacMiddleware";

const userService = new ClerkUserService();

/**
 * Base handler for listing pending invitations (admin only)
 */
const baseHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const queryParams = event.queryStringParameters || {};
    
    const query = {
      limit: queryParams['limit'] ? parseInt(queryParams['limit'], 10) : undefined,
      offset: queryParams['offset'] ? parseInt(queryParams['offset'], 10) : undefined,
      email: queryParams['email'] || undefined,
    };

    const result = await userService.listInvitations(query);

    return successResponse(result);
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * List invitations handler - Admin only
 * Returns all pending invitations
 * 
 * @route GET /api/admin/invitations
 */
export const handler = withRbac(baseHandler, 'users', 'read');