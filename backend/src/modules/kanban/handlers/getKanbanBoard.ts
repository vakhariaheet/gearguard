/**
 * Get Kanban Board Handler
 *
 * GET /api/kanban/board
 * Returns the Kanban board with filtered requests organized by status
 */

import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { kanbanService } from '../services/KanbanService';
import { BoardFilters } from '../types';

/**
 * Base handler for getting Kanban board
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { userId } = getAuthContext(event);

    logger.info('Getting Kanban board', {
      queryStringParameters: event.queryStringParameters,
      userId,
    });

    // Parse query parameters
    const query = event.queryStringParameters || {};

    // Build filters from query parameters
    const filters: BoardFilters = {};

    if (query['teams']) {
      filters.teams = query['teams'].split(',');
    }

    if (query['priorities']) {
      filters.priorities = query['priorities'].split(',');
    }

    if (query['equipmentCategories']) {
      filters.equipmentCategories = query['equipmentCategories'].split(',');
    }

    if (query['assignedTechnicians']) {
      filters.assignedTechnicians = query['assignedTechnicians'].split(',');
    }

    if (query['dateRange']) {
      try {
        const [start, end] = query['dateRange'].split(',');
        if (start && end) {
          filters.dateRange = { start, end };
        }
      } catch (dateError) {
        logger.warn('Invalid date range format', { dateRange: query['dateRange'] });
      }
    }

    if (query['showOverdueOnly'] === 'true') {
      filters.showOverdueOnly = true;
    }

    if (query['showMyRequestsOnly'] === 'true') {
      filters.showMyRequestsOnly = true;
    }

    // Get Kanban board
    const board = await kanbanService.getKanbanBoard(filters, userId);

    // Get board statistics
    const stats = await kanbanService.getBoardStats(filters, userId);

    logger.info('Kanban board retrieved successfully', {
      userId,
      requestCount: board.columns.reduce((sum, col) => sum + col.requests.length, 0),
      columnCount: board.columns.length,
    });

    return successResponse({
      board,
      stats,
    });
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Get Kanban board handler - Authenticated users
 * Returns the Kanban board with filtered requests organized by status
 *
 * @route GET /api/kanban/board
 */
export const handler = withRbac(baseHandler, 'kanban', 'read');
