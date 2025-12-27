import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { teamService } from '../services/TeamService';

/**
 * @route GET /api/teams/:id
 * @description Get team by ID with members
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const teamId = event.pathParameters?.['id'];

    if (!teamId) {
      return errorResponse('MISSING_TEAM_ID', 'Team ID is required', 400);
    }

    const team = await teamService.getTeam(teamId);

    if (!team) {
      return errorResponse('TEAM_NOT_FOUND', 'Team not found', 404);
    }

    return successResponse(team);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'teams', 'read');
