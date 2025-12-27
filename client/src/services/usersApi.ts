/**
 * Users API Service
 * Handles all admin user management operations
 */

import { apiClient } from './apiClient';
import type {
  User,
  UserListResponse,
  UserDetailsResponse,
  AdminStatsResponse,
  InviteUserRequest,
  InviteUserResponse,
  ChangeRoleRequest,
  ChangeRoleResponse,
  BanUserRequest,
  BanUserResponse,
  DeleteUserResponse,
  WhoAmIResponse,
  UserRole,
  Invitation,
  ListInvitationsResponse,
  RevokeInvitationResponse,
} from '../types/user';

// =============================================================================
// USER MANAGEMENT API
// =============================================================================

export const usersApi = {
  /**
   * List all users (admin only)
   */
  async listUsers(params?: {
    limit?: number;
    offset?: number;
    query?: string;
  }): Promise<UserListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    if (params?.query) searchParams.set('query', params.query);

    const queryString = searchParams.toString();
    const endpoint = `/api/admin/users${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<UserListResponse>(endpoint);
  },

  /**
   * Get user details by ID (admin only)
   */
  async getUserDetails(userId: string): Promise<UserDetailsResponse> {
    return apiClient.get<UserDetailsResponse>(`/api/admin/users/${userId}`);
  },

  /**
   * Invite a new user (admin only)
   */
  async inviteUser(data: InviteUserRequest): Promise<InviteUserResponse> {
    return apiClient.post<InviteUserResponse>('/api/admin/users/invite', data);
  },

  /**
   * Change user role (admin only)
   */
  async changeRole(userId: string, role: UserRole): Promise<ChangeRoleResponse> {
    return apiClient.put<ChangeRoleResponse>(`/api/admin/users/${userId}/role`, { role });
  },

  /**
   * Ban a user (admin only)
   */
  async banUser(userId: string, reason?: string): Promise<BanUserResponse> {
    return apiClient.post<BanUserResponse>(`/api/admin/users/${userId}/ban`, { reason });
  },

  /**
   * Unban a user (admin only)
   */
  async unbanUser(userId: string): Promise<BanUserResponse> {
    return apiClient.post<BanUserResponse>(`/api/admin/users/${userId}/unban`);
  },

  /**
   * Delete a user (admin only)
   */
  async deleteUser(userId: string): Promise<DeleteUserResponse> {
    return apiClient.delete<DeleteUserResponse>(`/api/admin/users/${userId}`);
  },

  /**
   * Get admin statistics (admin only)
   */
  async getAdminStats(): Promise<AdminStatsResponse> {
    return apiClient.get<AdminStatsResponse>('/api/admin/stats');
  },

  /**
   * List pending invitations (admin only)
   */
  async listInvitations(params?: {
    limit?: number;
    offset?: number;
    email?: string;
  }): Promise<ListInvitationsResponse> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    if (params?.email) searchParams.set('email', params.email);

    const queryString = searchParams.toString();
    const endpoint = `/api/admin/invitations${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<ListInvitationsResponse>(endpoint);
  },

  /**
   * Revoke a pending invitation (admin only)
   */
  async revokeInvitation(invitationId: string): Promise<RevokeInvitationResponse> {
    return apiClient.delete<RevokeInvitationResponse>(`/api/admin/invitations/${invitationId}`);
  },

  /**
   * Resend a pending invitation (admin only)
   */
  async resendInvitation(invitationId: string): Promise<{ message: string; invitationId: string }> {
    return apiClient.post<{ message: string; invitationId: string }>(
      `/api/admin/invitations/${invitationId}/resend`
    );
  },

  /**
   * Get system permissions and roles (admin only)
   */
  async getPermissions(): Promise<{
    success: boolean;
    data: {
      roles: string[];
      permissions: Record<string, Record<string, string[]>>;
      modules: string[];
      actions: string[];
    };
  }> {
    return apiClient.get('/api/admin/permissions');
  },
};

// =============================================================================
// DEMO/AUTH API
// =============================================================================

export const authApi = {
  /**
   * Get current user info
   */
  async whoAmI(): Promise<WhoAmIResponse> {
    return apiClient.get<WhoAmIResponse>('/api/demo/whoami');
  },

  /**
   * Test user-only endpoint
   */
  async testUserEndpoint(): Promise<{ success: boolean; message: string }> {
    return apiClient.get('/api/demo/user');
  },

  /**
   * Test admin-only endpoint
   */
  async testAdminEndpoint(): Promise<{ success: boolean; message: string }> {
    return apiClient.get('/api/demo/admin');
  },
};

// Re-export types
export type {
  User,
  UserRole,
  UserListResponse,
  UserDetailsResponse,
  AdminStatsResponse,
  InviteUserRequest,
  InviteUserResponse,
  ChangeRoleRequest,
  ChangeRoleResponse,
  BanUserRequest,
  BanUserResponse,
  DeleteUserResponse,
  WhoAmIResponse,
  Invitation,
  ListInvitationsResponse,
  RevokeInvitationResponse,
};
