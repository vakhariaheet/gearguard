/**
 * Teams React Query Hooks
 * Provides data fetching and mutation hooks for team operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { teamsApi } from '../services/teamsApi';
import type {
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMemberRequest,
  ListTeamsQuery,
  TeamAssignmentRequest,
} from '../types/teams';

// Query Keys
export const TEAMS_QUERY_KEYS = {
  all: ['teams'] as const,
  lists: () => [...TEAMS_QUERY_KEYS.all, 'list'] as const,
  list: (query: ListTeamsQuery) => [...TEAMS_QUERY_KEYS.lists(), query] as const,
  details: () => [...TEAMS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TEAMS_QUERY_KEYS.details(), id] as const,
};

/**
 * Hook to list teams with pagination and filtering
 */
export const useTeams = (query: ListTeamsQuery = {}) => {
  return useQuery({
    queryKey: TEAMS_QUERY_KEYS.list(query),
    queryFn: () => teamsApi.listTeams(query),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to get a single team by ID
 */
export const useTeam = (teamId: string) => {
  return useQuery({
    queryKey: TEAMS_QUERY_KEYS.detail(teamId),
    queryFn: () => teamsApi.getTeam(teamId),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to create a new team
 */
export const useCreateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateTeamRequest) => teamsApi.createTeam(request),
    onSuccess: (data) => {
      // Invalidate teams list queries
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.lists() });
      toast.success(`Team "${data.data.teamName}" created successfully`);
    },
    onError: (error: any) => {
      const message = error?.error?.message || 'Failed to create team';
      toast.error(message);
    },
  });
};

/**
 * Hook to update a team
 */
export const useUpdateTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, request }: { teamId: string; request: UpdateTeamRequest }) =>
      teamsApi.updateTeam(teamId, request),
    onSuccess: (_, variables) => {
      // Invalidate and update queries
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.detail(variables.teamId) });
      toast.success('Team updated successfully');
    },
    onError: (error: any) => {
      const message = error?.error?.message || 'Failed to update team';
      toast.error(message);
    },
  });
};

/**
 * Hook to delete a team
 */
export const useDeleteTeam = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => teamsApi.deleteTeam(teamId),
    onSuccess: (data, teamId) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.lists() });
      queryClient.removeQueries({ queryKey: TEAMS_QUERY_KEYS.detail(teamId) });
      toast.success(data.message || 'Team deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.error?.message || 'Failed to delete team';
      toast.error(message);
    },
  });
};

/**
 * Hook to add a team member
 */
export const useAddTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, request }: { teamId: string; request: AddTeamMemberRequest }) =>
      teamsApi.addTeamMember(teamId, request),
    onSuccess: (_, variables) => {
      // Invalidate team details to refresh members list
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.detail(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.lists() });
      toast.success(`Team member added successfully`);
    },
    onError: (error: any) => {
      const message = error?.error?.message || 'Failed to add team member';
      toast.error(message);
    },
  });
};

/**
 * Hook to remove a team member
 */
export const useRemoveTeamMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: string; userId: string }) =>
      teamsApi.removeTeamMember(teamId, userId),
    onSuccess: (data, variables) => {
      // Invalidate team details to refresh members list
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.detail(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: TEAMS_QUERY_KEYS.lists() });
      toast.success(data.message || 'Team member removed successfully');
    },
    onError: (error: any) => {
      const message = error?.error?.message || 'Failed to remove team member';
      toast.error(message);
    },
  });
};

/**
 * Hook to get smart team assignment suggestion
 */
export const useSuggestTeamAssignment = () => {
  return useMutation({
    mutationFn: (request: TeamAssignmentRequest) => teamsApi.suggestTeamAssignment(request),
    onSuccess: () => {
      toast.success('Team suggestion generated successfully');
    },
    onError: (error: any) => {
      const message = error?.error?.message || 'Failed to get team suggestion';
      toast.error(message);
    },
  });
};

/**
 * Hook to search users for team member addition
 */
export const useSearchUsers = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['searchUsers', query],
    queryFn: () => teamsApi.searchUsers(query),
    enabled: enabled && query.length >= 2, // Only search when query is at least 2 characters
    staleTime: 30 * 1000, // 30 seconds
    retry: false, // Don't retry failed searches
  });
};
