import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { RequestService } from '../services/RequestService';
import { CreateRequestRequest } from '../types';

const requestService = new RequestService();

/**
 * @route POST /api/requests
 * @description Create a new maintenance request
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { userId } = getAuthContext(event);

    // Parse request body
    const body: CreateRequestRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.subject || !body.subject.trim()) {
      return errorResponse('MISSING_SUBJECT', 'Subject is required', 400);
    }

    if (!body.equipmentId || !body.equipmentId.trim()) {
      return errorResponse('MISSING_EQUIPMENT_ID', 'Equipment ID is required', 400);
    }

    if (!body.requestType || !['Corrective', 'Preventive'].includes(body.requestType)) {
      return errorResponse(
        'INVALID_REQUEST_TYPE',
        'Request type must be Corrective or Preventive',
        400
      );
    }

    if (!body.priority || !['Low', 'Medium', 'High', 'Critical'].includes(body.priority)) {
      return errorResponse(
        'INVALID_PRIORITY',
        'Priority must be Low, Medium, High, or Critical',
        400
      );
    }

    // Validate scheduled date for preventive maintenance
    if (body.requestType === 'Preventive' && body.scheduledDate) {
      const scheduledDate = new Date(body.scheduledDate);
      if (isNaN(scheduledDate.getTime())) {
        return errorResponse('INVALID_SCHEDULED_DATE', 'Invalid scheduled date format', 400);
      }

      // Ensure scheduled date is in the future
      if (scheduledDate <= new Date()) {
        return errorResponse('PAST_SCHEDULED_DATE', 'Scheduled date must be in the future', 400);
      }
    }

    const request = await requestService.createRequest(body, userId);
    return successResponse(request, 201);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'requests', 'create');
