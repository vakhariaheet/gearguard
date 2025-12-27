import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { equipmentService } from '../services/EquipmentService';
import { UpdateEquipmentRequest } from '../types';

/**
 * @route PUT /api/equipment/:id
 * @description Update equipment by ID
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const equipmentId = event.pathParameters?.['id'];
    if (!equipmentId) {
      return errorResponse('MISSING_EQUIPMENT_ID', 'Equipment ID is required', 400);
    }

    if (!event.body) {
      return errorResponse('MISSING_BODY', 'Request body is required', 400);
    }

    const data: UpdateEquipmentRequest = JSON.parse(event.body);

    // Validate category if provided
    if (data.category) {
      const validCategories = ['Machine', 'Vehicle', 'Computer', 'Tool', 'Other'];
      if (!validCategories.includes(data.category)) {
        return errorResponse(
          'INVALID_CATEGORY',
          `Category must be one of: ${validCategories.join(', ')}`,
          400
        );
      }
    }

    // Validate status if provided
    if (data.status) {
      const validStatuses = ['Active', 'Under Maintenance', 'Scrapped'];
      if (!validStatuses.includes(data.status)) {
        return errorResponse(
          'INVALID_STATUS',
          `Status must be one of: ${validStatuses.join(', ')}`,
          400
        );
      }
    }

    // Validate dates if provided
    if (data.purchaseDate && isNaN(Date.parse(data.purchaseDate))) {
      return errorResponse(
        'INVALID_PURCHASE_DATE',
        'Purchase date must be a valid ISO date string',
        400
      );
    }

    if (data.warrantyExpiry && isNaN(Date.parse(data.warrantyExpiry))) {
      return errorResponse(
        'INVALID_WARRANTY_DATE',
        'Warranty expiry must be a valid ISO date string',
        400
      );
    }

    if (data.lastMaintenanceDate && isNaN(Date.parse(data.lastMaintenanceDate))) {
      return errorResponse(
        'INVALID_MAINTENANCE_DATE',
        'Last maintenance date must be a valid ISO date string',
        400
      );
    }

    const equipment = await equipmentService.updateEquipment(equipmentId, data);
    return successResponse(equipment);
  } catch (error: any) {
    if (error.message === 'Equipment not found') {
      return errorResponse('EQUIPMENT_NOT_FOUND', 'Equipment not found', 404);
    }
    if (error.message && error.message.includes('already exists')) {
      return errorResponse('DUPLICATE_SERIAL_NUMBER', error.message, 409);
    }
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'equipment', 'update');
