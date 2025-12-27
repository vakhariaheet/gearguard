import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { RequestService } from '../services/RequestService';
import { successResponse, errorResponse } from '../../../shared/response';
import { getAuthContext } from '../../../shared/types';
import { validatePermissions } from '../../../shared/middleware/auth';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('escalateRequest');
const requestService = new RequestService();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { userId, role } = getAuthContext(event);

    // Check permissions - managers and admins can escalate
    const hasPermission = await validatePermissions(userId, role, 'requests', 'update');
    if (!hasPermission) {
      return errorResponse('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions', 403);
    }

    const requestId = event.pathParameters?.['id'];
    if (!requestId) {
      return errorResponse('MISSING_REQUEST_ID', 'Request ID is required', 400);
    }

    // Parse request body
    let escalationData: { escalationLevel?: number; reason?: string };
    try {
      escalationData = JSON.parse(event.body || '{}');
    } catch (error) {
      return errorResponse('INVALID_JSON', 'Invalid JSON in request body', 400);
    }

    const escalationLevel = escalationData.escalationLevel || 1;

    // Validate escalation level
    if (escalationLevel < 1 || escalationLevel > 3) {
      return errorResponse(
        'INVALID_ESCALATION_LEVEL',
        'Escalation level must be between 1 and 3',
        400
      );
    }

    // Perform escalation
    const updatedWorkflow = await requestService.escalateRequest(requestId, escalationLevel);

    logger.info('Request escalated', {
      requestId,
      escalationLevel,
      escalatedBy: userId,
      currentStep: updatedWorkflow.currentStep,
    });

    return successResponse({
      data: updatedWorkflow,
      message: `Request escalated to level ${escalationLevel}`,
    });
  } catch (error: any) {
    logger.error('Request escalation failed:', error);

    if (error?.message?.includes('not found')) {
      return errorResponse('RESOURCE_NOT_FOUND', error.message, 404);
    }

    if (error?.message?.includes('Escalation rule')) {
      return errorResponse('ESCALATION_RULE_ERROR', error.message, 422);
    }

    return errorResponse('ESCALATION_FAILED', 'Request escalation failed', 500);
  }
};
