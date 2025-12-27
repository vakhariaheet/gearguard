import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { teamService } from '../services/TeamService';
import { UpdateTeamRequest } from '../types';

/**
 * @route PUT /api/teams/:id
 * @description Update team details
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const teamId = event.pathParameters?.['id'];

    if (!teamId) {
      return errorResponse('MISSING_TEAM_ID', 'Team ID is required', 400);
    }

    // Parse request body
    const body: UpdateTeamRequest = JSON.parse(event.body || '{}');

    // Validate specialization if provided
    if (body.specialization) {
      const validSpecializations = [
        'Mechanics',
        'Electricians',
        'IT Support',
        'HVAC',
        'General',
        'Facilities',
      ];
      if (!validSpecializations.includes(body.specialization)) {
        return errorResponse(
          'INVALID_SPECIALIZATION',
          `Specialization must be one of: ${validSpecializations.join(', ')}`,
          400
        );
      }
    }

    // Validate skills if provided
    if (body.skills && !Array.isArray(body.skills)) {
      return errorResponse('INVALID_SKILLS', 'Skills must be an array', 400);
    }

    // Update team
    const team = await teamService.updateTeam(teamId, body);

    return successResponse(team);
  } catch (error) {
    if ((error as any).message === 'No fields to update') {
      return errorResponse('NO_FIELDS_TO_UPDATE', 'No fields provided for update', 400);
    }
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'teams', 'update');
