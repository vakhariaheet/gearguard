/**
 * User Types for Frontend
 * Matches the Clerk-based backend responses
 */

// Dynamic role type - will be populated from backend
export type UserRole = string;

// Static roles for backwards compatibility (can be removed later)
export const STATIC_ROLES = ['admin', 'user'] as const;
export type StaticUserRole = (typeof STATIC_ROLES)[number];

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  profileImageUrl: string;
  role: UserRole;
  createdAt: number;
  lastSignInAt: number | null;
  banned: boolean;
  emailVerified: boolean;
}

export interface UserListResponse {
  success: boolean;
  data: {
    users: User[];
    totalCount: number;
  };
}

export interface UserDetailsResponse {
  success: boolean;
  data: User;
}

export interface AdminStatsResponse {
  success: boolean;
  data: {
    totalUsers: number;
    activeUsers: number;
    bannedUsers: number;
    usersByRole: Record<UserRole, number>;
  };
}

export interface InviteUserRequest {
  email: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface InviteUserResponse {
  success: boolean;
  message: string;
  data: {
    invitationId: string;
    email: string;
  };
}

export interface ChangeRoleRequest {
  role: UserRole;
}

export interface ChangeRoleResponse {
  success: boolean;
  message: string;
  data: User;
}

export interface BanUserRequest {
  reason?: string;
}

export interface BanUserResponse {
  success: boolean;
  message: string;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}

export interface WhoAmIResponse {
  success: boolean;
  data: {
    userId: string;
    email: string;
    role: UserRole;
    message: string;
  };
}

export interface ApiError {
  success: false;
  error: string;
  details?: Record<string, unknown>;
}

// Invitation Types
export interface Invitation {
  id: string;
  emailAddress: string;
  status: 'pending' | 'accepted' | 'revoked';
  publicMetadata: {
    role?: UserRole;
  };
  createdAt: number;
  updatedAt: number;
}

export interface ListInvitationsResponse {
  success: boolean;
  data: {
    invitations: Invitation[];
    totalCount: number;
  };
}

export interface RevokeInvitationResponse {
  success: boolean;
  message: string;
}
