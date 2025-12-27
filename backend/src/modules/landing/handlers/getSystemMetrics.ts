import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, commonErrors } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { landingService } from '../services/LandingService';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Getting system metrics', { event });

    const metrics = await landingService.getSystemMetrics();

    return successResponse({
      data: metrics,
      message: 'System metrics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get system metrics:', error);
    return commonErrors.internalServerError('Failed to retrieve system metrics');
  }
};
