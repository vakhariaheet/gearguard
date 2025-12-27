import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { teamService } from '../services/TeamService';
import { CreateTeamRequest } from '../types';

/**
 * @route POST /api/teams
 * @description Create a new team
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Parse request body
    const body: CreateTeamRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.teamName) {
      return errorResponse('MISSING_TEAM_NAME', 'Team name is required', 400);
    }

    if (!body.specialization) {
      return errorResponse('MISSING_SPECIALIZATION', 'Team specialization is required', 400);
    }

    if (!body.skills || !Array.isArray(body.skills)) {
      return errorResponse('MISSING_SKILLS', 'Team skills array is required', 400);
    }

    // Validate specialization
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

    // Create team
    const team = await teamService.createTeam(body);

    return successResponse(team, 201);
  } catch (error) {
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'teams', 'create');
