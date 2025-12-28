import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { equipmentService } from '../services/EquipmentService';
import { CreateEquipmentRequest } from '../types';

/**
 * @route POST /api/equipment
 * @description Create new equipment
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    if (!event.body) {
      return errorResponse('MISSING_BODY', 'Request body is required', 400);
    }

    const data: CreateEquipmentRequest = JSON.parse(event.body);

    // Validate required fields
    if (
      !data.equipmentName ||
      !data.serialNumber ||
      !data.category ||
      !data.department ||
      !data.assignedTeam ||
      !data.purchaseDate ||
      !data.location
    ) {
      return errorResponse(
        'MISSING_REQUIRED_FIELDS',
        'Missing required fields: equipmentName, serialNumber, category, department, assignedTeam, purchaseDate, location',
        400
      );
    }

    // Validate category
    const validCategories = ['Machine', 'Vehicle', 'Computer', 'Tool', 'Other'];
    if (!validCategories.includes(data.category)) {
      return errorResponse(
        'INVALID_CATEGORY',
        `Category must be one of: ${validCategories.join(', ')}`,
        400
      );
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

    // Validate dates
    if (isNaN(Date.parse(data.purchaseDate))) {
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

    const equipment = await equipmentService.createEquipment(data);
    return successResponse(equipment, 201);
  } catch (error: any) {
    if (error.message && error.message.includes('already exists')) {
      return errorResponse('DUPLICATE_SERIAL_NUMBER', error.message, 409);
    }
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'equipment', 'create');
