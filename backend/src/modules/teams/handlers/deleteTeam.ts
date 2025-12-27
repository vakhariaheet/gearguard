import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { teamService } from '../services/TeamService';

/**
 * @route DELETE /api/teams/:id
 * @description Delete team and all its members
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const teamId = event.pathParameters?.['id'];

    if (!teamId) {
      return errorResponse('MISSING_TEAM_ID', 'Team ID is required', 400);
    }

    // Check if team exists
    const team = await teamService.getTeam(teamId);
    if (!team) {
      return errorResponse('TEAM_NOT_FOUND', 'Team not found', 404);
    }

    // Delete team
    await teamService.deleteTeam(teamId);

    return successResponse({ message: 'Team deleted successfully' });
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'teams', 'delete');
