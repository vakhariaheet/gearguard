/**
 * Delete Calendar Event Handler
 *
 * DELETE /api/calendar/events/{id}
 * Deletes a calendar event
 */

import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { handleAsyncError } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { calendarService } from '../services/CalendarService';

/**
 * Base handler for deleting calendar event
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { userId } = getAuthContext(event);
    const eventId = event.pathParameters?.['id'];

    logger.info('Deleting calendar event', {
      userId,
      eventId,
    });

    if (!eventId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Event ID is required',
          },
        }),
      };
    }

    // Delete the event
    await calendarService.deleteCalendarEvent(eventId);

    logger.info('Calendar event deleted successfully', {
      userId,
      eventId,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Calendar event deleted successfully',
      }),
    };
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Handler with RBAC middleware
 */
export const handler = withRbac(baseHandler, 'calendar', 'delete');
