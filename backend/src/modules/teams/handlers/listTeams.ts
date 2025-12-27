import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { teamService } from '../services/TeamService';
import { ListTeamsQuery } from '../types';

/**
 * @route GET /api/teams
 * @description List all teams with pagination and filtering
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const queryParams = event.queryStringParameters || {};

    const query: ListTeamsQuery = {
      limit: queryParams['limit'] ? parseInt(queryParams['limit'], 10) : undefined,
      offset: queryParams['offset'] ? parseInt(queryParams['offset'], 10) : undefined,
      specialization: queryParams['specialization'] || undefined,
      isActive: queryParams['isActive'] ? queryParams['isActive'] === 'true' : undefined,
      orderBy: (queryParams['orderBy'] as any) || undefined,
    };

    const result = await teamService.listTeams(query);

    return successResponse(result);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'teams', 'read');
