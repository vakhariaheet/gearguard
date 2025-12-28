// =============================================================================
// KANBAN TYPES - Frontend Types for Kanban Board + Calendar Integration
// =============================================================================

// -----------------------------------------------------------------------------
// Core Kanban Types
// -----------------------------------------------------------------------------

export interface KanbanBoard {
  id: string;
  name: string;
  columns: KanbanColumn[];
  rules: WorkflowRules;
  filters: BoardFilters;
  lastUpdated: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  isActive: boolean;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
  color: string;
  order: number;
  requests: RequestCard[];
  limits?: {
    min?: number;
    max?: number;
    warnAt?: number;
  };
  automationRules?: AutomationRule[];
}

export interface RequestCard {
  id: string;
  subject: string;
  description?: string;
  equipmentName: string;
  equipmentCategory: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTechnician?: {
    id: string;
    name: string;
    avatar?: string;
  };
  assignedTeam?: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  isOverdue: boolean;
  healthScore?: number;
  lastActivity?: string;
  status: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
}

export interface WorkflowRules {
  allowedTransitions: Record<string, string[]>;
  autoTransitions: AutoTransition[];
  validationRules: ValidationRule[];
  notificationRules: NotificationRule[];
}

export interface AutoTransition {
  id: string;
  name: string;
  fromStatus: string;
  toStatus: string;
  condition: TransitionCondition;
  delay?: number; // minutes
  isActive: boolean;
}

export interface TransitionCondition {
  type: 'TimeElapsed' | 'TechnicianAction' | 'EquipmentStatus' | 'SLABreach' | 'Custom';
  value: any;
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains';
}

export interface ValidationRule {
  id: string;
  name: string;
  condition: string;
  message: string;
  isActive: boolean;
}

export interface NotificationRule {
  id: string;
  name: string;
  trigger: string;
  recipients: string[];
  template: string;
  isActive: boolean;
}

export interface BoardFilters {
  teams?: string[];
  priorities?: string[];
  equipmentCategories?: string[];
  assignedTechnicians?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  showOverdueOnly?: boolean;
  showMyRequestsOnly?: boolean;
}

export interface BoardStats {
  totalRequests: number;
  byStatus: {
    New: number;
    'In Progress': number;
    Repaired: number;
    Scrap: number;
  };
  byPriority: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
  };
  overdueCount: number;
  averageAge: number;
}

// -----------------------------------------------------------------------------
// Calendar Types
// -----------------------------------------------------------------------------

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  eventType: 'Preventive' | 'Scheduled' | 'Meeting' | 'Deadline' | 'Emergency';
  equipmentId?: string;
  equipmentName?: string;
  assignedTeam?: string;
  assignedTechnician?: string;
  location?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
  isAllDay: boolean;
  recurrence?: RecurrenceRule;
  attendees?: string[];
  relatedRequestId?: string;
  estimatedDuration?: number; // minutes
  actualDuration?: number; // minutes
  createdAt: string;
  updatedAt: string;
}

export interface RecurrenceRule {
  type: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  interval: number;
  endDate?: string;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number;
  weekOfMonth?: number;
  monthOfYear?: number;
}

// -----------------------------------------------------------------------------
// API Types
// -----------------------------------------------------------------------------

export interface GetKanbanBoardResponse {
  board: KanbanBoard;
  stats: BoardStats;
}

export interface UpdateRequestStatusRequest {
  newStatus: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
  previousStatus: string;
  reason?: string;
  newIndex?: number;
}

export interface UpdateRequestStatusResponse {
  success: boolean;
  request: RequestCard;
  message: string;
}

export interface GetCalendarEventsResponse {
  events: CalendarEvent[];
  totalCount: number;
  dateRange: {
    start: string;
    end: string;
  };
}

export interface CreateCalendarEventRequest {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  eventType: 'Preventive' | 'Scheduled' | 'Meeting' | 'Deadline' | 'Emergency';
  equipmentId?: string;
  assignedTeam?: string;
  assignedTechnician?: string;
  location?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  isAllDay?: boolean;
  recurrence?: RecurrenceRule;
  attendees?: string[];
  relatedRequestId?: string;
  estimatedDuration?: number;
}

export interface CreateCalendarEventResponse {
  event: CalendarEvent;
  message: string;
}

export interface UpdateCalendarEventRequest {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  eventType?: 'Preventive' | 'Scheduled' | 'Meeting' | 'Deadline' | 'Emergency';
  equipmentId?: string;
  assignedTeam?: string;
  assignedTechnician?: string;
  location?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  status?: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';
  isAllDay?: boolean;
  recurrence?: RecurrenceRule;
  attendees?: string[];
  estimatedDuration?: number;
  actualDuration?: number;
}

export interface UpdateCalendarEventResponse {
  event: CalendarEvent;
  message: string;
}

// -----------------------------------------------------------------------------
// Utility Types
// -----------------------------------------------------------------------------

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type RequestStatus = 'New' | 'In Progress' | 'Repaired' | 'Scrap';
export type EventType = 'Preventive' | 'Scheduled' | 'Meeting' | 'Deadline' | 'Emergency';
export type EventStatus = 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled';

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

export const getPriorityColor = (priority: PriorityLevel): string => {
  switch (priority) {
    case 'Critical':
      return 'bg-red-500 text-white';
    case 'High':
      return 'bg-orange-500 text-white';
    case 'Medium':
      return 'bg-yellow-500 text-black';
    case 'Low':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
};

export const getPriorityBadgeColor = (
  priority: PriorityLevel
): 'destructive' | 'secondary' | 'outline' | 'default' => {
  switch (priority) {
    case 'Critical':
      return 'destructive';
    case 'High':
      return 'destructive';
    case 'Medium':
      return 'secondary';
    case 'Low':
      return 'outline';
    default:
      return 'outline';
  }
};

export const getStatusColor = (status: RequestStatus): string => {
  switch (status) {
    case 'New':
      return '#3b82f6'; // blue
    case 'In Progress':
      return '#f59e0b'; // amber
    case 'Repaired':
      return '#10b981'; // emerald
    case 'Scrap':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

export const getEventTypeColor = (eventType: EventType): string => {
  switch (eventType) {
    case 'Preventive':
      return '#10b981'; // emerald
    case 'Scheduled':
      return '#3b82f6'; // blue
    case 'Meeting':
      return '#8b5cf6'; // violet
    case 'Deadline':
      return '#f59e0b'; // amber
    case 'Emergency':
      return '#ef4444'; // red
    default:
      return '#6b7280'; // gray
  }
};

export const formatDuration = (minutes?: number): string => {
  if (!minutes) return 'N/A';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const isOverdue = (dueDate?: string, status?: RequestStatus): boolean => {
  if (!dueDate || status === 'Repaired' || status === 'Scrap') return false;
  return new Date() > new Date(dueDate);
};

export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
};
