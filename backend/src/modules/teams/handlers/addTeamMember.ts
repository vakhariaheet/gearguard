import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { teamService } from '../services/TeamService';
import { AddTeamMemberRequest } from '../types';

/**
 * @route POST /api/teams/:id/members
 * @description Add a member to a team
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
    const body: AddTeamMemberRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.userId) {
      return errorResponse('MISSING_USER_ID', 'User ID is required', 400);
    }

    if (!body.role) {
      return errorResponse('MISSING_ROLE', 'Member role is required', 400);
    }

    // Validate role
    const validRoles = ['Lead', 'Senior', 'Junior', 'Trainee'];
    if (!validRoles.includes(body.role)) {
      return errorResponse('INVALID_ROLE', `Role must be one of: ${validRoles.join(', ')}`, 400);
    }

    // Validate skills if provided
    if (body.skills && !Array.isArray(body.skills)) {
      return errorResponse('INVALID_SKILLS', 'Skills must be an array', 400);
    }

    // Validate certifications if provided
    if (body.certifications && !Array.isArray(body.certifications)) {
      return errorResponse('INVALID_CERTIFICATIONS', 'Certifications must be an array', 400);
    }

    // Add team member
    const member = await teamService.addTeamMember(teamId, body);

    return successResponse(member, 201);
  } catch (error) {
    if ((error as any).message === 'Team not found') {
      return errorResponse('TEAM_NOT_FOUND', 'Team not found', 404);
    }
    if ((error as any).message === 'User is already a team member') {
      return errorResponse('USER_ALREADY_MEMBER', 'User is already a team member', 409);
    }
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'teams', 'update');
