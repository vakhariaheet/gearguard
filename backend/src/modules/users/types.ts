// =============================================================================
// USER TYPES - Admin Management Module (Clerk-based)
// =============================================================================

import { Role } from '../../config/permissions';

// -----------------------------------------------------------------------------
// Clerk User (simplified view for admin)
// -----------------------------------------------------------------------------
export interface UserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string;
  role: Role;
  banned: boolean;
  createdAt: number;
  updatedAt: number;
  lastSignInAt: number | null;
}

// -----------------------------------------------------------------------------
// Role Type (Dynamic from permissions config)
// -----------------------------------------------------------------------------
export type UserRole = Role;

// -----------------------------------------------------------------------------
// Admin Request Types
// -----------------------------------------------------------------------------

/** POST /api/admin/users/invite */
export interface InviteUserRequest {
  email: string;
  role?: Role;
  redirectUrl?: string;
}

/** PUT /api/admin/users/{userId}/role */
export interface ChangeRoleRequest {
  role: Role;
}

/** POST /api/admin/users/{userId}/ban */
export interface BanUserRequest {
  // No body needed
}

// -----------------------------------------------------------------------------
// Query & Response Types
// -----------------------------------------------------------------------------

/** GET /api/admin/users query params */
export interface ListUsersQuery {
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'last_sign_in_at';
  query?: string; // Search query for email or name
}

/** GET /api/admin/users response */
export interface ListUsersResponse {
  users: UserResponse[];
  totalCount: number;
}

/** GET /api/admin/stats response */
export interface AdminStatsResponse {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  usersByRole: Record<Role, number>;
}

// -----------------------------------------------------------------------------
// Invitation Types
// -----------------------------------------------------------------------------

/** Invitation object from Clerk */
export interface InvitationResponse {
  id: string;
  emailAddress: string;
  status: 'pending' | 'accepted' | 'revoked';
  publicMetadata: {
    role?: Role;
  };
  createdAt: number;
  updatedAt: number;
}

/** GET /api/admin/invitations response */
export interface ListInvitationsResponse {
  invitations: InvitationResponse[];
  totalCount: number;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

/**
 * Get all available roles from the permissions configuration
 * This ensures the frontend always has the latest role definitions
 */
export { getAvailableRoles } from '../../config/permissions';
