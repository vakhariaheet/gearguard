// =============================================================================
// REQUEST TYPES - Frontend Types for Maintenance Request Management
// =============================================================================

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

export interface CreateRequestRequest {
  subject: string;
  description?: string;
  requestType: 'Corrective' | 'Preventive';
  equipmentId: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledDate?: string;
}

export interface UpdateRequestRequest {
  subject?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduledDate?: string;
  notes?: string;
}

export interface AssignRequestRequest {
  assignedTeam?: string;
  assignedTechnician?: string;
}

export interface UpdateStatusRequest {
  newStatus: 'New' | 'In Progress' | 'Repaired' | 'Scrap';
  notes?: string;
  hoursSpent?: number;
  completedBy?: string;
}

// -----------------------------------------------------------------------------
// Query & Response Types
// -----------------------------------------------------------------------------

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

export interface ListRequestsResponse {
  requests: MaintenanceRequest[];
  totalCount: number;
}

// =============================================================================
// ADVANCED WORKFLOW TYPES - Module M07 Frontend
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
// Smart Auto-Fill Types
// -----------------------------------------------------------------------------

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
// Equipment Types
// -----------------------------------------------------------------------------

export interface Equipment {
  id: string;
  equipmentName: string;
  serialNumber: string;
  category: 'Machine' | 'Vehicle' | 'Computer' | 'Tool' | 'Other';
  department: string;
  assignedEmployee?: string;
  assignedTeam: string;
  purchaseDate: string;
  warrantyExpiry?: string;
  location: string;
  status: 'Active' | 'Under Maintenance' | 'Scrapped';
  specifications?: Record<string, any>;
  usageHours?: number;
  lastMaintenanceDate?: string;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// API Response Wrapper
// -----------------------------------------------------------------------------

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// -----------------------------------------------------------------------------
// Helper Types
// -----------------------------------------------------------------------------

export type RequestStatus = 'New' | 'In Progress' | 'Repaired' | 'Scrap';
export type RequestType = 'Corrective' | 'Preventive';
export type RequestPriority = 'Low' | 'Medium' | 'High' | 'Critical';

// -----------------------------------------------------------------------------
// Form Types
// -----------------------------------------------------------------------------

export interface RequestFormData {
  subject: string;
  description: string;
  requestType: RequestType;
  equipmentId: string;
  priority: RequestPriority;
  scheduledDate: string;
}

export interface StatusUpdateFormData {
  newStatus: RequestStatus;
  notes: string;
  hoursSpent: number;
}

// -----------------------------------------------------------------------------
// Filter Types
// -----------------------------------------------------------------------------

export interface RequestFilters {
  status?: RequestStatus;
  requestType?: RequestType;
  priority?: RequestPriority;
  equipmentId?: string;
  assignedTechnician?: string;
  assignedTeam?: string;
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

export const getStatusColor = (status: RequestStatus): string => {
  switch (status) {
    case 'New':
      return 'bg-blue-500';
    case 'In Progress':
      return 'bg-yellow-500';
    case 'Repaired':
      return 'bg-green-500';
    case 'Scrap':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const getPriorityColor = (priority: RequestPriority): string => {
  switch (priority) {
    case 'Low':
      return 'bg-green-500';
    case 'Medium':
      return 'bg-yellow-500';
    case 'High':
      return 'bg-orange-500';
    case 'Critical':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

export const getStatusIcon = (status: RequestStatus): string => {
  switch (status) {
    case 'New':
      return '🆕';
    case 'In Progress':
      return '🔧';
    case 'Repaired':
      return '✅';
    case 'Scrap':
      return '❌';
    default:
      return '❓';
  }
};

export const getPriorityIcon = (priority: RequestPriority): string => {
  switch (priority) {
    case 'Low':
      return '🟢';
    case 'Medium':
      return '🟡';
    case 'High':
      return '🟠';
    case 'Critical':
      return '🔴';
    default:
      return '⚪';
  }
};

export const formatDuration = (hours?: number): string => {
  if (!hours) return 'N/A';
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
};

export const isValidStatusTransition = (
  currentStatus: RequestStatus,
  newStatus: RequestStatus
): boolean => {
  const validTransitions: Record<RequestStatus, RequestStatus[]> = {
    New: ['In Progress', 'Scrap'],
    'In Progress': ['Repaired', 'Scrap'],
    Repaired: [], // Terminal state
    Scrap: [], // Terminal state
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};
