import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { equipmentService } from '../services/EquipmentService';
import { successResponse, errorResponse } from '../../../shared/response';
import { createLogger } from '../../../shared/logger';
import { SmartScheduleRequest } from '../types';

const logger = createLogger('GetMaintenanceScheduleHandler');

/**
 * GET /api/equipment/:id/schedule
 * Generate smart maintenance schedule
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const equipmentId = event.pathParameters?.['id'];
    if (!equipmentId) {
      return errorResponse('BAD_REQUEST', 'Equipment ID is required', 400);
    }

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};

    const request: SmartScheduleRequest = {
      equipmentId,
      maintenanceType: (queryParams['maintenanceType'] as any) || 'Routine',
      urgency: (queryParams['urgency'] as any) || 'Medium',
      estimatedDuration: queryParams['estimatedDuration']
        ? parseInt(queryParams['estimatedDuration'])
        : undefined,
      requiredSkills: queryParams['requiredSkills']
        ? queryParams['requiredSkills'].split(',')
        : undefined,
      preferredTeam: queryParams['preferredTeam'] || undefined,
    };

    // Validate maintenance type
    if (!['Routine', 'Preventive', 'Predictive'].includes(request.maintenanceType)) {
      return errorResponse(
        'BAD_REQUEST',
        'Invalid maintenance type. Must be Routine, Preventive, or Predictive',
        400
      );
    }

    // Validate urgency
    if (!['Low', 'Medium', 'High', 'Critical'].includes(request.urgency)) {
      return errorResponse(
        'BAD_REQUEST',
        'Invalid urgency. Must be Low, Medium, High, or Critical',
        400
      );
    }

    // Validate estimated duration
    if (
      request.estimatedDuration &&
      (request.estimatedDuration < 1 || request.estimatedDuration > 48)
    ) {
      return errorResponse('BAD_REQUEST', 'Estimated duration must be between 1 and 48 hours', 400);
    }

    logger.info('Generating smart maintenance schedule', {
      equipmentId,
      maintenanceType: request.maintenanceType,
      urgency: request.urgency,
    });

    const schedule = await equipmentService.generateSmartSchedule(request);

    return successResponse(schedule);
  } catch (error: any) {
    logger.error('Smart schedule generation failed', error);

    if (error.message === 'Equipment not found') {
      return errorResponse('NOT_FOUND', 'Equipment not found', 404);
    }

    return errorResponse('INTERNAL_SERVER_ERROR', 'Smart schedule generation failed', 500);
  }
};
