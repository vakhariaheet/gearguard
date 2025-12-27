import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { RequestService } from '../services/RequestService';
import { RequestAutoFillRequest } from '../types';

const requestService = new RequestService();

/**
 * @route POST /api/requests/auto-fill
 * @description Generate smart suggestions for maintenance request creation
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Parse request body
    const body: RequestAutoFillRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.equipmentId) {
      return errorResponse('MISSING_EQUIPMENT_ID', 'Equipment ID is required', 400);
    }

    // Validate request type if provided
    if (body.requestType && !['Corrective', 'Preventive'].includes(body.requestType)) {
      return errorResponse(
        'INVALID_REQUEST_TYPE',
        'Request type must be Corrective or Preventive',
        400
      );
    }

    // Generate auto-fill suggestions
    const suggestions = await requestService.generateAutoFillSuggestions(body);

    return successResponse(suggestions);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'requests', 'create');
