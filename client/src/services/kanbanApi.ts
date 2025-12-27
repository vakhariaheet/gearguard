/**
 * Kanban API Service
 *
 * API client for Kanban board and calendar operations
 */

import { apiClient } from './apiClient';
import type {
  BoardFilters,
  CalendarEvent,
  GetKanbanBoardResponse,
  UpdateRequestStatusRequest,
  UpdateRequestStatusResponse,
  GetCalendarEventsResponse,
  CreateCalendarEventRequest,
  CreateCalendarEventResponse,
  UpdateCalendarEventRequest,
  UpdateCalendarEventResponse,
} from '../types/kanban';

// =============================================================================
// KANBAN BOARD API
// =============================================================================

/**
 * Get Kanban board with optional filters
 */
export const getKanbanBoard = async (filters?: BoardFilters): Promise<GetKanbanBoardResponse> => {
  const params = new URLSearchParams();

  if (filters?.teams?.length) {
    params.append('teams', filters.teams.join(','));
  }

  if (filters?.priorities?.length) {
    params.append('priorities', filters.priorities.join(','));
  }

  if (filters?.equipmentCategories?.length) {
    params.append('equipmentCategories', filters.equipmentCategories.join(','));
  }

  if (filters?.assignedTechnicians?.length) {
    params.append('assignedTechnicians', filters.assignedTechnicians.join(','));
  }

  if (filters?.dateRange) {
    params.append('dateRange', `${filters.dateRange.start},${filters.dateRange.end}`);
  }

  if (filters?.showOverdueOnly) {
    params.append('showOverdueOnly', 'true');
  }

  if (filters?.showMyRequestsOnly) {
    params.append('showMyRequestsOnly', 'true');
  }

  const queryString = params.toString();
  const url = queryString ? `/api/kanban/board?${queryString}` : '/api/kanban/board';

  return apiClient.get<GetKanbanBoardResponse>(url);
};

/**
 * Update request status in Kanban board
 */
export const updateRequestStatus = async (
  requestId: string,
  statusUpdate: UpdateRequestStatusRequest
): Promise<UpdateRequestStatusResponse> => {
  return apiClient.put<UpdateRequestStatusResponse>(
    `/api/kanban/requests/${requestId}/status`,
    statusUpdate
  );
};

// =============================================================================
// CALENDAR API
// =============================================================================

/**
 * Get calendar events within a date range
 */
export const getCalendarEvents = async (
  startDate: string,
  endDate: string,
  filters?: {
    eventType?: string;
    assignedTeam?: string;
    assignedTechnician?: string;
  }
): Promise<GetCalendarEventsResponse> => {
  const params = new URLSearchParams({
    startDate,
    endDate,
  });

  if (filters?.eventType) {
    params.append('eventType', filters.eventType);
  }

  if (filters?.assignedTeam) {
    params.append('assignedTeam', filters.assignedTeam);
  }

  if (filters?.assignedTechnician) {
    params.append('assignedTechnician', filters.assignedTechnician);
  }

  return apiClient.get<GetCalendarEventsResponse>(`/api/calendar/events?${params.toString()}`);
};

/**
 * Create a new calendar event
 */
export const createCalendarEvent = async (
  eventData: CreateCalendarEventRequest
): Promise<CreateCalendarEventResponse> => {
  return apiClient.post<CreateCalendarEventResponse>('/api/calendar/events', eventData);
};

/**
 * Update an existing calendar event
 */
export const updateCalendarEvent = async (
  eventId: string,
  eventData: UpdateCalendarEventRequest
): Promise<UpdateCalendarEventResponse> => {
  return apiClient.put<UpdateCalendarEventResponse>(`/api/calendar/events/${eventId}`, eventData);
};

/**
 * Delete a calendar event
 */
export const deleteCalendarEvent = async (eventId: string): Promise<void> => {
  return apiClient.delete(`/api/calendar/events/${eventId}`);
};

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get upcoming events (next 7 days)
 */
export const getUpcomingEvents = async (filters?: {
  assignedTeam?: string;
  assignedTechnician?: string;
}): Promise<CalendarEvent[]> => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const response = await getCalendarEvents(now.toISOString(), nextWeek.toISOString(), filters);

  return response.events;
};

/**
 * Get events for a specific equipment
 */
export const getEquipmentEvents = async (
  equipmentId: string,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> => {
  const response = await getCalendarEvents(startDate, endDate);
  return response.events.filter((event) => event.equipmentId === equipmentId);
};

/**
 * Get events for current month
 */
export const getCurrentMonthEvents = async (filters?: {
  eventType?: string;
  assignedTeam?: string;
  assignedTechnician?: string;
}): Promise<CalendarEvent[]> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const response = await getCalendarEvents(
    startOfMonth.toISOString(),
    endOfMonth.toISOString(),
    filters
  );

  return response.events;
};

/**
 * Create preventive maintenance event
 */
export const createPreventiveMaintenanceEvent = async (
  equipmentId: string,
  equipmentName: string,
  scheduledDate: string,
  assignedTeam?: string,
  estimatedDuration?: number
): Promise<CalendarEvent> => {
  const eventData: CreateCalendarEventRequest = {
    title: `Preventive Maintenance - ${equipmentName}`,
    description: `Scheduled preventive maintenance for ${equipmentName}`,
    startTime: scheduledDate,
    endTime: new Date(
      new Date(scheduledDate).getTime() + (estimatedDuration || 120) * 60 * 1000
    ).toISOString(),
    eventType: 'Preventive',
    equipmentId,
    assignedTeam,
    priority: 'Medium',
    estimatedDuration: estimatedDuration || 120,
  };

  const response = await createCalendarEvent(eventData);
  return response.event;
};

/**
 * Create emergency maintenance event
 */
export const createEmergencyMaintenanceEvent = async (
  equipmentId: string,
  equipmentName: string,
  requestId: string,
  assignedTeam?: string
): Promise<CalendarEvent> => {
  const now = new Date();
  const eventData: CreateCalendarEventRequest = {
    title: `Emergency Repair - ${equipmentName}`,
    description: `Emergency maintenance required for ${equipmentName}`,
    startTime: now.toISOString(),
    endTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours default
    eventType: 'Emergency',
    equipmentId,
    assignedTeam,
    priority: 'Critical',
    relatedRequestId: requestId,
    estimatedDuration: 240, // 4 hours
  };

  const response = await createCalendarEvent(eventData);
  return response.event;
};

// =============================================================================
// EXPORT ALL FUNCTIONS
// =============================================================================

export const kanbanApi = {
  // Kanban operations
  getKanbanBoard,
  updateRequestStatus,

  // Calendar operations
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,

  // Convenience functions
  getUpcomingEvents,
  getEquipmentEvents,
  getCurrentMonthEvents,
  createPreventiveMaintenanceEvent,
  createEmergencyMaintenanceEvent,
};
