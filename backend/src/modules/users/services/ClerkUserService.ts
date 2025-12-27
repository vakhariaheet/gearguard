import { createClerkClient } from '@clerk/backend';
import {
  UserResponse,
  UserRole,
  ListUsersQuery,
  ListUsersResponse,
  AdminStatsResponse,
  InvitationResponse,
  getAvailableRoles,
} from '../types';
import { Role } from '../../../config/permissions';

// Initialize Clerk client
const clerkClient = createClerkClient({
  secretKey: process.env['CLERK_SECRET_KEY']!,
});

/**
 * Maps Clerk user to our simplified UserResponse
 */
function mapClerkUserToResponse(user: any): UserResponse {
  const primaryEmail = user.emailAddresses?.find((e: any) => e.id === user.primaryEmailAddressId);
  const availableRoles = getAvailableRoles();
  const defaultRole = availableRoles.includes('user') ? 'user' : availableRoles[0];
  const userRole = (user.publicMetadata?.['role'] as Role) || defaultRole;

  // Ensure userRole is never undefined by providing a fallback
  const finalRole = userRole || 'user';

  return {
    id: user.id,
    email: primaryEmail?.emailAddress || '',
    firstName: user.firstName,
    lastName: user.lastName,
    profileImageUrl: user.imageUrl || '',
    role: finalRole,
    banned: user.banned || false,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastSignInAt: user.lastSignInAt,
  };
}

export class ClerkUserService {
  /**
   * List all users with pagination and search
   */
  async listUsers(query: ListUsersQuery): Promise<ListUsersResponse> {
    const { limit = 20, offset = 0, orderBy = 'created_at', query: searchQuery } = query;

    // Build Clerk API parameters
    const clerkParams: any = {
      limit,
      offset,
      orderBy: `-${orderBy}`, // Descending order
    };

    // Add search query if provided - Clerk supports native search
    if (searchQuery && searchQuery.trim()) {
      // Clerk's query parameter searches across email, phone, username, and names
      clerkParams.query = searchQuery.trim();
    }

    const response = await clerkClient.users.getUserList(clerkParams);

    return {
      users: response.data.map(mapClerkUserToResponse),
      totalCount: response.totalCount,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<UserResponse> {
    const user = await clerkClient.users.getUser(userId);
    return mapClerkUserToResponse(user);
  }

  /**
   * Invite a new user via Clerk invitation
   */
  async inviteUser(
    email: string,
    role?: UserRole,
    redirectUrl?: string
  ): Promise<{ invitationId: string }> {
    // Set default role if not provided
    const availableRoles = getAvailableRoles();
    const defaultRole = availableRoles.includes('user') ? 'user' : availableRoles[0];
    const finalRole = role || defaultRole;

    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: redirectUrl || process.env['CLERK_REDIRECT_URL'],
      publicMetadata: {
        role: finalRole,
      },
    });

    return { invitationId: invitation.id };
  }

  /**
   * Change user's role via publicMetadata
   */
  async changeUserRole(
    userId: string,
    newRole: UserRole,
    adminUserId: string
  ): Promise<UserResponse> {
    // Validate role against available roles
    const availableRoles = getAvailableRoles();
    if (!availableRoles.includes(newRole)) {
      throw new Error(`Invalid role. Available roles: ${availableRoles.join(', ')}`);
    }

    // Prevent admin from changing their own role
    if (userId === adminUserId) {
      throw new Error('Cannot change your own role');
    }

    const user = await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role: newRole,
      },
    });

    return mapClerkUserToResponse(user);
  }

  /**
   * Ban a user
   */
  async banUser(userId: string, adminUserId: string): Promise<UserResponse> {
    // Prevent admin from banning themselves
    if (userId === adminUserId) {
      throw new Error('Cannot ban yourself');
    }

    const user = await clerkClient.users.banUser(userId);
    return mapClerkUserToResponse(user);
  }

  /**
   * Unban a user
   */
  async unbanUser(userId: string): Promise<UserResponse> {
    const user = await clerkClient.users.unbanUser(userId);
    return mapClerkUserToResponse(user);
  }

  /**
   * Delete a user permanently
   */
  async deleteUser(userId: string, adminUserId: string): Promise<void> {
    // Prevent admin from deleting themselves
    if (userId === adminUserId) {
      throw new Error('Cannot delete yourself');
    }

    await clerkClient.users.deleteUser(userId);
  }

  /**
   * Get admin statistics
   */
  async getAdminStats(): Promise<AdminStatsResponse> {
    // Get all users (Clerk returns max 500 per request)
    const response = await clerkClient.users.getUserList({
      limit: 500,
    });

    // Initialize stats with dynamic roles
    const availableRoles = getAvailableRoles();
    const usersByRole: Record<string, number> = {};
    availableRoles.forEach((role: string) => {
      usersByRole[role] = 0;
    });

    const stats: AdminStatsResponse = {
      totalUsers: response.totalCount,
      activeUsers: 0,
      bannedUsers: 0,
      usersByRole,
    };

    for (const user of response.data) {
      // Count banned users
      if (user.banned) {
        stats.bannedUsers++;
      } else {
        stats.activeUsers++;
      }

      // Count by role
      const role =
        (user.publicMetadata?.['role'] as Role) ||
        (availableRoles.includes('user') ? 'user' : availableRoles[0]);

      if (role && stats.usersByRole[role] !== undefined) {
        stats.usersByRole[role]++;
      } else if (role) {
        // Handle unknown roles by adding them to the stats
        stats.usersByRole[role] = 1;
      }
    }

    return stats;
  }

  /**
   * Revoke a pending invitation
   */
  async revokeInvitation(invitationId: string): Promise<void> {
    try {
      await clerkClient.invitations.revokeInvitation(invitationId);
    } catch (error: any) {
      // If the invitation is already revoked, treat it as success
      if (error?.errors?.[0]?.code === 'invitation_already_revoked') {
        return; // Silently succeed - the desired state is achieved
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * List pending invitations with pagination and search
   * Note: Clerk doesn't support server-side email search for invitations,
   * so we need to fetch more data when searching to ensure proper results
   */
  async listInvitations(query?: {
    limit?: number;
    offset?: number;
    email?: string;
  }): Promise<{ invitations: InvitationResponse[]; totalCount: number }> {
    const { limit = 20, offset = 0, email } = query || {};

    // If no search query, use normal pagination
    if (!email || !email.trim()) {
      const response = await clerkClient.invitations.getInvitationList({
        status: 'pending' as const,
        limit: Math.min(limit, 100), // Clerk max limit is 100
        offset,
      });

      const invitations = response.data.map(
        (invitation: any): InvitationResponse => ({
          id: invitation.id,
          emailAddress: invitation.emailAddress,
          status: invitation.status,
          publicMetadata: invitation.publicMetadata || {},
          createdAt: invitation.createdAt,
          updatedAt: invitation.updatedAt,
        })
      );

      return {
        invitations,
        totalCount: response.totalCount,
      };
    }

    // For search, we need to fetch more data to ensure we have enough results
    // This is a limitation of Clerk's API not supporting server-side email search
    const searchLimit = Math.min(500, Math.max(100, limit * 10)); // Fetch more to filter
    const response = await clerkClient.invitations.getInvitationList({
      status: 'pending' as const,
      limit: searchLimit,
      offset: 0, // Start from beginning when searching
    });

    // Filter by email
    const emailLower = email.trim().toLowerCase();
    const filteredInvitations = response.data.filter((invitation: any) =>
      invitation.emailAddress.toLowerCase().includes(emailLower)
    );

    // Apply pagination to filtered results
    const startIndex = offset;
    const endIndex = offset + limit;
    const paginatedInvitations = filteredInvitations.slice(startIndex, endIndex);

    const invitations = paginatedInvitations.map(
      (invitation: any): InvitationResponse => ({
        id: invitation.id,
        emailAddress: invitation.emailAddress,
        status: invitation.status,
        publicMetadata: invitation.publicMetadata || {},
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
      })
    );

    return {
      invitations,
      totalCount: filteredInvitations.length,
    };
  }

  /**
   * Resend a pending invitation
   */
  async resendInvitation(
    invitationId: string
  ): Promise<{ newInvitationId: string; emailAddress: string }> {
    // Get the existing invitation details
    const invitations = await clerkClient.invitations.getInvitationList({
      status: 'pending' as const,
    });

    const invitation = invitations.data.find((inv: any) => inv.id === invitationId);
    if (!invitation) {
      throw new Error('Invitation not found or already accepted');
    }

    // Revoke the old invitation
    await clerkClient.invitations.revokeInvitation(invitationId);

    // Create a new invitation with the same details
    const newInvitation = await clerkClient.invitations.createInvitation({
      emailAddress: invitation.emailAddress,
      redirectUrl: process.env['CLERK_REDIRECT_URL'],
      publicMetadata: invitation.publicMetadata || {},
    });

    return {
      newInvitationId: newInvitation.id,
      emailAddress: invitation.emailAddress,
    };
  }
}
