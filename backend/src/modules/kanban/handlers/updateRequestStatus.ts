/**
 * Update Request Status Handler
 *
 * PUT /api/kanban/requests/:id/status
 * Updates the status of a request in the Kanban board
 */

import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { kanbanService } from '../services/KanbanService';
import { UpdateRequestStatusRequest } from '../types';

/**
 * Base handler for updating request status
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const requestId = event.pathParameters?.['id'];
    if (!requestId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Request ID is required',
          },
        }),
      };
    }

    const { userId } = getAuthContext(event);

    logger.info('Updating request status', {
      requestId,
      userId,
    });

    // Parse request body
    let requestBody: UpdateRequestStatusRequest;
    try {
      requestBody = JSON.parse(event.body || '{}');
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid JSON in request body',
          },
        }),
      };
    }

    // Validate required fields
    if (!requestBody.newStatus || !requestBody.previousStatus) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'newStatus and previousStatus are required',
          },
        }),
      };
    }

    // Validate status values
    const validStatuses = ['New', 'In Progress', 'Repaired', 'Scrap'];
    if (
      !validStatuses.includes(requestBody.newStatus) ||
      !validStatuses.includes(requestBody.previousStatus)
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid status value',
          },
        }),
      };
    }

    // Update request status
    await kanbanService.updateRequestStatus(
      requestId,
      requestBody.newStatus,
      requestBody.previousStatus,
      userId,
      requestBody.reason
    );

    // Get updated board to return the current state
    const board = await kanbanService.getKanbanBoard({}, userId);

    // Find the updated request
    let updatedRequest = null;
    for (const column of board.columns) {
      const request = column.requests.find((r) => r.id === requestId);
      if (request) {
        updatedRequest = request;
        break;
      }
    }

    if (!updatedRequest) {
      logger.warn('Updated request not found in board', { requestId });
    }

    logger.info('Request status updated successfully', {
      requestId,
      newStatus: requestBody.newStatus,
      updatedBy: userId,
    });

    return successResponse({
      success: true,
      request: updatedRequest,
      message: `Request status updated to ${requestBody.newStatus}`,
    });
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Update request status handler - Authenticated users with kanban update permission
 * Updates the status of a request in the Kanban board
 *
 * @route PUT /api/kanban/requests/:id/status
 */
export const handler = withRbac(baseHandler, 'kanban', 'update');
