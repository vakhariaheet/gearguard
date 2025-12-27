import { apiClient } from './apiClient';
import type {
  Equipment,
  CreateEquipmentRequest,
  UpdateEquipmentRequest,
  ListEquipmentQuery,
  ListEquipmentResponse,
  HealthAssessmentRequest,
  HealthAssessmentResponse,
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
}

export const equipmentApi = new EquipmentApi();
