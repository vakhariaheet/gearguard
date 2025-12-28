/**
 * Requests API Service
 * Handles all API calls related to maintenance request management
 */

import { apiClient } from './apiClient';
import type {
  MaintenanceRequest,
  CreateRequestRequest,
  UpdateRequestRequest,
  AssignRequestRequest,
  UpdateStatusRequest,
  ListRequestsQuery,
  ListRequestsResponse,
  RequestAutoFillRequest,
  RequestAutoFillResponse,
  ApiResponse,
  Equipment,
} from '../types/requests';

// =============================================================================
// REQUEST API ENDPOINTS
// =============================================================================

export const requestsApi = {
  /**
   * List maintenance requests with filtering and pagination
   */
  async listRequests(params?: ListRequestsQuery): Promise<ApiResponse<ListRequestsResponse>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const queryString = searchParams.toString();
    const endpoint = queryString ? `/api/requests?${queryString}` : '/api/requests';

    return apiClient.get<ApiResponse<ListRequestsResponse>>(endpoint);
  },

  /**
   * Get a specific maintenance request by ID
   */
  async getRequest(requestId: string): Promise<ApiResponse<MaintenanceRequest>> {
    return apiClient.get<ApiResponse<MaintenanceRequest>>(`/api/requests/${requestId}`);
  },

  /**
   * Create a new maintenance request
   */
  async createRequest(data: CreateRequestRequest): Promise<ApiResponse<MaintenanceRequest>> {
    return apiClient.post<ApiResponse<MaintenanceRequest>>('/api/requests', data);
  },

  /**
   * Update an existing maintenance request
   */
  async updateRequest(
    requestId: string,
    data: UpdateRequestRequest
  ): Promise<ApiResponse<MaintenanceRequest>> {
    return apiClient.put<ApiResponse<MaintenanceRequest>>(`/api/requests/${requestId}`, data);
  },

  /**
   * Delete a maintenance request
   */
  async deleteRequest(requestId: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.delete<ApiResponse<{ message: string }>>(`/api/requests/${requestId}`);
  },

  /**
   * Assign a request to a team or technician
   */
  async assignRequest(
    requestId: string,
    data: AssignRequestRequest
  ): Promise<ApiResponse<MaintenanceRequest>> {
    return apiClient.post<ApiResponse<MaintenanceRequest>>(
      `/api/requests/${requestId}/assign`,
      data
    );
  },

  /**
   * Update request status
   */
  async updateStatus(
    requestId: string,
    data: UpdateStatusRequest
  ): Promise<ApiResponse<MaintenanceRequest>> {
    return apiClient.put<ApiResponse<MaintenanceRequest>>(
      `/api/requests/${requestId}/status`,
      data
    );
  },

  /**
   * Generate smart auto-fill suggestions for request creation
   */
  async getAutoFillSuggestions(
    data: RequestAutoFillRequest
  ): Promise<ApiResponse<RequestAutoFillResponse>> {
    return apiClient.post<ApiResponse<RequestAutoFillResponse>>('/api/requests/auto-fill', data);
  },
};

// =============================================================================
// EQUIPMENT API ENDPOINTS
// =============================================================================

export const equipmentApi = {
  /**
   * Get list of available equipment
   */
  async listEquipment(): Promise<ApiResponse<{ equipment: Equipment[] }>> {
    return apiClient.get<ApiResponse<{ equipment: Equipment[] }>>('/api/equipment');
  },

  /**
   * Get equipment by ID
   */
  async getEquipment(equipmentId: string): Promise<ApiResponse<Equipment>> {
    return apiClient.get<ApiResponse<Equipment>>(`/api/equipment/${equipmentId}`);
  },
};

// =============================================================================
// MOCK TEAM API (Foundation Phase)
// =============================================================================

export interface Team {
  id: string;
  name: string;
  specialization: string;
  members: string[];
}

export const teamsApi = {
  /**
   * Get list of available teams (mock data for foundation phase)
   */
  async listTeams(): Promise<ApiResponse<{ teams: Team[] }>> {
    const mockTeams: Team[] = [
      {
        id: 'team-1',
        name: 'Mechanics Team',
        specialization: 'Machine',
        members: ['tech-001', 'tech-002', 'tech-003'],
      },
      {
        id: 'team-2',
        name: 'IT Support Team',
        specialization: 'Computer',
        members: ['tech-004', 'tech-005'],
      },
      {
        id: 'team-3',
        name: 'Electricians Team',
        specialization: 'Electrical',
        members: ['tech-006', 'tech-007'],
      },
      {
        id: 'team-4',
        name: 'HVAC Team',
        specialization: 'HVAC',
        members: ['tech-008', 'tech-009'],
      },
      {
        id: 'team-5',
        name: 'General Maintenance',
        specialization: 'General',
        members: ['tech-010', 'tech-011', 'tech-012'],
      },
    ];

    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      data: { teams: mockTeams },
      success: true,
    };
  },
};

// =============================================================================
// MOCK TECHNICIAN API (Foundation Phase)
// =============================================================================

export interface Technician {
  id: string;
  name: string;
  email: string;
  specialization: string;
  teamId: string;
  available: boolean;
}

export const techniciansApi = {
  /**
   * Get list of available technicians (mock data for foundation phase)
   */
  async listTechnicians(): Promise<ApiResponse<{ technicians: Technician[] }>> {
    const mockTechnicians: Technician[] = [
      {
        id: 'tech-001',
        name: 'John Smith',
        email: 'john.smith@company.com',
        specialization: 'Machine',
        teamId: 'team-1',
        available: true,
      },
      {
        id: 'tech-002',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        specialization: 'Machine',
        teamId: 'team-1',
        available: true,
      },
      {
        id: 'tech-003',
        name: 'Mike Wilson',
        email: 'mike.wilson@company.com',
        specialization: 'Machine',
        teamId: 'team-1',
        available: false,
      },
      {
        id: 'tech-004',
        name: 'Lisa Chen',
        email: 'lisa.chen@company.com',
        specialization: 'Computer',
        teamId: 'team-2',
        available: true,
      },
      {
        id: 'tech-005',
        name: 'David Brown',
        email: 'david.brown@company.com',
        specialization: 'Computer',
        teamId: 'team-2',
        available: true,
      },
      {
        id: 'tech-006',
        name: 'Robert Davis',
        email: 'robert.davis@company.com',
        specialization: 'Electrical',
        teamId: 'team-3',
        available: true,
      },
      {
        id: 'tech-007',
        name: 'Jennifer Miller',
        email: 'jennifer.miller@company.com',
        specialization: 'Electrical',
        teamId: 'team-3',
        available: true,
      },
      {
        id: 'tech-008',
        name: 'Kevin Garcia',
        email: 'kevin.garcia@company.com',
        specialization: 'HVAC',
        teamId: 'team-4',
        available: true,
      },
      {
        id: 'tech-009',
        name: 'Amanda Rodriguez',
        email: 'amanda.rodriguez@company.com',
        specialization: 'HVAC',
        teamId: 'team-4',
        available: false,
      },
      {
        id: 'tech-010',
        name: 'Chris Martinez',
        email: 'chris.martinez@company.com',
        specialization: 'General',
        teamId: 'team-5',
        available: true,
      },
      {
        id: 'tech-011',
        name: 'Emily Anderson',
        email: 'emily.anderson@company.com',
        specialization: 'General',
        teamId: 'team-5',
        available: true,
      },
      {
        id: 'tech-012',
        name: 'Daniel Taylor',
        email: 'daniel.taylor@company.com',
        specialization: 'General',
        teamId: 'team-5',
        available: true,
      },
    ];

    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      data: { technicians: mockTechnicians },
      success: true,
    };
  },
};
