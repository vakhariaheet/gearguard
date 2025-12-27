import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { RequestService } from '../services/RequestService';

const requestService = new RequestService();

/**
 * @route GET /api/requests/:id
 * @description Get a specific maintenance request by ID
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { userId, role } = getAuthContext(event);
    const requestId = event.pathParameters?.['id'];

    if (!requestId) {
      return errorResponse('MISSING_REQUEST_ID', 'Request ID is required', 400);
    }

    const request = await requestService.getRequestById(requestId);

    if (!request) {
      return errorResponse('REQUEST_NOT_FOUND', 'Request not found', 404);
    }

    // Check ownership for employees
    if (
      role === 'employee' &&
      request.createdBy !== userId &&
      request.assignedTechnician !== userId
    ) {
      return errorResponse('ACCESS_DENIED', 'You can only view your own requests', 403);
    }

    return successResponse(request);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'requests', 'read');
