/**
 * Update Calendar Event Handler
 *
 * PUT /api/calendar/events/:id
 * Updates an existing calendar event
 */

import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { calendarService } from '../services/CalendarService';
import { UpdateCalendarEventRequest } from '../types';

/**
 * Base handler for updating calendar event
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const eventId = event.pathParameters?.['id'];
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

    const { userId } = getAuthContext(event);

    logger.info('Updating calendar event', {
      eventId,
      userId,
    });

    // Parse request body
    let requestBody: UpdateCalendarEventRequest;
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

    // Validate date format and logic if dates are provided
    if (requestBody.startTime || requestBody.endTime) {
      const startTime = requestBody.startTime ? new Date(requestBody.startTime) : null;
      const endTime = requestBody.endTime ? new Date(requestBody.endTime) : null;

      if (startTime && isNaN(startTime.getTime())) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid startTime format. Use ISO 8601 format',
            },
          }),
        };
      }

      if (endTime && isNaN(endTime.getTime())) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid endTime format. Use ISO 8601 format',
            },
          }),
        };
      }

      if (startTime && endTime && startTime >= endTime) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'startTime must be before endTime',
            },
          }),
        };
      }
    }

    // Validate enum values if provided
    if (requestBody.eventType) {
      const validEventTypes = ['Preventive', 'Scheduled', 'Meeting', 'Deadline', 'Emergency'];
      if (!validEventTypes.includes(requestBody.eventType)) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid eventType',
            },
          }),
        };
      }
    }

    if (requestBody.priority) {
      const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
      if (!validPriorities.includes(requestBody.priority)) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid priority',
            },
          }),
        };
      }
    }

    if (requestBody.status) {
      const validStatuses = ['Scheduled', 'InProgress', 'Completed', 'Cancelled'];
      if (!validStatuses.includes(requestBody.status)) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid status',
            },
          }),
        };
      }
    }

    // Validate recurrence rule if provided
    if (requestBody.recurrence) {
      const validRecurrenceTypes = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
      if (!validRecurrenceTypes.includes(requestBody.recurrence.type)) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Invalid recurrence type',
            },
          }),
        };
      }

      if (requestBody.recurrence.interval < 1) {
        return {
          statusCode: 400,
          body: JSON.stringify({
            success: false,
            error: {
              code: 'BAD_REQUEST',
              message: 'Recurrence interval must be at least 1',
            },
          }),
        };
      }

      if (requestBody.recurrence.endDate) {
        const recurrenceEndDate = new Date(requestBody.recurrence.endDate);
        if (isNaN(recurrenceEndDate.getTime())) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              success: false,
              error: {
                code: 'BAD_REQUEST',
                message: 'Invalid recurrence end date format',
              },
            }),
          };
        }
      }
    }

    // Validate duration if provided
    if (requestBody.estimatedDuration !== undefined && requestBody.estimatedDuration < 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'estimatedDuration must be non-negative',
          },
        }),
      };
    }

    if (requestBody.actualDuration !== undefined && requestBody.actualDuration < 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'actualDuration must be non-negative',
          },
        }),
      };
    }

    // Update calendar event
    const updatedEvent = await calendarService.updateCalendarEvent(eventId, requestBody, userId);

    logger.info('Calendar event updated successfully', {
      eventId,
      updatedBy: userId,
      updatedFields: Object.keys(requestBody),
    });

    return successResponse({
      event: updatedEvent,
      message: 'Calendar event updated successfully',
    });
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Update calendar event handler - Authenticated users with calendar update permission
 * Updates an existing calendar event
 *
 * @route PUT /api/calendar/events/:id
 */
export const handler = withRbac(baseHandler, 'calendar', 'update');
