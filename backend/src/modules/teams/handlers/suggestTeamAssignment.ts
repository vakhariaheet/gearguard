import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { AuthenticatedAPIGatewayEvent } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { successResponse, errorResponse, handleAsyncError } from '../../../shared/response';
import { teamService } from '../services/TeamService';
import { TeamAssignmentRequest } from '../types';

/**
 * @route POST /api/teams/suggest-assignment
 * @description Suggest best team for equipment maintenance request using AI
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    // Parse request body
    const body: TeamAssignmentRequest = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.equipmentId) {
      return errorResponse('MISSING_EQUIPMENT_ID', 'Equipment ID is required', 400);
    }

    if (!body.equipmentCategory) {
      return errorResponse('MISSING_EQUIPMENT_CATEGORY', 'Equipment category is required', 400);
    }

    if (!body.urgency) {
      return errorResponse('MISSING_URGENCY', 'Urgency level is required', 400);
    }

    // Validate urgency level
    const validUrgencies = ['Low', 'Medium', 'High', 'Critical'];
    if (!validUrgencies.includes(body.urgency)) {
      return errorResponse(
        'INVALID_URGENCY',
        `Urgency must be one of: ${validUrgencies.join(', ')}`,
        400
      );
    }

    // Validate required skills if provided
    if (body.requiredSkills && !Array.isArray(body.requiredSkills)) {
      return errorResponse('INVALID_REQUIRED_SKILLS', 'Required skills must be an array', 400);
    }

    // Get team suggestion
    const suggestion = await teamService.suggestTeamAssignment(body);

    return successResponse(suggestion);
  } catch (error) {
    if ((error as any).message === 'No active teams available') {
      return errorResponse('NO_ACTIVE_TEAMS', 'No active teams available for assignment', 404);
    }
    return handleAsyncError(error);
  }
};

export const handler = withRbac(baseHandler, 'teams', 'read');
