import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { RequestService } from '../services/RequestService';

const requestService = new RequestService();

/**
 * @route DELETE /api/requests/:id
 * @description Delete a maintenance request
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { role } = getAuthContext(event);
    const requestId = event.pathParameters?.['id'];

    if (!requestId) {
      return errorResponse('MISSING_REQUEST_ID', 'Request ID is required', 400);
    }

    // Check if request exists
    const existingRequest = await requestService.getRequestById(requestId);
    if (!existingRequest) {
      return errorResponse('REQUEST_NOT_FOUND', 'Request not found', 404);
    }

    // Only managers and admins can delete requests
    if (!['manager', 'admin'].includes(role)) {
      return errorResponse('ACCESS_DENIED', 'Only managers and admins can delete requests', 403);
    }

    // Prevent deleting in-progress requests
    if (existingRequest.status === 'In Progress') {
      return errorResponse(
        'REQUEST_IN_PROGRESS',
        'Cannot delete requests that are in progress',
        400
      );
    }

    await requestService.deleteRequest(requestId);
    return successResponse({ message: 'Request deleted successfully' });
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'requests', 'delete');
