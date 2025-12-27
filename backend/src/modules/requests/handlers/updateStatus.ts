import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { RequestService } from '../services/RequestService';
import { UpdateStatusRequest } from '../types';

const requestService = new RequestService();

/**
 * @route PUT /api/requests/:id/status
 * @description Update the status of a maintenance request
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
    const body: UpdateStatusRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.newStatus || !['New', 'In Progress', 'Repaired', 'Scrap'].includes(body.newStatus)) {
      return errorResponse(
        'INVALID_STATUS',
        'Status must be New, In Progress, Repaired, or Scrap',
        400
      );
    }

    // Validate hours spent if provided
    if (body.hoursSpent !== undefined) {
      if (typeof body.hoursSpent !== 'number' || body.hoursSpent < 0) {
        return errorResponse(
          'INVALID_HOURS_SPENT',
          'Hours spent must be a non-negative number',
          400
        );
      }
    }

    // Check if request exists
    const existingRequest = await requestService.getRequestById(requestId);
    if (!existingRequest) {
      return errorResponse('REQUEST_NOT_FOUND', 'Request not found', 404);
    }

    // Check permissions based on role and assignment
    if (role === 'employee') {
      // Employees can only update status of their own assigned requests
      if (existingRequest.assignedTechnician !== userId) {
        return errorResponse(
          'ACCESS_DENIED',
          'You can only update status of requests assigned to you',
          403
        );
      }
    } else if (role === 'technician') {
      // Technicians can update any request they're assigned to or any request in general
      // (more permissive than employee)
    }
    // Managers and admins can update any request status

    // Validate status transitions
    const currentStatus = existingRequest.status;
    const validTransitions: Record<string, string[]> = {
      New: ['In Progress', 'Scrap'],
      'In Progress': ['Repaired', 'Scrap'],
      Repaired: [], // Terminal state
      Scrap: [], // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(body.newStatus)) {
      return errorResponse(
        'INVALID_TRANSITION',
        `Cannot transition from ${currentStatus} to ${body.newStatus}`,
        400
      );
    }

    // Require hours spent for completion
    if (['Repaired', 'Scrap'].includes(body.newStatus) && body.hoursSpent === undefined) {
      return errorResponse(
        'MISSING_HOURS_SPENT',
        'Hours spent is required when marking request as completed',
        400
      );
    }

    const updatedRequest = await requestService.updateStatus(requestId, body);
    return successResponse(updatedRequest);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'requests', 'update');
