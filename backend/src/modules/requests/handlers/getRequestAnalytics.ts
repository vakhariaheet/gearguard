import { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { RequestService } from '../services/RequestService';
import { successResponse, errorResponse } from '../../../shared/response';
import { getAuthContext } from '../../../shared/types';
import { validatePermissions } from '../../../shared/middleware/auth';
import { createLogger } from '../../../shared/logger';

const logger = createLogger('getRequestAnalytics');
const requestService = new RequestService();

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const { userId, role } = getAuthContext(event);

    // Check permissions - only managers and admins can view analytics
    const hasPermission = await validatePermissions(userId, role, 'analytics', 'read');
    if (!hasPermission) {
      return errorResponse('INSUFFICIENT_PERMISSIONS', 'Insufficient permissions', 403);
    }

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const startDate = queryParams['start'];
    const endDate = queryParams['end'];

    // Validate date range
    if (!startDate || !endDate) {
      return errorResponse(
        'MISSING_DATE_PARAMS',
        'Both start and end date parameters are required',
        400
      );
    }

    // Validate date format
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return errorResponse(
        'INVALID_DATE_FORMAT',
        'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
        400
      );
    }

    if (start >= end) {
      return errorResponse('INVALID_DATE_RANGE', 'Start date must be before end date', 400);
    }

    // Check if date range is not too large (max 1 year)
    const maxRangeMs = 365 * 24 * 60 * 60 * 1000; // 1 year in milliseconds
    if (end.getTime() - start.getTime() > maxRangeMs) {
      return errorResponse('DATE_RANGE_TOO_LARGE', 'Date range cannot exceed 1 year', 400);
    }

    const timeRange = {
      start: start.toISOString(),
      end: end.toISOString(),
    };

    // Get analytics data
    const analytics = await requestService.getRequestAnalytics(timeRange);

    logger.info('Analytics retrieved', {
      userId,
      timeRange,
      totalRequests: analytics.metrics.totalRequests,
      slaComplianceRate: analytics.metrics.slaComplianceRate,
    });

    return successResponse({
      data: analytics,
      message: 'Analytics retrieved successfully',
    });
  } catch (error: any) {
    logger.error('Failed to get request analytics:', error);

    return errorResponse('ANALYTICS_RETRIEVAL_FAILED', 'Failed to retrieve request analytics', 500);
  }
};
