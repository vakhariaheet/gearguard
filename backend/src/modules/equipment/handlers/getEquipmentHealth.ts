import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { equipmentService } from '../services/EquipmentService';
import { successResponse, errorResponse } from '../../../shared/response';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('GetEquipmentHealthHandler');

/**
 * GET /api/equipment/:id/health
 * Get current equipment health with enhanced metrics
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const equipmentId = event.pathParameters?.['id'];
    if (!equipmentId) {
      return errorResponse('BAD_REQUEST', 'Equipment ID is required', 400);
    }

    logger.info('Getting equipment health', { equipmentId });

    const health = await equipmentService.getEquipmentHealth(equipmentId);

    return successResponse(health);
  } catch (error: any) {
    logger.error('Get equipment health failed', error);

    if (error.message === 'Equipment not found') {
      return errorResponse('NOT_FOUND', 'Equipment not found', 404);
    }

    return errorResponse('INTERNAL_SERVER_ERROR', 'Failed to get equipment health', 500);
  }
};
