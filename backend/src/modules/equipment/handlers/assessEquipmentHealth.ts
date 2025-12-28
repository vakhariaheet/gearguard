import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { equipmentService } from '../services/EquipmentService';
import { HealthAssessmentRequest } from '../types';

/**
 * @route POST /api/equipment/:id/assess-health
 * @description Assess equipment health using AI analysis
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const equipmentId = event.pathParameters?.['id'];
    if (!equipmentId) {
      return errorResponse('MISSING_EQUIPMENT_ID', 'Equipment ID is required', 400);
    }

    // Parse request body
    const body: Partial<HealthAssessmentRequest> = JSON.parse(event.body || '{}');

    // Validate equipment exists
    const equipment = await equipmentService.getEquipment(equipmentId);
    if (!equipment) {
      return errorResponse('EQUIPMENT_NOT_FOUND', 'Equipment not found', 404);
    }

    // Perform health assessment
    const assessment = await equipmentService.assessEquipmentHealth({
      equipmentId,
      ...body,
    });

    return successResponse(assessment);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'equipment', 'read');
