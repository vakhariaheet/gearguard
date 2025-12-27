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
// Equipment Types (Mock for Foundation Phase)
// -----------------------------------------------------------------------------

export interface Equipment {
  id: string;
  name: string;
  category: string;
  department: string;
  location?: string;
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
