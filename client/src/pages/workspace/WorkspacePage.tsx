/**
 * Workspace Page
 *
 * Main workspace combining Kanban board and calendar views for maintenance management
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Calendar,
  BarChart3,
  Bell,
  Settings,
  RefreshCw,
  Wrench,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { MaintenanceCalendar } from '@/components/calendar/MaintenanceCalendar';
import { useKanbanBoard } from '@/hooks/useKanban';
import { useUpcomingEvents } from '@/hooks/useCalendar';
import type { RequestCard, CalendarEvent } from '@/types/kanban';
import { toast } from 'sonner';

export const WorkspacePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'calendar' | 'dashboard'>('kanban');
  const [_selectedRequest, setSelectedRequest] = useState<RequestCard | null>(null);
  const [_selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Fetch board data for dashboard stats
  const { stats } = useKanbanBoard();

  // Fetch upcoming events
  const { data: upcomingEvents, isLoading: eventsLoading } = useUpcomingEvents();

  // Handle request click from Kanban board
  const handleRequestClick = (request: RequestCard) => {
    setSelectedRequest(request);
    toast.info(`Request details: ${request.subject}`);
    // In a real app, this would open a detailed modal or navigate to request details
  };

  // Handle event click from calendar
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    toast.info(`Event details: ${event.title}`);
    // In a real app, this would open a detailed modal or navigate to event details
  };

  // Handle calendar view switch from Kanban
  const handleCalendarView = () => {
    setActiveTab('calendar');
  };

  // Handle create new event
  const handleCreateEvent = () => {
    toast.info('Create new event - would open event creation modal');
    // In a real app, this would open the event creation modal
  };

  // Handle date click from calendar
  const handleDateClick = (date: Date) => {
    toast.info(`Selected date: ${date.toLocaleDateString()}`);
    // In a real app, this could create a new event for that date
  };

  // Dashboard stats component
  const DashboardStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalRequests || 0}</div>
          <p className="text-xs text-muted-foreground">Active maintenance requests</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats?.overdueCount || 0}</div>
          <p className="text-xs text-muted-foreground">Requests past due date</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          <Clock className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-amber-600">
            {stats?.byStatus['In Progress'] || 0}
          </div>
          <p className="text-xs text-muted-foreground">Currently being worked on</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <Wrench className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats?.byStatus.Repaired || 0}</div>
          <p className="text-xs text-muted-foreground">Successfully repaired</p>
        </CardContent>
      </Card>
    </div>
  );

  // Upcoming events component
  const UpcomingEventsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {eventsLoading ? (
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading events...</span>
          </div>
        ) : upcomingEvents && upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: event.eventType === 'Preventive' ? '#10b981' : '#3b82f6',
                    }}
                  />
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.startTime).toLocaleDateString()} at{' '}
                      {new Date(event.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {event.eventType}
                </Badge>
              </div>
            ))}
            {upcomingEvents.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setActiveTab('calendar')}
              >
                View all {upcomingEvents.length} events
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No upcoming events</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Priority breakdown component
  const PriorityBreakdown = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Priority Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {stats ? (
          <div className="space-y-3">
            {Object.entries(stats.byPriority).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      priority === 'Critical'
                        ? 'bg-red-500'
                        : priority === 'High'
                          ? 'bg-orange-500'
                          : priority === 'Medium'
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                    }`}
                  />
                  <span className="text-sm">{priority}</span>
                </div>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Workspace</h1>
          <p className="text-gray-600">Manage requests and schedule maintenance activities</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="kanban" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Kanban Board
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="dashboard" className="h-full">
            <div className="h-full overflow-auto">
              <DashboardStats />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <UpcomingEventsCard />
                <PriorityBreakdown />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kanban" className="h-full">
            <KanbanBoard onRequestClick={handleRequestClick} onCalendarView={handleCalendarView} />
          </TabsContent>

          <TabsContent value="calendar" className="h-full">
            <MaintenanceCalendar
              onEventClick={handleEventClick}
              onCreateEvent={handleCreateEvent}
              onDateClick={handleDateClick}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};
