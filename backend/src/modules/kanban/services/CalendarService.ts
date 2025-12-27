/**
 * Calendar Service - Business logic for calendar operations
 *
 * Handles calendar event management, scheduling, and recurrence rules
 */

import { dynamodb } from '../../../shared/clients/dynamodb';
import { logger } from '../../../shared/logger';
import {
  CalendarEvent,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  GetCalendarEventsQuery,
  generateCalendarKeys,
} from '../types';
import { handleError, parseDate } from '../../../shared/utils/queryParams';

export class CalendarService {
  /**
   * Get calendar events within a date range
   */
  async getCalendarEvents(query: GetCalendarEventsQuery): Promise<CalendarEvent[]> {
    try {
      logger.info('Getting calendar events', { query });

      // Parse and validate dates
      const startDateObj = parseDate(query.startDate);
      const endDateObj = parseDate(query.endDate);

      if (!startDateObj || !endDateObj) {
        throw new Error('Invalid date format in query parameters');
      }

      // Query events by date range using GSI1
      const startDate = startDateObj.toISOString().split('T')[0]; // Get date part only
      const endDate = endDateObj.toISOString().split('T')[0];

      const events: CalendarEvent[] = [];

      // Query for each date in the range (simplified approach)
      // In production, you might want to use a more efficient range query
      const currentDate = new Date(startDateObj);
      const endDateLoop = new Date(endDateObj);

      while (currentDate <= endDateLoop) {
        const dateStr = currentDate.toISOString().split('T')[0];

        const result = await dynamodb.query(
          'GSI1PK = :datePK',
          { ':datePK': `DATE#${dateStr}` },
          { indexName: 'GSI1' }
        );

        if (result.items) {
          const dayEvents = result.items
            .filter((item: any) => item.SK === 'DETAILS')
            .map((item: any) => this.mapDynamoToEvent(item));

          events.push(...dayEvents);
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Apply additional filters
      let filteredEvents = events;

      if (query.eventType) {
        filteredEvents = filteredEvents.filter((event) => event.eventType === query.eventType);
      }

      if (query.assignedTeam) {
        filteredEvents = filteredEvents.filter(
          (event) => event.assignedTeam === query.assignedTeam
        );
      }

      if (query.assignedTechnician) {
        filteredEvents = filteredEvents.filter(
          (event) => event.assignedTechnician === query.assignedTechnician
        );
      }

      // Sort by start time
      filteredEvents.sort(
        (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      );

      logger.info('Calendar events retrieved successfully', {
        eventCount: filteredEvents.length,
        dateRange: `${startDate} to ${endDate}`,
      });

      return filteredEvents;
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to get calendar events', { error: message, query });
      throw new Error(`Failed to get calendar events: ${message}`);
    }
  }

  /**
   * Create a new calendar event
   */
  async createCalendarEvent(
    eventData: CreateCalendarEventRequest,
    createdBy: string
  ): Promise<CalendarEvent> {
    try {
      logger.info('Creating calendar event', { eventData, createdBy });

      const eventId = `event_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const now = new Date().toISOString();

      const event: CalendarEvent = {
        id: eventId,
        title: eventData.title,
        description: eventData.description,
        startTime: eventData.startTime,
        endTime: eventData.endTime,
        eventType: eventData.eventType,
        equipmentId: eventData.equipmentId,
        equipmentName: eventData.equipmentId
          ? await this.getEquipmentName(eventData.equipmentId)
          : undefined,
        assignedTeam: eventData.assignedTeam,
        assignedTechnician: eventData.assignedTechnician,
        location: eventData.location,
        priority: eventData.priority,
        status: 'Scheduled',
        isAllDay: eventData.isAllDay || false,
        recurrence: eventData.recurrence,
        attendees: eventData.attendees || [],
        relatedRequestId: eventData.relatedRequestId,
        estimatedDuration: eventData.estimatedDuration,
        createdAt: now,
        updatedAt: now,
      };

      // Store main event details
      const eventDate = event.startTime.split('T')[0];
      const keys = generateCalendarKeys(eventId, eventDate);

      await dynamodb.put({
        ...keys.details,
        ...event,
      });

      // Store recurrence rule if present
      if (event.recurrence) {
        await dynamodb.put({
          ...keys.recurrence,
          eventId,
          recurrence: event.recurrence,
        });

        // Generate recurring events (simplified - in production, you might want to do this asynchronously)
        await this.generateRecurringEvents(event);
      }

      logger.info('Calendar event created successfully', { eventId });
      return event;
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to create calendar event', { error: message, eventData });
      throw new Error(`Failed to create calendar event: ${message}`);
    }
  }

  /**
   * Update an existing calendar event
   */
  async updateCalendarEvent(
    eventId: string,
    updateData: UpdateCalendarEventRequest,
    updatedBy: string
  ): Promise<CalendarEvent> {
    try {
      logger.info('Updating calendar event', { eventId, updateData, updatedBy });

      // Get existing event
      const existingEvent = await this.getEventById(eventId);
      if (!existingEvent) {
        throw new Error('Event not found');
      }

      // Prepare update data
      const updates: any = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      // Update equipment name if equipment ID changed
      if (updateData.equipmentId && updateData.equipmentId !== existingEvent.equipmentId) {
        updates.equipmentName = await this.getEquipmentName(updateData.equipmentId);
      }

      // Update the event
      const eventDate = (updateData.startTime || existingEvent.startTime).split('T')[0];
      const keys = generateCalendarKeys(eventId, eventDate);

      await dynamodb.update(keys.details, updates);

      // Handle recurrence updates
      if (updateData.recurrence !== undefined) {
        if (updateData.recurrence) {
          // Update or create recurrence rule
          await dynamodb.put({
            ...keys.recurrence,
            eventId,
            recurrence: updateData.recurrence,
          });
        } else {
          // Remove recurrence rule
          await dynamodb.delete(keys.recurrence);
        }
      }

      // Get updated event
      const updatedEvent = await this.getEventById(eventId);
      if (!updatedEvent) {
        throw new Error('Failed to retrieve updated event');
      }

      logger.info('Calendar event updated successfully', { eventId });
      return updatedEvent;
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to update calendar event', { error: message, eventId });
      throw new Error(`Failed to update calendar event: ${message}`);
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteCalendarEvent(eventId: string): Promise<void> {
    try {
      logger.info('Deleting calendar event', { eventId });

      // Get event to determine date for key generation
      const event = await this.getEventById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }

      const eventDate = event.startTime.split('T')[0];
      const keys = generateCalendarKeys(eventId, eventDate);

      // Delete main event
      await dynamodb.delete(keys.details);

      // Delete recurrence rule if exists
      if (event.recurrence) {
        await dynamodb.delete(keys.recurrence);
      }

      logger.info('Calendar event deleted successfully', { eventId });
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to delete calendar event', { error: message, eventId });
      throw new Error(`Failed to delete calendar event: ${message}`);
    }
  }

  /**
   * Get event by ID
   */
  private async getEventById(eventId: string): Promise<CalendarEvent | null> {
    try {
      // We need to scan since we don't know the date for the sort key
      const result = await dynamodb.query('PK = :pk AND begins_with(SK, :sk)', {
        ':pk': `CALENDAR#EVENT#${eventId}`,
        ':sk': 'DETAILS',
      });

      if (result.items && result.items.length > 0) {
        return this.mapDynamoToEvent(result.items[0]);
      }

      return null;
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to get event by ID', { error: message, eventId });
      return null;
    }
  }

  /**
   * Map DynamoDB item to CalendarEvent
   */
  private mapDynamoToEvent(item: any): CalendarEvent {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      startTime: item.startTime,
      endTime: item.endTime,
      eventType: item.eventType,
      equipmentId: item.equipmentId,
      equipmentName: item.equipmentName,
      assignedTeam: item.assignedTeam,
      assignedTechnician: item.assignedTechnician,
      location: item.location,
      priority: item.priority,
      status: item.status,
      isAllDay: item.isAllDay,
      recurrence: item.recurrence,
      attendees: item.attendees || [],
      relatedRequestId: item.relatedRequestId,
      estimatedDuration: item.estimatedDuration,
      actualDuration: item.actualDuration,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Get equipment name by ID (would integrate with equipment service)
   */
  private async getEquipmentName(equipmentId: string): Promise<string> {
    try {
      // This would integrate with the equipment service
      // For now, return a placeholder
      const result = await dynamodb.get({
        PK: `EQUIPMENT#${equipmentId}`,
        SK: 'DETAILS',
      });

      return (result as any).item?.equipmentName || 'Unknown Equipment';
    } catch (error) {
      const { message } = handleError(error);
      logger.warn('Failed to get equipment name', { error: message, equipmentId });
      return 'Unknown Equipment';
    }
  }

  /**
   * Generate recurring events (simplified implementation)
   */
  private async generateRecurringEvents(baseEvent: CalendarEvent): Promise<void> {
    try {
      if (!baseEvent.recurrence) return;

      const { recurrence } = baseEvent;
      const startDate = new Date(baseEvent.startTime);
      const endDate = recurrence.endDate
        ? new Date(recurrence.endDate)
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default

      let currentDate = new Date(startDate);
      const events: CalendarEvent[] = [];

      // Generate up to 100 recurring events to prevent infinite loops
      let count = 0;
      const maxEvents = 100;

      while (currentDate <= endDate && count < maxEvents) {
        // Calculate next occurrence based on recurrence type
        switch (recurrence.type) {
          case 'Daily':
            currentDate.setDate(currentDate.getDate() + recurrence.interval);
            break;
          case 'Weekly':
            currentDate.setDate(currentDate.getDate() + 7 * recurrence.interval);
            break;
          case 'Monthly':
            currentDate.setMonth(currentDate.getMonth() + recurrence.interval);
            break;
          case 'Yearly':
            currentDate.setFullYear(currentDate.getFullYear() + recurrence.interval);
            break;
        }

        if (currentDate <= endDate) {
          // Create recurring event
          const recurringEventId = `${baseEvent.id}_recurring_${count}`;
          const eventDuration =
            new Date(baseEvent.endTime).getTime() - new Date(baseEvent.startTime).getTime();
          const recurringStartTime = new Date(currentDate);
          const recurringEndTime = new Date(currentDate.getTime() + eventDuration);

          const recurringEvent: CalendarEvent = {
            ...baseEvent,
            id: recurringEventId,
            startTime: recurringStartTime.toISOString(),
            endTime: recurringEndTime.toISOString(),
            title: `${baseEvent.title} (Recurring)`,
          };

          events.push(recurringEvent);
          count++;
        }
      }

      // Store recurring events
      for (const event of events) {
        const eventDate = event.startTime.split('T')[0];
        const keys = generateCalendarKeys(event.id, eventDate);

        await dynamodb.put({
          ...keys.details,
          ...event,
        });
      }

      logger.info('Generated recurring events', {
        baseEventId: baseEvent.id,
        recurringEventCount: events.length,
      });
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to generate recurring events', {
        error: message,
        baseEventId: baseEvent.id,
      });
      // Don't throw - this is non-critical for the main event creation
    }
  }

  /**
   * Get events for a specific equipment
   */
  async getEquipmentEvents(
    equipmentId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarEvent[]> {
    try {
      const allEvents = await this.getCalendarEvents({ startDate, endDate });
      return allEvents.filter((event) => event.equipmentId === equipmentId);
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to get equipment events', { error: message, equipmentId });
      throw error;
    }
  }

  /**
   * Get events for a specific team
   */
  async getTeamEvents(
    teamId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarEvent[]> {
    try {
      const allEvents = await this.getCalendarEvents({ startDate, endDate });
      return allEvents.filter((event) => event.assignedTeam === teamId);
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to get team events', { error: message, teamId });
      throw error;
    }
  }

  /**
   * Get upcoming events (next 7 days)
   */
  async getUpcomingEvents(userId?: string): Promise<CalendarEvent[]> {
    try {
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const events = await this.getCalendarEvents({
        startDate: now.toISOString(),
        endDate: nextWeek.toISOString(),
      });

      // Filter by user if provided
      if (userId) {
        return events.filter(
          (event) => event.assignedTechnician === userId || event.attendees?.includes(userId)
        );
      }

      return events;
    } catch (error) {
      const { message } = handleError(error);
      logger.error('Failed to get upcoming events', { error: message, userId });
      throw error;
    }
  }
}

export const calendarService = new CalendarService();
