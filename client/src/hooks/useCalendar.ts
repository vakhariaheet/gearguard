/**
 * Calendar Hooks
 *
 * React hooks for calendar operations with real-time updates
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { kanbanApi } from '../services/kanbanApi';
import { getMockCalendarEvents } from '../data/mockData';
import { DEV_FLAGS, logMockUsage } from '../utils/devMode';
import type {
  CalendarEvent,
  CreateCalendarEventRequest,
  UpdateCalendarEventRequest,
  EventType,
} from '../types/kanban';

// =============================================================================
// CALENDAR EVENTS HOOK
// =============================================================================

export const useCalendarEvents = (
  startDate: string,
  endDate: string,
  filters?: {
    eventType?: string;
    assignedTeam?: string;
    assignedTechnician?: string;
  }
) => {
  // Query for calendar events
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['calendar-events', startDate, endDate, filters],
    queryFn: async () => {
      if (DEV_FLAGS.useMockCalendar) {
        logMockUsage('Calendar Events', true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 400));
        const events = getMockCalendarEvents(startDate, endDate, filters);
        return {
          events,
          totalCount: events.length,
          dateRange: { start: startDate, end: endDate },
        };
      }
      return kanbanApi.getCalendarEvents(startDate, endDate, filters);
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled: !!startDate && !!endDate,
    refetchInterval: DEV_FLAGS.useMockCalendar ? false : 60 * 1000, // Don't auto-refetch mock data
  });

  return {
    events: data?.events || [],
    totalCount: data?.totalCount || 0,
    dateRange: data?.dateRange,
    isLoading,
    error,
    refetch,
  };
};

// =============================================================================
// CREATE EVENT HOOK
// =============================================================================

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: CreateCalendarEventRequest) => {
      if (DEV_FLAGS.useMockCalendar) {
        logMockUsage('Create Calendar Event', true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return {
          success: true,
          message: `Event "${eventData.title}" created successfully`,
          event: {
            id: `event_${Date.now()}`,
            ...eventData,
            status: 'Scheduled',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      }
      return kanbanApi.createCalendarEvent(eventData);
    },

    onSuccess: (data) => {
      // Invalidate calendar queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['upcoming-events'] });

      toast.success(data.message || 'Calendar event created successfully');
    },

    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to create calendar event');
    },
  });
};

// =============================================================================
// UPDATE EVENT HOOK
// =============================================================================

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      eventData,
    }: {
      eventId: string;
      eventData: UpdateCalendarEventRequest;
    }) => {
      if (DEV_FLAGS.useMockCalendar) {
        logMockUsage('Update Calendar Event', true);
        await new Promise((resolve) => setTimeout(resolve, 800));
        return {
          success: true,
          message: `Event ${eventId} updated successfully`,
          event: { id: eventId, ...eventData, updatedAt: new Date().toISOString() },
        };
      }
      return kanbanApi.updateCalendarEvent(eventId, eventData);
    },

    onMutate: async ({ eventId, eventData }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['calendar-events'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ['calendar-events'] });

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: ['calendar-events'] }, (oldData: any) => {
        if (!oldData?.events) return oldData;

        const newEvents = oldData.events.map((event: CalendarEvent) => {
          if (event.id === eventId) {
            return {
              ...event,
              ...eventData,
              updatedAt: new Date().toISOString(),
            };
          }
          return event;
        });

        return {
          ...oldData,
          events: newEvents,
        };
      });

      return { previousData };
    },

    onSuccess: (data) => {
      toast.success(data.message || 'Calendar event updated successfully');
    },

    onError: (error, _variables, context) => {
      // Rollback optimistic updates
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error(error instanceof Error ? error.message : 'Failed to update calendar event');
    },

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

// =============================================================================
// DELETE EVENT HOOK
// =============================================================================

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      if (DEV_FLAGS.useMockCalendar) {
        logMockUsage('Delete Calendar Event', true);
        await new Promise((resolve) => setTimeout(resolve, 600));
        return {
          success: true,
          message: `Event ${eventId} deleted successfully`,
        };
      }
      return kanbanApi.deleteCalendarEvent(eventId);
    },

    onMutate: async (eventId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['calendar-events'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueriesData({ queryKey: ['calendar-events'] });

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: ['calendar-events'] }, (oldData: any) => {
        if (!oldData?.events) return oldData;

        return {
          ...oldData,
          events: oldData.events.filter((event: CalendarEvent) => event.id !== eventId),
        };
      });

      return { previousData };
    },

    onSuccess: () => {
      toast.success('Calendar event deleted successfully');
    },

    onError: (error, _eventId, context) => {
      // Rollback optimistic updates
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      toast.error(error instanceof Error ? error.message : 'Failed to delete calendar event');
    },

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

// =============================================================================
// UPCOMING EVENTS HOOK
// =============================================================================

export const useUpcomingEvents = (filters?: {
  assignedTeam?: string;
  assignedTechnician?: string;
}) => {
  return useQuery({
    queryKey: ['upcoming-events', filters],
    queryFn: () => kanbanApi.getUpcomingEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000, // Refetch every 10 minutes
  });
};

// =============================================================================
// CURRENT MONTH EVENTS HOOK
// =============================================================================

export const useCurrentMonthEvents = (filters?: {
  eventType?: string;
  assignedTeam?: string;
  assignedTechnician?: string;
}) => {
  return useQuery({
    queryKey: ['current-month-events', filters],
    queryFn: () => kanbanApi.getCurrentMonthEvents(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// =============================================================================
// EQUIPMENT EVENTS HOOK
// =============================================================================

export const useEquipmentEvents = (equipmentId: string, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['equipment-events', equipmentId, startDate, endDate],
    queryFn: () => kanbanApi.getEquipmentEvents(equipmentId, startDate, endDate),
    enabled: !!equipmentId && !!startDate && !!endDate,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// =============================================================================
// CALENDAR VIEW HOOK
// =============================================================================

export const useCalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');

  // Calculate date range based on current view
  const dateRange = useMemo(() => {
    const start = new Date(currentDate);
    const end = new Date(currentDate);

    switch (view) {
      case 'day':
        end.setDate(start.getDate() + 1);
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        end.setDate(start.getDate() + 7);
        break;
      case 'month':
        start.setDate(1);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        break;
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    };
  }, [currentDate, view]);

  const navigateDate = useCallback(
    (direction: 'prev' | 'next') => {
      setCurrentDate((prev) => {
        const newDate = new Date(prev);

        switch (view) {
          case 'day':
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
            break;
          case 'week':
            newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
            break;
          case 'month':
            newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
            break;
        }

        return newDate;
      });
    },
    [view]
  );

  const goToToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  const goToDate = useCallback((date: Date) => {
    setCurrentDate(date);
  }, []);

  return {
    currentDate,
    view,
    setView,
    dateRange,
    navigateDate,
    goToToday,
    goToDate,
  };
};

// =============================================================================
// EVENT FORM HOOK
// =============================================================================

export const useEventForm = (initialEvent?: CalendarEvent) => {
  const [formData, setFormData] = useState<Partial<CreateCalendarEventRequest>>(() => {
    if (initialEvent) {
      return {
        title: initialEvent.title,
        description: initialEvent.description,
        startTime: initialEvent.startTime,
        endTime: initialEvent.endTime,
        eventType: initialEvent.eventType,
        equipmentId: initialEvent.equipmentId,
        assignedTeam: initialEvent.assignedTeam,
        assignedTechnician: initialEvent.assignedTechnician,
        location: initialEvent.location,
        priority: initialEvent.priority,
        isAllDay: initialEvent.isAllDay,
        recurrence: initialEvent.recurrence,
        attendees: initialEvent.attendees,
        relatedRequestId: initialEvent.relatedRequestId,
        estimatedDuration: initialEvent.estimatedDuration,
      };
    }
    return {
      eventType: 'Scheduled' as EventType,
      priority: 'Medium' as const,
      isAllDay: false,
    };
  });

  const updateField = useCallback((field: keyof CreateCalendarEventRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      eventType: 'Scheduled' as EventType,
      priority: 'Medium' as const,
      isAllDay: false,
    });
  }, []);

  const isValid = useMemo(() => {
    return !!(
      formData.title &&
      formData.startTime &&
      formData.endTime &&
      formData.eventType &&
      formData.priority
    );
  }, [formData]);

  return {
    formData,
    updateField,
    resetForm,
    isValid,
  };
};

// =============================================================================
// EXPORT ALL HOOKS
// =============================================================================

export const calendarHooks = {
  useCalendarEvents,
  useCreateCalendarEvent,
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
  useUpcomingEvents,
  useCurrentMonthEvents,
  useEquipmentEvents,
  useCalendarView,
  useEventForm,
};
