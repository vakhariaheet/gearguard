import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, commonErrors } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { landingService } from '../services/LandingService';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Getting landing page statistics', { event });

    const stats = await landingService.getPublicStats();

    return successResponse({
      data: stats,
      message: 'Landing statistics retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get landing statistics:', error);
    return commonErrors.internalServerError('Failed to retrieve landing statistics');
  }
};
