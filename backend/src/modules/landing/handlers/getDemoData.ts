import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, commonErrors } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { landingService } from '../services/LandingService';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Getting live demo data', { event });

    const demoData = await landingService.getLiveDemoData();

    return successResponse({
      data: demoData,
      message: 'Demo data retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get demo data:', error);
    return commonErrors.internalServerError('Failed to retrieve demo data');
  }
};
