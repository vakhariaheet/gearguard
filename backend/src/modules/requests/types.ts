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
