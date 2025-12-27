import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { RequestService } from '../services/RequestService';
import { UpdateRequestRequest } from '../types';

const requestService = new RequestService();

/**
 * @route PUT /api/requests/:id
 * @description Update a maintenance request
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

    // Parse request body
    const body: UpdateRequestRequest = JSON.parse(event.body || '{}');

    // Check if request exists and user has permission
    const existingRequest = await requestService.getRequestById(requestId);
    if (!existingRequest) {
      return errorResponse('REQUEST_NOT_FOUND', 'Request not found', 404);
    }

    // Check ownership for employees
    if (
      role === 'employee' &&
      existingRequest.createdBy !== userId &&
      existingRequest.assignedTechnician !== userId
    ) {
      return errorResponse('ACCESS_DENIED', 'You can only update your own requests', 403);
    }

    // Validate fields if provided
    if (body.priority && !['Low', 'Medium', 'High', 'Critical'].includes(body.priority)) {
      return errorResponse(
        'INVALID_PRIORITY',
        'Priority must be Low, Medium, High, or Critical',
        400
      );
    }

    if (body.scheduledDate) {
      const scheduledDate = new Date(body.scheduledDate);
      if (isNaN(scheduledDate.getTime())) {
        return errorResponse('INVALID_SCHEDULED_DATE', 'Invalid scheduled date format', 400);
      }
    }

    // Prevent updating completed requests
    if (['Repaired', 'Scrap'].includes(existingRequest.status)) {
      return errorResponse('REQUEST_COMPLETED', 'Cannot update completed requests', 400);
    }

    const updatedRequest = await requestService.updateRequest(requestId, body);
    return successResponse(updatedRequest);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'requests', 'update');
