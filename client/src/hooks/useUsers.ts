/**
 * React Query Hooks for Users API
 * Provides caching, refetching, and mutation support
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi, authApi } from '../services/usersApi';
import type { UserRole, UserListResponse, InviteUserRequest, Invitation } from '../types/user';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: { limit?: number; offset?: number; query?: string }) =>
    [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  stats: () => [...userKeys.all, 'stats'] as const,
  invitations: () => [...userKeys.all, 'invitations'] as const,
  permissions: () => [...userKeys.all, 'permissions'] as const,
};

export const authKeys = {
  whoami: ['auth', 'whoami'] as const,
};

// =============================================================================
// USER QUERIES
// =============================================================================

/**
 * Hook to fetch list of users
 */
export function useUsers(params?: {
  limit?: number;
  offset?: number;
  query?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params || {};

  return useQuery({
    queryKey: userKeys.list(queryParams),
    queryFn: () => usersApi.listUsers(queryParams),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch user details
 */
export function useUserDetails(userId: string, enabled = true) {
  return useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => usersApi.getUserDetails(userId),
    enabled: enabled && !!userId,
  });
}

/**
 * Hook to fetch admin statistics
 */
export function useAdminStats(enabled = true) {
  return useQuery({
    queryKey: userKeys.stats(),
    queryFn: () => usersApi.getAdminStats(),
    enabled,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to get current user info
 */
export function useWhoAmI(enabled = true) {
  return useQuery({
    queryKey: authKeys.whoami,
    queryFn: () => authApi.whoAmI(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch pending invitations
 */
export function useInvitations(params?: {
  limit?: number;
  offset?: number;
  email?: string;
  enabled?: boolean;
}) {
  const { enabled = true, ...queryParams } = params || {};

  return useQuery({
    queryKey: [...userKeys.invitations(), queryParams],
    queryFn: () => usersApi.listInvitations(queryParams),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch system permissions and roles (admin only)
 */
export function usePermissions(enabled = true) {
  return useQuery({
    queryKey: userKeys.permissions(),
    queryFn: () => usersApi.getPermissions(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - permissions don't change often
  });
}

// =============================================================================
// USER MUTATIONS
// =============================================================================

/**
 * Hook to invite a new user with optimistic updates
 */
export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteUserRequest) => usersApi.inviteUser(data),
    onSuccess: (response, { email, role }) => {
      // Optimistically add new invitation to cache
      const newInvitation: Invitation = {
        id: response.data.invitationId,
        emailAddress: email,
        status: 'pending',
        publicMetadata: { role: role || 'user' },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      queryClient.setQueriesData({ queryKey: userKeys.invitations() }, (oldData: any) => {
        if (!oldData?.data) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            invitations: [newInvitation, ...oldData.data.invitations],
            totalCount: oldData.data.totalCount + 1,
          },
        };
      });

      // Invalidate stats for accurate counts
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });

      // Also invalidate invitations to ensure data consistency
      queryClient.invalidateQueries({ queryKey: userKeys.invitations() });
    },
  });
}

/**
 * Hook to revoke an invitation with optimistic updates
 */
export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => usersApi.revokeInvitation(invitationId),
    onMutate: async (invitationId) => {
      await queryClient.cancelQueries({ queryKey: userKeys.invitations() });

      const previousInvitations = queryClient.getQueriesData({ queryKey: userKeys.invitations() });

      // Optimistically remove invitation
      queryClient.setQueriesData({ queryKey: userKeys.invitations() }, (oldData: any) => {
        if (!oldData?.data?.invitations) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            invitations: oldData.data.invitations.filter(
              (inv: Invitation) => inv.id !== invitationId
            ),
            totalCount: Math.max(0, oldData.data.totalCount - 1),
          },
        };
      });

      return { previousInvitations };
    },
    onSuccess: () => {
      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: userKeys.invitations() });
    },
    onError: (_err, _invitationId, context) => {
      if (context?.previousInvitations) {
        context.previousInvitations.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
  });
}

/**
 * Hook to resend an invitation - refetches data since invitation ID changes
 */
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId: string) => usersApi.resendInvitation(invitationId),
    onSuccess: () => {
      // Invalidate and refetch invitations since resending creates a new invitation with different ID
      queryClient.invalidateQueries({ queryKey: userKeys.invitations() });
    },
  });
}

/**
 * Hook to change user role with optimistic updates
 */
export function useChangeRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      usersApi.changeRole(userId, role),
    onMutate: async ({ userId, role }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) });

      // Snapshot the previous values
      const previousUserLists = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      const previousUserDetail = queryClient.getQueryData(userKeys.detail(userId));

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: userKeys.lists() },
        (oldData: UserListResponse | undefined) => {
          if (!oldData?.data?.users) return oldData;

          return {
            ...oldData,
            data: {
              ...oldData.data,
              users: oldData.data.users.map((user) =>
                user.id === userId ? { ...user, role } : user
              ),
            },
          };
        }
      );

      queryClient.setQueryData(userKeys.detail(userId), (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: { ...oldData.data, role },
        };
      });

      return { previousUserLists, previousUserDetail };
    },
    onSuccess: () => {
      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
    onError: (_err, { userId }, context) => {
      // Rollback on error
      if (context?.previousUserLists) {
        context.previousUserLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousUserDetail) {
        queryClient.setQueryData(userKeys.detail(userId), context.previousUserDetail);
      }
    },
    onSettled: () => {
      // Ensure queries are invalidated regardless of success/error
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
}

/**
 * Hook to ban a user with optimistic updates
 */
export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason?: string }) =>
      usersApi.banUser(userId, reason),
    onMutate: async ({ userId }) => {
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) });

      const previousUserLists = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      const previousUserDetail = queryClient.getQueryData(userKeys.detail(userId));

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: userKeys.lists() },
        (oldData: UserListResponse | undefined) => {
          if (!oldData?.data?.users) return oldData;

          return {
            ...oldData,
            data: {
              ...oldData.data,
              users: oldData.data.users.map((user) =>
                user.id === userId ? { ...user, banned: true } : user
              ),
            },
          };
        }
      );

      queryClient.setQueryData(userKeys.detail(userId), (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: { ...oldData.data, banned: true },
        };
      });

      return { previousUserLists, previousUserDetail };
    },
    onError: (_err, { userId }, context) => {
      if (context?.previousUserLists) {
        context.previousUserLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousUserDetail) {
        queryClient.setQueryData(userKeys.detail(userId), context.previousUserDetail);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}

/**
 * Hook to unban a user with optimistic updates
 */
export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersApi.unbanUser(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });
      await queryClient.cancelQueries({ queryKey: userKeys.detail(userId) });

      const previousUserLists = queryClient.getQueriesData({ queryKey: userKeys.lists() });
      const previousUserDetail = queryClient.getQueryData(userKeys.detail(userId));

      // Optimistically update
      queryClient.setQueriesData(
        { queryKey: userKeys.lists() },
        (oldData: UserListResponse | undefined) => {
          if (!oldData?.data?.users) return oldData;

          return {
            ...oldData,
            data: {
              ...oldData.data,
              users: oldData.data.users.map((user) =>
                user.id === userId ? { ...user, banned: false } : user
              ),
            },
          };
        }
      );

      queryClient.setQueryData(userKeys.detail(userId), (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: { ...oldData.data, banned: false },
        };
      });

      return { previousUserLists, previousUserDetail };
    },
    onError: (_err, userId, context) => {
      if (context?.previousUserLists) {
        context.previousUserLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousUserDetail) {
        queryClient.setQueryData(userKeys.detail(userId), context.previousUserDetail);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}

/**
 * Hook to delete a user with optimistic updates
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersApi.deleteUser(userId),
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });

      const previousUserLists = queryClient.getQueriesData({ queryKey: userKeys.lists() });

      // Optimistically remove user from all lists
      queryClient.setQueriesData(
        { queryKey: userKeys.lists() },
        (oldData: UserListResponse | undefined) => {
          if (!oldData?.data?.users) return oldData;

          return {
            ...oldData,
            data: {
              ...oldData.data,
              users: oldData.data.users.filter((user) => user.id !== userId),
              totalCount: Math.max(0, oldData.data.totalCount - 1),
            },
          };
        }
      );

      return { previousUserLists };
    },
    onError: (_err, _userId, context) => {
      if (context?.previousUserLists) {
        context.previousUserLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_, __, userId) => {
      // Remove user detail from cache on success
      queryClient.removeQueries({ queryKey: userKeys.detail(userId) });
      queryClient.invalidateQueries({ queryKey: userKeys.stats() });
    },
  });
}
