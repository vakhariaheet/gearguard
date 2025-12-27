import { apiClient } from './apiClient';
import type {
  Equipment,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  ListEquipmentQuery,
  ListEquipmentResponse,
  HealthAssessmentRequest,
  HealthAssessmentResponse,
  // M05 Enhancement types
  EquipmentHealth,
  PredictiveMaintenanceRequest,
  PredictiveMaintenanceResponse,
  SmartScheduleRequest,
  SmartScheduleResponse,
} from '../types/equipment';

export class EquipmentApi {
  /**
   * List equipment with filtering and pagination
   */
  async listEquipment(query?: ListEquipmentQuery): Promise<ListEquipmentResponse> {
    const params = new URLSearchParams();

    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.offset) params.append('offset', query.offset.toString());
    if (query?.department) params.append('department', query.department);
    if (query?.category) params.append('category', query.category);
    if (query?.status) params.append('status', query.status);
    if (query?.assignedTeam) params.append('assignedTeam', query.assignedTeam);
    if (query?.search) params.append('search', query.search);

    const queryString = params.toString();
    const endpoint = queryString ? `/api/equipment?${queryString}` : '/api/equipment';

    const response = await apiClient.get<{ data: ListEquipmentResponse }>(endpoint);
    return response.data;
  }

  /**
   * Get equipment by ID
   */
  async getEquipment(id: string): Promise<Equipment> {
    const response = await apiClient.get<{ data: Equipment }>(`/api/equipment/${id}`);
    return response.data;
  }

  /**
   * Create new equipment
   */
  async createEquipment(data: CreateEquipmentRequest): Promise<Equipment> {
    const response = await apiClient.post<{ data: Equipment }>('/api/equipment', data);
    return response.data;
  }

  /**
   * Update equipment
   */
  async updateEquipment(id: string, data: UpdateEquipmentRequest): Promise<Equipment> {
    const response = await apiClient.put<{ data: Equipment }>(`/api/equipment/${id}`, data);
    return response.data;
  }

  /**
   * Delete equipment
   */
  async deleteEquipment(id: string): Promise<void> {
    await apiClient.delete(`/api/equipment/${id}`);
  }

  /**
   * Assess equipment health using AI
   */
  async assessEquipmentHealth(
    id: string,
    data?: Partial<HealthAssessmentRequest>
  ): Promise<HealthAssessmentResponse> {
    const response = await apiClient.post<{ data: HealthAssessmentResponse }>(
      `/api/equipment/${id}/assess-health`,
      data
    );
    return response.data;
  }

  // =============================================================================
  // M05 ENHANCEMENT: PREDICTIVE MAINTENANCE METHODS
  // =============================================================================

  /**
   * Get current equipment health with enhanced metrics
   */
  async getEquipmentHealth(id: string): Promise<EquipmentHealth> {
    const response = await apiClient.get<{ data: EquipmentHealth }>(`/api/equipment/${id}/health`);
    return response.data;
  }

  /**
   * Perform predictive maintenance analysis using AI
   */
  async predictMaintenance(
    id: string,
    data: Partial<PredictiveMaintenanceRequest>
  ): Promise<PredictiveMaintenanceResponse> {
    const response = await apiClient.post<{ data: PredictiveMaintenanceResponse }>(
      `/api/equipment/${id}/predict-maintenance`,
      data
    );
    return response.data;
  }

  /**
   * Generate smart maintenance schedule
   */
  async getMaintenanceSchedule(
    id: string,
    params?: Partial<SmartScheduleRequest>
  ): Promise<SmartScheduleResponse> {
    const queryParams = new URLSearchParams();

    if (params?.maintenanceType) queryParams.append('maintenanceType', params.maintenanceType);
    if (params?.urgency) queryParams.append('urgency', params.urgency);
    if (params?.estimatedDuration)
      queryParams.append('estimatedDuration', params.estimatedDuration.toString());
    if (params?.requiredSkills)
      queryParams.append('requiredSkills', params.requiredSkills.join(','));
    if (params?.preferredTeam) queryParams.append('preferredTeam', params.preferredTeam);

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/api/equipment/${id}/schedule?${queryString}`
      : `/api/equipment/${id}/schedule`;

    const response = await apiClient.get<{ data: SmartScheduleResponse }>(endpoint);
    return response.data;
  }

  /**
   * Update equipment status with enhanced tracking
   */
  async updateEquipmentStatus(
    id: string,
    status: Equipment['status'],
    notes?: string
  ): Promise<Equipment> {
    const response = await apiClient.put<{ data: Equipment }>(`/api/equipment/${id}/status`, {
      status,
      notes,
    });
    return response.data;
  }
}

export const equipmentApi = new EquipmentApi();
