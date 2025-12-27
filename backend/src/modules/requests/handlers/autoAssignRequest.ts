import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { RequestService } from '../services/RequestService';
import { successResponse, errorResponse } from '../../../shared/response';
import { getAuthContext } from '../../../shared/types';
import { validatePermissions } from '../../../shared/middleware/auth';
import { createLogger } from '../../../shared/logger';
import { AutoAssignmentRequest } from '../types';

const logger = createLogger('autoAssignRequest');
const requestService = new RequestService();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { userId, role } = getAuthContext(event);

    // Check permissions
    const hasPermission = await validatePermissions(userId, role, 'requests', 'update');
    if (!hasPermission) {
      return errorResponse('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions', 403);
    }

    const requestId = event.pathParameters?.['id'];
    if (!requestId) {
      return errorResponse('MISSING_REQUEST_ID', 'Request ID is required', 400);
    }

    // Parse request body
    let autoAssignmentData: AutoAssignmentRequest;
    try {
      autoAssignmentData = JSON.parse(event.body || '{}');
    } catch (error) {
      return errorResponse('INVALID_JSON', 'Invalid JSON in request body', 400);
    }

    // Validate required fields
    if (!autoAssignmentData.equipmentId || !autoAssignmentData.urgency) {
      return errorResponse('MISSING_FIELDS', 'equipmentId and urgency are required', 400);
    }

    // Set default values
    const assignmentRequest: AutoAssignmentRequest = {
      requestId,
      equipmentId: autoAssignmentData.equipmentId,
      urgency: autoAssignmentData.urgency,
      requiredSkills: autoAssignmentData.requiredSkills || [],
      preferredTeam: autoAssignmentData.preferredTeam,
      locationConstraints: autoAssignmentData.locationConstraints || {},
      workloadConsideration: autoAssignmentData.workloadConsideration ?? true,
      skillWeighting: autoAssignmentData.skillWeighting ?? 0.4,
      locationWeighting: autoAssignmentData.locationWeighting ?? 0.3,
      availabilityWeighting: autoAssignmentData.availabilityWeighting ?? 0.3,
    };

    // Validate weights sum to 1.0 (approximately)
    const totalWeight =
      assignmentRequest.skillWeighting +
      assignmentRequest.locationWeighting +
      assignmentRequest.availabilityWeighting;
    if (Math.abs(totalWeight - 1.0) > 0.1) {
      return errorResponse(
        'INVALID_WEIGHTS',
        'Skill, location, and availability weights must sum to approximately 1.0',
        400
      );
    }

    // Perform auto-assignment
    const assignmentResult = await requestService.autoAssignRequest(assignmentRequest);

    logger.info('Auto-assignment completed', {
      requestId,
      assignedTo: assignmentResult.assignedTechnician.userId,
      score: assignmentResult.assignmentScore,
      autoAssigned: assignmentResult.autoAssigned,
    });

    return successResponse({
      data: assignmentResult,
      message: assignmentResult.autoAssigned
        ? `Request automatically assigned to ${assignmentResult.assignedTechnician.name}`
        : 'Assignment recommendation generated successfully',
    });
  } catch (error: any) {
    logger.error('Auto-assignment failed:', error);

    if (error?.message?.includes('not found')) {
      return errorResponse('RESOURCE_NOT_FOUND', error.message, 404);
    }

    if (error?.message?.includes('No available technicians')) {
      return errorResponse('NO_TECHNICIANS', error.message, 422);
    }

    return errorResponse('AUTO_ASSIGNMENT_FAILED', 'Auto-assignment failed', 500);
  }
};
