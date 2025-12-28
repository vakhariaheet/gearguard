// =============================================================================
// KANBAN TYPES - Kanban Board + Calendar Integration Module (M08)
// =============================================================================

import { MaintenanceRequest } from '../requests/types';

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
// API Request/Response Types
// -----------------------------------------------------------------------------

/** GET /api/kanban/board */
export interface GetKanbanBoardQuery {
  teams?: string;
  priorities?: string;
  equipmentCategories?: string;
  assignedTechnicians?: string;
  dateRange?: string;
  showOverdueOnly?: boolean;
  showMyRequestsOnly?: boolean;
}

export interface GetKanbanBoardResponse {
  board: KanbanBoard;
}

/** PUT /api/kanban/requests/:id/status */
export interface UpdateRequestStatusRequest {
  newStatus: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
  previousStatus: string;
  reason?: string;
  newIndex?: number;
}

export interface UpdateRequestStatusResponse {
  success: boolean;
  request: RequestCard;
}

/** GET /api/calendar/events */
export interface GetCalendarEventsQuery {
  startDate: string;
  endDate: string;
  eventType?: string;
  assignedTeam?: string;
  assignedTechnician?: string;
}

export interface GetCalendarEventsResponse {
  events: CalendarEvent[];
}

/** POST /api/calendar/events */
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
}

/** PUT /api/calendar/events/:id */
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
}

// -----------------------------------------------------------------------------
// DynamoDB Schema Types
// -----------------------------------------------------------------------------

export interface KanbanBoardDynamoItem {
  PK: string; // KANBAN#BOARD
  SK: string; // CONFIG
  GSI1PK: string; // BOARD_TYPE#[type]
  GSI1SK: string; // KANBAN#BOARD

  id: string;
  name: string;
  columns: KanbanColumn[];
  rules: WorkflowRules;
  lastUpdated: string;
}

export interface CalendarEventDynamoItem {
  PK: string; // CALENDAR#EVENT#[id]
  SK: string; // DETAILS | RECURRENCE
  GSI1PK: string; // DATE#[date] | RECURRENCE_TYPE#[type]
  GSI1SK: string; // EVENT#[id]

  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  eventType: string;
  equipmentId?: string;
  equipmentName?: string;
  assignedTeam?: string;
  assignedTechnician?: string;
  location?: string;
  priority: string;
  status: string;
  isAllDay: boolean;
  recurrence?: RecurrenceRule;
  attendees?: string[];
  relatedRequestId?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Convert MaintenanceRequest to RequestCard
 */
export const mapRequestToCard = (request: MaintenanceRequest): RequestCard => {
  const now = new Date();
  const dueDate = request.scheduledDate ? new Date(request.scheduledDate) : null;
  const isOverdue = dueDate ? now > dueDate && request.status !== 'Repaired' : false;

  return {
    id: request.id,
    subject: request.subject,
    description: request.description,
    equipmentName: request.equipmentName,
    equipmentCategory: request.equipmentCategory,
    priority: request.priority,
    assignedTechnician: request.assignedTechnician
      ? {
          id: request.assignedTechnician,
          name: request.assignedTechnician, // Would be resolved from user service
        }
      : undefined,
    assignedTeam: request.assignedTeam,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    dueDate: request.scheduledDate,
    estimatedHours: request.hoursSpent,
    actualHours: request.hoursSpent,
    tags: [], // Would be extracted from request or equipment
    isOverdue,
    lastActivity: request.updatedAt,
    status: request.status,
  };
};

/**
 * Generate DynamoDB keys for Kanban operations
 */
export const generateKanbanKeys = () => ({
  board: {
    PK: 'KANBAN#BOARD',
    SK: 'CONFIG',
    GSI1PK: 'BOARD_TYPE#MAIN',
    GSI1SK: 'KANBAN#BOARD',
  },
});

/**
 * Generate DynamoDB keys for Calendar operations
 */
export const generateCalendarKeys = (eventId: string, date?: string) => ({
  details: {
    PK: `CALENDAR#EVENT#${eventId}`,
    SK: 'DETAILS',
    GSI1PK: date ? `DATE#${date}` : undefined,
    GSI1SK: `EVENT#${eventId}`,
  },
  recurrence: {
    PK: `CALENDAR#EVENT#${eventId}`,
    SK: 'RECURRENCE',
    GSI1PK: 'RECURRENCE_TYPE#RECURRING',
    GSI1SK: `EVENT#${eventId}`,
  },
});

/**
 * Validate status transition
 */
export const isValidStatusTransition = (fromStatus: string, toStatus: string): boolean => {
  const validTransitions: Record<string, string[]> = {
    New: ['In Progress', 'Scrap'],
    'In Progress': ['Repaired', 'Scrap', 'New'],
    Repaired: [], // Terminal state
    Scrap: [], // Terminal state
  };

  return validTransitions[fromStatus]?.includes(toStatus) || false;
};

/**
 * Get default board configuration
 */
export const getDefaultBoardConfig = (): { columns: KanbanColumn[]; rules: WorkflowRules } => ({
  columns: [
    {
      id: 'new',
      title: 'New',
      status: 'New',
      color: '#3b82f6',
      order: 1,
      requests: [],
      limits: { max: 20, warnAt: 15 },
    },
    {
      id: 'in-progress',
      title: 'In Progress',
      status: 'In Progress',
      color: '#f59e0b',
      order: 2,
      requests: [],
      limits: { max: 10, warnAt: 8 },
    },
    {
      id: 'repaired',
      title: 'Repaired',
      status: 'Repaired',
      color: '#10b981',
      order: 3,
      requests: [],
    },
    {
      id: 'scrap',
      title: 'Scrap',
      status: 'Scrap',
      color: '#ef4444',
      order: 4,
      requests: [],
    },
  ],
  rules: {
    allowedTransitions: {
      New: ['In Progress', 'Scrap'],
      'In Progress': ['Repaired', 'Scrap', 'New'],
      Repaired: [],
      Scrap: [],
    },
    autoTransitions: [],
    validationRules: [],
    notificationRules: [],
  },
});
