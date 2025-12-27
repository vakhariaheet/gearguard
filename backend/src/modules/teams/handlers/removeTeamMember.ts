import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { teamService } from '../services/TeamService';

/**
 * @route DELETE /api/teams/:id/members/:userId
 * @description Remove a member from a team
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const teamId = event.pathParameters?.['id'];
    const userId = event.pathParameters?.['userId'];

    if (!teamId) {
      return errorResponse('MISSING_TEAM_ID', 'Team ID is required', 400);
    }

    if (!userId) {
      return errorResponse('MISSING_USER_ID', 'User ID is required', 400);
    }

    // Check if team exists
    const team = await teamService.getTeam(teamId);
    if (!team) {
      return errorResponse('TEAM_NOT_FOUND', 'Team not found', 404);
    }

    // Check if user is a team member
    const isMember = team.members.some((member) => member.userId === userId);
    if (!isMember) {
      return errorResponse('USER_NOT_MEMBER', 'User is not a team member', 404);
    }

    // Remove team member
    await teamService.removeTeamMember(teamId, userId);

    return successResponse({ message: 'Team member removed successfully' });
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'teams', 'update');
