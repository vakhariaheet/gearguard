import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, commonErrors } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { landingService } from '../services/LandingService';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Getting customer testimonials', { event });

    const testimonials = await landingService.getTestimonials();

    return successResponse({
      data: testimonials,
      message: 'Testimonials retrieved successfully',
    });
  } catch (error) {
    logger.error('Failed to get testimonials:', error);
    return commonErrors.internalServerError('Failed to retrieve testimonials');
  }
};
