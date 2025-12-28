/**
 * Create Calendar Event Handler
 *
 * POST /api/calendar/events
 * Creates a new calendar event
 */

import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { handleAsyncError } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { calendarService } from '../services/CalendarService';
import { CreateCalendarEventRequest } from '../types';

/**
 * Base handler for creating calendar event
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { userId, role: userRole } = getAuthContext(event);

    logger.info('Creating calendar event', {
      userId,
    });

    // Parse request body
    let requestBody: CreateCalendarEventRequest;
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
    if (
      !requestBody.title ||
      !requestBody.startTime ||
      !requestBody.endTime ||
      !requestBody.eventType ||
      !requestBody.priority
    ) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'title, startTime, endTime, eventType, and priority are required',
          },
        }),
      };
    }

    // Validate date format and logic
    const startTime = new Date(requestBody.startTime);
    const endTime = new Date(requestBody.endTime);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid date format. Use ISO 8601 format',
          },
        }),
      };
    }

    if (startTime >= endTime) {
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

    // Validate enum values
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
        if (isNaN(recurrenceEndDate.getTime()) || recurrenceEndDate <= startTime) {
          return {
            statusCode: 400,
            body: JSON.stringify({
              success: false,
              error: {
                code: 'BAD_REQUEST',
                message: 'Invalid recurrence end date',
              },
            }),
          };
        }
      }
    }

    // Check permissions for equipment assignment
    if (requestBody.equipmentId && userRole !== 'admin') {
      // In a real implementation, you might want to check if the user has access to this equipment
      logger.info('Non-admin user creating event for equipment', {
        userId,
        equipmentId: requestBody.equipmentId,
      });
    }

    // Create calendar event
    const createdEvent = await calendarService.createCalendarEvent(requestBody, userId);

    logger.info('Calendar event created successfully', {
      eventId: createdEvent.id,
      createdBy: userId,
      eventType: createdEvent.eventType,
    });

    return {
      statusCode: 201,
      body: JSON.stringify({
        success: true,
        data: {
          event: createdEvent,
          message: 'Calendar event created successfully',
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      }),
    };
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Create calendar event handler - Authenticated users with calendar create permission
 * Creates a new calendar event
 *
 * @route POST /api/calendar/events
 */
export const handler = withRbac(baseHandler, 'calendar', 'create');
