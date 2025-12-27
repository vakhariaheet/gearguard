import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { equipmentService } from '../services/EquipmentService';

/**
 * @route DELETE /api/equipment/:id
 * @description Delete equipment by ID
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const equipmentId = event.pathParameters?.['id'];
    if (!equipmentId) {
      return errorResponse('MISSING_EQUIPMENT_ID', 'Equipment ID is required', 400);
    }

    await equipmentService.deleteEquipment(equipmentId);
    return successResponse({ message: 'Equipment deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Equipment not found') {
      return errorResponse('EQUIPMENT_NOT_FOUND', 'Equipment not found', 404);
    }
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'equipment', 'delete');
