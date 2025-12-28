/**
 * Maintenance Calendar Component
 *
 * Calendar view for preventive maintenance scheduling and event management
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Filter,
  Clock,
  MapPin,
  User,
  Wrench,
} from 'lucide-react';
import { useCalendarEvents, useCalendarView } from '@/hooks/useCalendar';
import type { CalendarEvent } from '@/types/kanban';
import { getEventTypeColor } from '@/types/kanban';
import { cn } from '@/lib/utils';

interface MaintenanceCalendarProps {
  onEventClick?: (event: CalendarEvent) => void;
  onCreateEvent?: () => void;
  onDateClick?: (date: Date) => void;
}

export const MaintenanceCalendar: React.FC<MaintenanceCalendarProps> = ({
  onEventClick,
  onCreateEvent,
  onDateClick,
}) => {
  const [selectedFilters, setSelectedFilters] = useState({
    eventType: '',
    assignedTeam: '',
    assignedTechnician: '',
  });

  // Calendar view management
  const { currentDate, view, setView, dateRange, navigateDate, goToToday } = useCalendarView();

  // Fetch calendar events with filters
  const {
    events,
    isLoading,
    // error,
    // refetch,
  } = useCalendarEvents(dateRange.start, dateRange.end, selectedFilters);

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedFilters({
      eventType: '',
      assignedTeam: '',
      assignedTechnician: '',
    });
  };

  // Generate calendar grid for month view
  const calendarGrid = useMemo(() => {
    if (view !== 'month') return [];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the first Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End at the last Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days = [];
    const currentDay = new Date(startDate);

    while (currentDay <= endDate) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  }, [currentDate, view]);

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => {
      const eventDate = new Date(event.startTime).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Format date for display
  const formatDate = (date: Date): string => {
    switch (view) {
      case 'day':
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
      case 'month':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
        });
      default:
        return date.toLocaleDateString();
    }
  };

  // Render event item
  const renderEvent = (event: CalendarEvent, isCompact = false) => (
    <div
      key={event.id}
      className={cn(
        'p-2 rounded cursor-pointer transition-colors hover:opacity-80',
        isCompact ? 'text-xs mb-1' : 'text-sm mb-2'
      )}
      style={{ backgroundColor: getEventTypeColor(event.eventType) + '20' }}
      onClick={() => onEventClick?.(event)}
    >
      <div className="flex items-center gap-1 mb-1">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: getEventTypeColor(event.eventType) }}
        />
        <span className="font-medium truncate">{event.title}</span>
      </div>

      {!isCompact && (
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {new Date(event.startTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
              {!event.isAllDay && (
                <>
                  {' - '}
                  {new Date(event.endTime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </>
              )}
            </span>
          </div>

          {event.equipmentName && (
            <div className="flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              <span className="truncate">{event.equipmentName}</span>
            </div>
          )}

          {event.assignedTeam && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span className="truncate">{event.assignedTeam}</span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 animate-pulse" />
          <span>Loading calendar...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Header */}
      <Card className="mb-6 flex-shrink-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <span>Maintenance Calendar</span>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onCreateEvent}>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Filter Controls */}
          <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Event Type:</label>
              <select
                value={selectedFilters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="">All Types</option>
                <option value="Preventive">Preventive</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Meeting">Meeting</option>
                <option value="Deadline">Deadline</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Team:</label>
              <input
                type="text"
                value={selectedFilters.assignedTeam}
                onChange={(e) => handleFilterChange('assignedTeam', e.target.value)}
                placeholder="Team name"
                className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Technician:</label>
              <input
                type="text"
                value={selectedFilters.assignedTechnician}
                onChange={(e) => handleFilterChange('assignedTechnician', e.target.value)}
                placeholder="Technician name"
                className="px-2 py-1 border border-gray-300 rounded text-sm w-32"
              />
            </div>

            {(selectedFilters.eventType ||
              selectedFilters.assignedTeam ||
              selectedFilters.assignedTechnician) && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs">
                Clear Filters
              </Button>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>

            <h2 className="text-lg font-semibold">{formatDate(currentDate)}</h2>

            <div className="flex items-center gap-1">
              <Button
                variant={view === 'day' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('day')}
              >
                Day
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Week
              </Button>
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Month
              </Button>
            </div>
          </div>

          {/* Event Type Legend */}
          <div className="flex flex-wrap gap-2">
            {['Preventive', 'Scheduled', 'Meeting', 'Deadline', 'Emergency'].map((type) => (
              <Badge
                key={type}
                variant="outline"
                className="text-xs"
                style={{
                  borderColor: getEventTypeColor(type as any),
                  color: getEventTypeColor(type as any),
                }}
              >
                <div
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: getEventTypeColor(type as any) }}
                />
                {type}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-hidden">
        {view === 'month' && (
          <Card className="h-full">
            <CardContent className="p-4 h-full">
              {/* Month Grid */}
              <div className="grid grid-cols-7 gap-1 h-full">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="p-2 text-center font-medium text-gray-600 border-b">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarGrid.map((date, index) => {
                  const dayEvents = getEventsForDate(date);
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                  const isToday = date.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={index}
                      className={cn(
                        'p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 min-h-[120px]',
                        !isCurrentMonth && 'bg-gray-50 text-gray-400',
                        isToday && 'bg-blue-50 border-blue-300'
                      )}
                      onClick={() => onDateClick?.(date)}
                    >
                      <div className={cn('text-sm font-medium mb-1', isToday && 'text-blue-600')}>
                        {date.getDate()}
                      </div>

                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => renderEvent(event, true))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Week/Day View */}
        {(view === 'week' || view === 'day') && (
          <Card className="h-full">
            <CardContent className="p-4 h-full">
              <div className="space-y-4">
                {events.map((event) => renderEvent(event, false))}

                {events.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-gray-400">
                    <div className="text-center">
                      <Calendar className="h-8 w-8 mx-auto mb-2" />
                      <p>No events scheduled</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
