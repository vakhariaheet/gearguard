import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { equipmentService } from '../services/EquipmentService';
import { successResponse, errorResponse } from '../../../shared/response';
import { createLogger } from '../../../shared/logger';
import { PredictiveMaintenanceRequest } from '../types';

const logger = createLogger('PredictMaintenanceHandler');

/**
 * POST /api/equipment/:id/predict-maintenance
 * Perform predictive maintenance analysis using AI
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const equipmentId = event.pathParameters?.['id'];
    if (!equipmentId) {
      return errorResponse('BAD_REQUEST', 'Equipment ID is required', 400);
    }

    const body = event.body ? JSON.parse(event.body) : {};

    // Validate request body
    const request: PredictiveMaintenanceRequest = {
      equipmentId,
      analysisType: body.analysisType || 'Quick',
      includeEnvironmental: body.includeEnvironmental || false,
      forecastDays: body.forecastDays || 90,
    };

    // Validate analysis type
    if (!['Quick', 'Comprehensive', 'Scheduled'].includes(request.analysisType)) {
      return errorResponse(
        'BAD_REQUEST',
        'Invalid analysis type. Must be Quick, Comprehensive, or Scheduled',
        400
      );
    }

    // Validate forecast days
    if (request.forecastDays && (request.forecastDays < 7 || request.forecastDays > 365)) {
      return errorResponse('BAD_REQUEST', 'Forecast days must be between 7 and 365', 400);
    }

    logger.info('Starting predictive maintenance analysis', {
      equipmentId,
      analysisType: request.analysisType,
      forecastDays: request.forecastDays,
    });

    const prediction = await equipmentService.predictMaintenance(request);

    return successResponse(prediction);
  } catch (error: any) {
    logger.error('Predictive maintenance analysis failed', error);

    if (error.message === 'Equipment not found') {
      return errorResponse('NOT_FOUND', 'Equipment not found', 404);
    }

    if (error.message.includes('insufficient historical data')) {
      return errorResponse(
        'BAD_REQUEST',
        'Insufficient historical data for reliable prediction',
        400
      );
    }

    return errorResponse('INTERNAL_SERVER_ERROR', 'Predictive maintenance analysis failed', 500);
  }
};
