import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { RequestService } from '../services/RequestService';
import { AssignRequestRequest } from '../types';

const requestService = new RequestService();

/**
 * @route POST /api/requests/:id/assign
 * @description Assign a maintenance request to a team or technician
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
    const body: AssignRequestRequest = JSON.parse(event.body || '{}');

    // Validate that at least one assignment is provided
    if (!body.assignedTeam && !body.assignedTechnician) {
      return errorResponse(
        'MISSING_ASSIGNMENT',
        'Either assignedTeam or assignedTechnician must be provided',
        400
      );
    }

    // Check if request exists
    const existingRequest = await requestService.getRequestById(requestId);
    if (!existingRequest) {
      return errorResponse('REQUEST_NOT_FOUND', 'Request not found', 404);
    }

    // Only managers and admins can assign requests
    if (!['manager', 'admin'].includes(role)) {
      return errorResponse('ACCESS_DENIED', 'Only managers and admins can assign requests', 403);
    }

    // Prevent assigning completed requests
    if (['Repaired', 'Scrap'].includes(existingRequest.status)) {
      return errorResponse('REQUEST_COMPLETED', 'Cannot assign completed requests', 400);
    }

    const updatedRequest = await requestService.assignRequest(requestId, body, userId);
    return successResponse(updatedRequest);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'requests', 'update');
