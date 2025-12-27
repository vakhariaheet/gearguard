/**
 * Get Calendar Events Handler
 *
 * GET /api/calendar/events
 * Returns calendar events within a specified date range
 */

import { APIGatewayProxyResultV2 } from 'aws-lambda';
import { successResponse, handleAsyncError } from '../../../shared/response';
import { logger } from '../../../shared/logger';
import { AuthenticatedAPIGatewayEvent, getAuthContext } from '../../../shared/types';
import { withRbac } from '../../../shared/auth/rbacMiddleware';
import { calendarService } from '../services/CalendarService';
import { GetCalendarEventsQuery } from '../types';

/**
 * Base handler for getting calendar events
 */
const baseHandler = async (
  event: AuthenticatedAPIGatewayEvent
): Promise<APIGatewayProxyResultV2> => {
  try {
    const { userId, role: userRole } = getAuthContext(event);

    logger.info('Getting calendar events', {
      queryStringParameters: event.queryStringParameters,
      userId,
    });

    // Parse and validate query parameters
    const query = event.queryStringParameters || {};
    const startDate = query['startDate'];
    const endDate = query['endDate'];

    if (!startDate || !endDate) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'startDate and endDate are required',
          },
        }),
      };
    }

    // Validate date format
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
          },
        }),
      };
    }

    if (startDateObj > endDateObj) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'startDate must be before endDate',
          },
        }),
      };
    }

    // Build query object
    const eventsQuery: GetCalendarEventsQuery = {
      startDate,
      endDate,
    };

    const eventType = query['eventType'];
    const assignedTeam = query['assignedTeam'];
    const assignedTechnician = query['assignedTechnician'];

    if (eventType) {
      const validEventTypes = ['Preventive', 'Scheduled', 'Meeting', 'Deadline', 'Emergency'];
      if (!validEventTypes.includes(eventType)) {
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
      eventsQuery.eventType = eventType;
    }

    if (assignedTeam) {
      eventsQuery.assignedTeam = assignedTeam;
    }

    if (assignedTechnician) {
      eventsQuery.assignedTechnician = assignedTechnician;
    }

    // Get calendar events
    const events = await calendarService.getCalendarEvents(eventsQuery);

    // Filter events based on user role and permissions
    let filteredEvents = events;

    // If user is not admin, only show events they're involved in
    if (userRole !== 'admin') {
      filteredEvents = events.filter(
        (event) =>
          event.assignedTechnician === userId ||
          event.attendees?.includes(userId) ||
          // Add team-based filtering if user belongs to the team
          event.assignedTeam === assignedTeam
      );
    }

    logger.info('Calendar events retrieved successfully', {
      userId,
      eventCount: filteredEvents.length,
      dateRange: `${startDate} to ${endDate}`,
    });

    return successResponse({
      events: filteredEvents,
      totalCount: filteredEvents.length,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });
  } catch (error) {
    return handleAsyncError(error);
  }
};

/**
 * Get calendar events handler - Authenticated users
 * Returns calendar events within a specified date range
 *
 * @route GET /api/calendar/events
 */
export const handler = withRbac(baseHandler, 'calendar', 'read');
