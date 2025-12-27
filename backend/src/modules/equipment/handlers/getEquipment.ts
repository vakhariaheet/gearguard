import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { equipmentService } from '../services/EquipmentService';

/**
 * @route GET /api/equipment/:id
 * @description Get equipment by ID
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const equipmentId = event.pathParameters?.['id'];
    if (!equipmentId) {
      return errorResponse('MISSING_EQUIPMENT_ID', 'Equipment ID is required', 400);
    }

    const equipment = await equipmentService.getEquipment(equipmentId);
    if (!equipment) {
      return errorResponse('EQUIPMENT_NOT_FOUND', 'Equipment not found', 404);
    }

    return successResponse(equipment);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'equipment', 'read');
