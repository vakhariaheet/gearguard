import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { RequestService } from '../services/RequestService';
import { successResponse, errorResponse } from '../../../shared/response';
import { getAuthContext } from '../../../shared/types';
import { validatePermissions } from '../../../shared/middleware/auth';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('getRequestWorkflow');
const requestService = new RequestService();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { userId, role } = getAuthContext(event);

    // Check permissions
    const hasPermission = await validatePermissions(userId, role, 'requests', 'read');
    if (!hasPermission) {
      return errorResponse('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions', 403);
    }

    const requestId = event.pathParameters?.['id'];
    if (!requestId) {
      return errorResponse('MISSING_REQUEST_ID', 'Request ID is required', 400);
    }

    // Get workflow details
    const workflow = await requestService.getRequestWorkflow(requestId);

    if (!workflow) {
      // If no workflow exists, try to get the basic request to check if it exists
      const request = await requestService.getRequestById(requestId);
      if (!request) {
        return errorResponse('REQUEST_NOT_FOUND', 'Request not found', 404);
      }

      // Initialize workflow for existing request without workflow
      const initializedWorkflow = await requestService.initializeWorkflow(requestId, {});

      logger.info('Workflow initialized for existing request', { requestId });

      return successResponse({
        data: initializedWorkflow,
        message: 'Workflow initialized for request',
      });
    }

    logger.info('Workflow retrieved', {
      requestId,
      currentStep: workflow.currentStep,
      slaStatus: {
        responseBreached: workflow.slaTracking.responseTime.isBreached,
        resolutionBreached: workflow.slaTracking.resolutionTime.isBreached,
      },
    });

    return successResponse({
      data: workflow,
      message: 'Workflow retrieved successfully',
    });
  } catch (error: any) {
    logger.error('Failed to get request workflow:', error);

    if (error?.message?.includes('not found')) {
      return errorResponse('RESOURCE_NOT_FOUND', error.message, 404);
    }

    return errorResponse('WORKFLOW_RETRIEVAL_FAILED', 'Failed to retrieve request workflow', 500);
  }
};
