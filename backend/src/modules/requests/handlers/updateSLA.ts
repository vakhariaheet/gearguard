import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { RequestService } from '../services/RequestService';
import { successResponse, errorResponse } from '../../../shared/response';
import { getAuthContext } from '../../../shared/types';
import { validatePermissions } from '../../../shared/middleware/auth';
import { createLogger } from '../../../shared/logger';
import { SLATracking } from '../types';

const logger = createLogger('updateSLA');
const requestService = new RequestService();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { userId, role } = getAuthContext(event);

    // Check permissions - only managers and admins can update SLA
    const hasPermission = await validatePermissions(userId, role, 'requests', 'update');
    if (!hasPermission || (role !== 'manager' && role !== 'admin')) {
      return errorResponse('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions', 403);
    }

    const requestId = event.pathParameters?.['id'];
    if (!requestId) {
      return errorResponse('MISSING_REQUEST_ID', 'Request ID is required', 400);
    }

    // Parse request body
    let slaUpdateData: Partial<SLATracking>;
    try {
      slaUpdateData = JSON.parse(event.body || '{}');
    } catch (error) {
      return errorResponse('INVALID_JSON', 'Invalid JSON in request body', 400);
    }

    // Validate SLA update data
    if (!slaUpdateData.responseTime && !slaUpdateData.resolutionTime) {
      return errorResponse(
        'MISSING_SLA_FIELDS',
        'At least one SLA field (responseTime or resolutionTime) must be provided',
        400
      );
    }

    // Validate time values
    if (slaUpdateData.responseTime?.actual && slaUpdateData.responseTime.actual < 0) {
      return errorResponse('INVALID_RESPONSE_TIME', 'Response time cannot be negative', 400);
    }

    if (slaUpdateData.resolutionTime?.actual && slaUpdateData.resolutionTime.actual < 0) {
      return errorResponse('INVALID_RESOLUTION_TIME', 'Resolution time cannot be negative', 400);
    }

    // Update SLA
    const updatedSLA = await requestService.updateSLA(requestId, slaUpdateData);

    logger.info('SLA updated', {
      requestId,
      updatedBy: userId,
      responseTimeActual: updatedSLA.responseTime.actual,
      resolutionTimeActual: updatedSLA.resolutionTime.actual,
      responseBreached: updatedSLA.responseTime.isBreached,
      resolutionBreached: updatedSLA.resolutionTime.isBreached,
    });

    return successResponse({
      data: updatedSLA,
      message: 'SLA updated successfully',
    });
  } catch (error: any) {
    logger.error('SLA update failed:', error);

    if (error?.message?.includes('not found')) {
      return errorResponse('RESOURCE_NOT_FOUND', error.message, 404);
    }

    return errorResponse('SLA_UPDATE_FAILED', 'SLA update failed', 500);
  }
};
