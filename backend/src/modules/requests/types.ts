// =============================================================================
// REQUEST TYPES - Maintenance Request Management Module
// =============================================================================

// Remove unused import
// import { Role } from '../../config/permissions';

// -----------------------------------------------------------------------------
// Core Request Entity
// -----------------------------------------------------------------------------
export interface MaintenanceRequest {
  id: string;
  subject: string;
  description?: string;
  requestType: 'Corrective' | 'Preventive';
  equipmentId: string;
  equipmentName: string;
  equipmentCategory: string;
  assignedTeam?: string;
  assignedTechnician?: string;
  status: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  hoursSpent?: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Request API Types
// -----------------------------------------------------------------------------

/** POST /api/requests */
export interface CreateRequestRequest {
  subject: string;
  description?: string;
  requestType: 'Corrective' | 'Preventive';
  equipmentId: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledDate?: string;
}

/** PUT /api/requests/:id */
export interface UpdateRequestRequest {
  subject?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledDate?: string;
  notes?: string;
}

/** POST /api/requests/:id/assign */
export interface AssignRequestRequest {
  assignedTeam?: string;
  assignedTechnician?: string;
}

/** PUT /api/requests/:id/status */
export interface UpdateStatusRequest {
  newStatus: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
  notes?: string;
  hoursSpent?: number;
  completedBy?: string;
}

// =============================================================================
// ADVANCED WORKFLOW TYPES - Module M07
// =============================================================================

// -----------------------------------------------------------------------------
// Workflow Management
// -----------------------------------------------------------------------------
export interface RequestWorkflow {
  requestId: string;
  currentStep: 'Created' | 'Assigned' | 'InProgress' | 'Review' | 'Completed' | 'Escalated';
  workflowHistory: WorkflowStep[];
  slaTracking: SLATracking;
  escalationRules: EscalationRule[];
  assignmentHistory: AssignmentHistory[];
  estimatedCompletion: string;
  actualCompletion?: string;
}

export interface WorkflowStep {
  step: string;
  status: 'Pending' | 'Active' | 'Completed' | 'Skipped';
  startTime?: string;
  endTime?: string;
  duration?: number; // minutes
  assignedTo?: string;
  notes?: string;
  automatedAction: boolean;
}

export interface SLATracking {
  responseTime: {
    target: number; // minutes
    actual?: number;
    deadline: string;
    isBreached: boolean;
    remainingTime: number;
  };
  resolutionTime: {
    target: number; // minutes
    actual?: number;
    deadline: string;
    isBreached: boolean;
    remainingTime: number;
  };
  escalationTriggers: Array<{
    level: number;
    triggerTime: number;
    triggered: boolean;
    triggeredAt?: string;
  }>;
}

export interface EscalationRule {
  level: number;
  triggerCondition: 'TimeElapsed' | 'SLABreach' | 'NoResponse' | 'HighPriority';
  triggerValue: number; // minutes or threshold
  escalateTo: string; // user ID or role
  notificationMethod: 'Email' | 'SMS' | 'Push' | 'All';
  isActive: boolean;
  lastTriggered?: string;
}

export interface AssignmentHistory {
  assignedTo: string;
  assignedBy: string;
  assignedAt: string;
  reason: string;
  isAutoAssigned: boolean;
}

// -----------------------------------------------------------------------------
// Auto-Assignment Types
// -----------------------------------------------------------------------------
export interface AutoAssignmentRequest {
  requestId: string;
  equipmentId: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  requiredSkills?: string[];
  preferredTeam?: string;
  locationConstraints?: {
    maxDistance?: number; // km
    sameBuilding?: boolean;
  };
  workloadConsideration: boolean;
  skillWeighting: number; // 0-1
  locationWeighting: number; // 0-1
  availabilityWeighting: number; // 0-1
}

export interface AutoAssignmentResponse {
  assignedTechnician: {
    userId: string;
    name: string;
    email: string;
    team: string;
    skills: string[];
    currentWorkload: number;
    location?: string;
    estimatedArrival?: number; // minutes
  };
  alternativeTechnicians: Array<{
    userId: string;
    name: string;
    score: number;
    reason: string;
  }>;
  assignmentScore: number; // 0-100
  assignmentReasoning: string[];
  estimatedResponseTime: number; // minutes
  confidence: number; // 0-1
  autoAssigned: boolean;
}

// -----------------------------------------------------------------------------
// Analytics Types
// -----------------------------------------------------------------------------
export interface RequestAnalytics {
  timeRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalRequests: number;
    averageResponseTime: number;
    averageResolutionTime: number;
    slaComplianceRate: number;
    escalationRate: number;
    autoAssignmentRate: number;
  };
  trends: {
    requestVolume: Array<{ date: string; count: number }>;
    responseTimesTrend: Array<{ date: string; avgTime: number }>;
    slaBreaches: Array<{ date: string; breaches: number }>;
  };
  teamPerformance: Array<{
    teamId: string;
    teamName: string;
    requestsHandled: number;
    avgResponseTime: number;
    slaCompliance: number;
  }>;
  equipmentInsights: Array<{
    equipmentId: string;
    equipmentName: string;
    requestCount: number;
    avgResolutionTime: number;
    criticalIssues: number;
  }>;
}

// -----------------------------------------------------------------------------
// DynamoDB Schema Extensions
// -----------------------------------------------------------------------------
export interface WorkflowDynamoItem {
  PK: string; // REQUEST#[id]
  SK: string; // WORKFLOW#[step]
  GSI1PK: string; // WORKFLOW_STATUS#[status]
  GSI1SK: string; // REQUEST#[id]
  requestId: string;
  currentStep: string;
  workflowData: RequestWorkflow;
  createdAt: string;
  updatedAt: string;
}

export interface SLADynamoItem {
  PK: string; // REQUEST#[id]
  SK: string; // SLA#[type]
  GSI1PK: string; // SLA_STATUS#[status]
  GSI1SK: string; // DUE_DATE#[date]
  requestId: string;
  slaType: 'response' | 'resolution';
  slaData: SLATracking;
  createdAt: string;
  updatedAt: string;
}

export interface EscalationDynamoItem {
  PK: string; // REQUEST#[id]
  SK: string; // ESCALATION#[level]
  GSI1PK: string; // ESCALATION_DATE#[date]
  GSI1SK: string; // REQUEST#[id]
  requestId: string;
  escalationLevel: number;
  escalationData: EscalationRule;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Query & Response Types
// -----------------------------------------------------------------------------

/** GET /api/requests query params */
export interface ListRequestsQuery {
  limit?: number;
  offset?: number;
  status?: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
  requestType?: 'Corrective' | 'Preventive';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  equipmentId?: string;
  assignedTechnician?: string;
  assignedTeam?: string;
  orderBy?: 'createdAt' | 'updatedAt' | 'priority' | 'scheduledDate';
  orderDirection?: 'asc' | 'desc';
}

/** GET /api/requests response */
export interface ListRequestsResponse {
  requests: MaintenanceRequest[];
  totalCount: number;
}

// -----------------------------------------------------------------------------
// Smart Auto-Fill Types
// -----------------------------------------------------------------------------

/** POST /api/requests/auto-fill */
export interface RequestAutoFillRequest {
  equipmentId: string;
  requestType?: 'Corrective' | 'Preventive';
  userDescription?: string;
}

export interface RequestAutoFillResponse {
  suggestedSubject: string;
  suggestedDescription: string;
  suggestedPriority: 'Low' | 'Medium' | 'High' | 'Critical';
  suggestedTeam?: string;
  suggestedScheduleDate?: string;
  commonIssues: string[];
  maintenanceHistory: {
    lastMaintenance?: string;
    averageRepairTime: number;
    commonProblems: string[];
    recommendedActions: string[];
  };
  confidence: number;
}

// -----------------------------------------------------------------------------
// Status Workflow Types
// -----------------------------------------------------------------------------

export interface RequestStatusUpdate {
  requestId: string;
  newStatus: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
  notes?: string;
  hoursSpent?: number;
  completedBy?: string;
}

// -----------------------------------------------------------------------------
// DynamoDB Schema Types
// -----------------------------------------------------------------------------

export interface RequestDynamoItem {
  PK: string; // REQUEST#[id]
  SK: string; // DETAILS | EQUIPMENT#[equipmentId] | ASSIGNEE#[userId]
  GSI1PK?: string; // STATUS#[status] | EQUIPMENT#[equipmentId] | USER#[userId]
  GSI1SK?: string; // REQUEST#[id]

  // Request fields
  id: string;
  subject: string;
  description?: string;
  requestType: 'Corrective' | 'Preventive';
  equipmentId: string;
  equipmentName: string;
  equipmentCategory: string;
  assignedTeam?: string;
  assignedTechnician?: string;
  status: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledDate?: string;
  startedAt?: string;
  completedAt?: string;
  hoursSpent?: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Generate DynamoDB keys for request operations
 */
export const generateRequestKeys = (requestId: string) => ({
  details: {
    PK: `REQUEST#${requestId}`,
    SK: 'DETAILS',
  },
  equipment: (equipmentId: string) => ({
    PK: `REQUEST#${requestId}`,
    SK: `EQUIPMENT#${equipmentId}`,
    GSI1PK: `EQUIPMENT#${equipmentId}`,
    GSI1SK: `REQUEST#${requestId}`,
  }),
  assignee: (userId: string) => ({
    PK: `REQUEST#${requestId}`,
    SK: `ASSIGNEE#${userId}`,
    GSI1PK: `USER#${userId}`,
    GSI1SK: `REQUEST#${requestId}`,
  }),
  status: (status: string) => ({
    GSI1PK: `STATUS#${status}`,
    GSI1SK: `REQUEST#${requestId}`,
  }),
});

/**
 * Convert DynamoDB item to MaintenanceRequest
 */
export const mapDynamoToRequest = (item: RequestDynamoItem): MaintenanceRequest => ({
  id: item.id,
  subject: item.subject,
  description: item.description,
  requestType: item.requestType,
  equipmentId: item.equipmentId,
  equipmentName: item.equipmentName,
  equipmentCategory: item.equipmentCategory,
  assignedTeam: item.assignedTeam,
  assignedTechnician: item.assignedTechnician,
  status: item.status,
  priority: item.priority,
  scheduledDate: item.scheduledDate,
  startedAt: item.startedAt,
  completedAt: item.completedAt,
  hoursSpent: item.hoursSpent,
  notes: item.notes,
  createdBy: item.createdBy,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

/**
 * Convert MaintenanceRequest to DynamoDB item
 */
export const mapRequestToDynamo = (request: MaintenanceRequest): RequestDynamoItem => ({
  PK: `REQUEST#${request.id}`,
  SK: 'DETAILS',
  GSI1PK: `STATUS#${request.status}`,
  GSI1SK: `REQUEST#${request.id}`,
  ...request,
});

/**
 * Validate status transition
 */
export const isValidStatusTransition = (currentStatus: string, newStatus: string): boolean => {
  const validTransitions: Record<string, string[]> = {
    New: ['In Progress', 'Scrap'],
    'In Progress': ['Repaired', 'Scrap'],
    Repaired: [], // Terminal state
    Scrap: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Get priority weight for sorting
 */
export const getPriorityWeight = (priority: string): number => {
  const weights = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
  };
  return weights[priority as keyof typeof weights] || 0;
};
