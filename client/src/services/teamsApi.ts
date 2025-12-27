/**
 * Teams API Service
 * Handles all team-related API calls
 */

import { apiClient } from './apiClient';
import type {
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMemberRequest,
  ListTeamsQuery,
  ListTeamsResponse,
  TeamResponse,
  TeamMemberResponse,
  TeamAssignmentRequest,
  TeamAssignmentResponse,
  UserSearchResponse,
} from '../types/teams';

export class TeamsApi {
  /**
   * List all teams with pagination and filtering
   */
  async listTeams(query: ListTeamsQuery = {}): Promise<ListTeamsResponse> {
    const params = new URLSearchParams();

    if (query.limit) params.append('limit', query.limit.toString());
    if (query.offset) params.append('offset', query.offset.toString());
    if (query.specialization) params.append('specialization', query.specialization);
    if (query.isActive !== undefined) params.append('isActive', query.isActive.toString());
    if (query.orderBy) params.append('orderBy', query.orderBy);

    const queryString = params.toString();
    const url = queryString ? `/api/teams?${queryString}` : '/api/teams';

    return apiClient.get<ListTeamsResponse>(url);
  }

  /**
   * Get team by ID with members
   */
  async getTeam(teamId: string): Promise<TeamResponse> {
    return apiClient.get<TeamResponse>(`/api/teams/${teamId}`);
  }

  /**
   * Create a new team
   */
  async createTeam(request: CreateTeamRequest): Promise<TeamResponse> {
    return apiClient.post<TeamResponse>('/api/teams', request);
  }

  /**
   * Update team details
   */
  async updateTeam(teamId: string, request: UpdateTeamRequest): Promise<TeamResponse> {
    return apiClient.put<TeamResponse>(`/api/teams/${teamId}`, request);
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId: string): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/teams/${teamId}`);
  }

  /**
   * Add team member
   */
  async addTeamMember(teamId: string, request: AddTeamMemberRequest): Promise<TeamMemberResponse> {
    return apiClient.post<TeamMemberResponse>(`/api/teams/${teamId}/members`, request);
  }

  /**
   * Remove team member
   */
  async removeTeamMember(
    teamId: string,
    userId: string
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.delete(`/api/teams/${teamId}/members/${userId}`);
  }

  /**
   * Get smart team assignment suggestion
   */
  async suggestTeamAssignment(request: TeamAssignmentRequest): Promise<TeamAssignmentResponse> {
    return apiClient.post<TeamAssignmentResponse>('/api/teams/suggest-assignment', request);
  }

  /**
   * Search users for team member addition
   */
  async searchUsers(query: string, limit: number = 10): Promise<UserSearchResponse> {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('limit', limit.toString());

    return apiClient.get<UserSearchResponse>(`/api/teams/search-users?${params.toString()}`);
  }
}

// Export singleton instance
export const teamsApi = new TeamsApi();
