import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { equipmentService } from '../services/EquipmentService';
import { successResponse, errorResponse } from '../../../shared/response';
import { createLogger } from '../../../shared/logger';
import { Equipment } from '../types';

const logger = createLogger('UpdateEquipmentStatusHandler');

/**
 * PUT /api/equipment/:id/status
 * Update equipment status with enhanced tracking
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const equipmentId = event.pathParameters?.['id'];
    if (!equipmentId) {
      return errorResponse('BAD_REQUEST', 'Equipment ID is required', 400);
    }

    if (!event.body) {
      return errorResponse('BAD_REQUEST', 'Request body is required', 400);
    }

    const body = JSON.parse(event.body);
    const { status, notes } = body;

    // Validate status
    if (!status) {
      return errorResponse('BAD_REQUEST', 'Status is required', 400);
    }

    const validStatuses: Equipment['status'][] = ['Active', 'Under Maintenance', 'Scrapped'];
    if (!validStatuses.includes(status)) {
      return errorResponse(
        'BAD_REQUEST',
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400
      );
    }

    // Validate notes if provided
    if (notes && typeof notes !== 'string') {
      return errorResponse('BAD_REQUEST', 'Notes must be a string', 400);
    }

    if (notes && notes.length > 500) {
      return errorResponse('BAD_REQUEST', 'Notes cannot exceed 500 characters', 400);
    }

    logger.info('Updating equipment status', {
      equipmentId,
      status,
      hasNotes: !!notes,
    });

    const equipment = await equipmentService.updateEquipmentStatus(equipmentId, status, notes);

    return successResponse(equipment);
  } catch (error: any) {
    logger.error('Equipment status update failed', error);

    if (error.message === 'Equipment not found') {
      return errorResponse('NOT_FOUND', 'Equipment not found', 404);
    }

    return errorResponse('INTERNAL_SERVER_ERROR', 'Equipment status update failed', 500);
  }
};
