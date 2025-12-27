/**
 * Search Users Handler
 * Searches for users by email for team member addition
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errorResponse } from '../../../shared/response';
import { createLogger } from '../../../shared/logger';
import { ClerkUserService } from '../../users/services/ClerkUserService';

const logger = createLogger('SearchUsersHandler');
const clerkUserService = new ClerkUserService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    logger.info('Search users request received', {
      queryStringParameters: event.queryStringParameters,
    });

    const query = event.queryStringParameters?.['query'] || '';
    const limit = parseInt(event.queryStringParameters?.['limit'] || '10');

    if (!query.trim()) {
      return errorResponse('VALIDATION_ERROR', 'Search query is required', 400);
    }

    // Search users using Clerk service
    const result = await clerkUserService.listUsers({
      query: query.trim(),
      limit: Math.min(limit, 20), // Cap at 20 for performance
      offset: 0,
    });

    // Filter out banned users and format for team member selection
    const availableUsers = result.users
      .filter((user) => !user.banned && user.email)
      .map((user) => ({
        id: user.id,
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      }));

    logger.info(`Found ${availableUsers.length} available users for query: ${query}`);

    return successResponse({
      users: availableUsers,
      totalCount: availableUsers.length,
    });
  } catch (error) {
    logger.error('Search users failed:', error);

    return errorResponse('SEARCH_FAILED', 'Failed to search users', 500);
  }
};
