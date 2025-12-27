/**
 * React Query Hooks for Requests API
 * Provides caching, refetching, and mutation support for maintenance requests
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsApi, equipmentApi, teamsApi, techniciansApi } from '../services/requestsApi';
import type {
  MaintenanceRequest,
  CreateRequestRequest,
  UpdateRequestRequest,
  AssignRequestRequest,
  UpdateStatusRequest,
  ListRequestsQuery,
  RequestAutoFillRequest,
} from '../types/requests';

// =============================================================================
// QUERY KEYS
// =============================================================================

export const requestKeys = {
  all: ['requests'] as const,
  lists: () => [...requestKeys.all, 'list'] as const,
  list: (params?: ListRequestsQuery) => [...requestKeys.lists(), params] as const,
  details: () => [...requestKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
  autoFill: () => [...requestKeys.all, 'autoFill'] as const,
};

export const equipmentKeys = {
  all: ['equipment'] as const,
  lists: () => [...equipmentKeys.all, 'list'] as const,
  details: () => [...equipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...equipmentKeys.details(), id] as const,
};

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
};

export const technicianKeys = {
  all: ['technicians'] as const,
  lists: () => [...technicianKeys.all, 'list'] as const,
};

// =============================================================================
// REQUEST QUERIES
// =============================================================================

/**
 * Hook to fetch list of maintenance requests
 */
export function useRequests(params?: ListRequestsQuery & { enabled?: boolean }) {
  const { enabled = true, ...queryParams } = params || {};

  return useQuery({
    queryKey: requestKeys.list(queryParams),
    queryFn: () => requestsApi.listRequests(queryParams),
    enabled,
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch request details
 */
export function useRequestDetails(requestId: string, enabled = true) {
  return useQuery({
    queryKey: requestKeys.detail(requestId),
    queryFn: () => requestsApi.getRequest(requestId),
    enabled: enabled && !!requestId,
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch equipment list
 */
export function useEquipment(enabled = true) {
  return useQuery({
    queryKey: equipmentKeys.lists(),
    queryFn: () => equipmentApi.listEquipment(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - equipment doesn't change often
  });
}

/**
 * Hook to fetch equipment details
 */
export function useEquipmentDetails(equipmentId: string, enabled = true) {
  return useQuery({
    queryKey: equipmentKeys.detail(equipmentId),
    queryFn: () => equipmentApi.getEquipment(equipmentId),
    enabled: enabled && !!equipmentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch teams list
 */
export function useTeams(enabled = true) {
  return useQuery({
    queryKey: teamKeys.lists(),
    queryFn: () => teamsApi.listTeams(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch technicians list
 */
export function useTechnicians(enabled = true) {
  return useQuery({
    queryKey: technicianKeys.lists(),
    queryFn: () => techniciansApi.listTechnicians(),
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes - availability can change
  });
}

// =============================================================================
// REQUEST MUTATIONS
// =============================================================================

/**
 * Hook to create a new maintenance request
 */
export function useCreateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRequestRequest) => requestsApi.createRequest(data),
    onSuccess: (response) => {
      // Add new request to cache optimistically
      queryClient.setQueriesData({ queryKey: requestKeys.lists() }, (oldData: any) => {
        if (!oldData?.data?.requests) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            requests: [response.data, ...oldData.data.requests],
            totalCount: oldData.data.totalCount + 1,
          },
        };
      });

      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
    },
  });
}

/**
 * Hook to update a maintenance request
 */
export function useUpdateRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: UpdateRequestRequest }) =>
      requestsApi.updateRequest(requestId, data),
    onMutate: async ({ requestId, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: requestKeys.detail(requestId) });
      await queryClient.cancelQueries({ queryKey: requestKeys.lists() });

      // Snapshot previous values
      const previousDetail = queryClient.getQueryData(requestKeys.detail(requestId));
      const previousLists = queryClient.getQueriesData({ queryKey: requestKeys.lists() });

      // Optimistically update
      queryClient.setQueryData(requestKeys.detail(requestId), (oldData: any) => {
        if (!oldData?.data) return oldData;
        return {
          ...oldData,
          data: { ...oldData.data, ...data, updatedAt: new Date().toISOString() },
        };
      });

      queryClient.setQueriesData({ queryKey: requestKeys.lists() }, (oldData: any) => {
        if (!oldData?.data?.requests) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            requests: oldData.data.requests.map((request: MaintenanceRequest) =>
              request.id === requestId
                ? { ...request, ...data, updatedAt: new Date().toISOString() }
                : request
            ),
          },
        };
      });

      return { previousDetail, previousLists };
    },
    onError: (_err, { requestId }, context) => {
      // Rollback on error
      if (context?.previousDetail) {
        queryClient.setQueryData(requestKeys.detail(requestId), context.previousDetail);
      }
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
    },
  });
}

/**
 * Hook to delete a maintenance request
 */
export function useDeleteRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => requestsApi.deleteRequest(requestId),
    onMutate: async (requestId) => {
      await queryClient.cancelQueries({ queryKey: requestKeys.lists() });

      const previousLists = queryClient.getQueriesData({ queryKey: requestKeys.lists() });

      // Optimistically remove request
      queryClient.setQueriesData({ queryKey: requestKeys.lists() }, (oldData: any) => {
        if (!oldData?.data?.requests) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            requests: oldData.data.requests.filter(
              (request: MaintenanceRequest) => request.id !== requestId
            ),
            totalCount: Math.max(0, oldData.data.totalCount - 1),
          },
        };
      });

      return { previousLists };
    },
    onError: (_err, _requestId, context) => {
      if (context?.previousLists) {
        context.previousLists.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (_data, _error, requestId) => {
      // Remove request detail from cache
      queryClient.removeQueries({ queryKey: requestKeys.detail(requestId) });
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
    },
  });
}

/**
 * Hook to assign a request to team or technician
 */
export function useAssignRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: AssignRequestRequest }) =>
      requestsApi.assignRequest(requestId, data),
    onSuccess: (response, { requestId }) => {
      // Update cached data
      queryClient.setQueryData(requestKeys.detail(requestId), response);

      queryClient.setQueriesData({ queryKey: requestKeys.lists() }, (oldData: any) => {
        if (!oldData?.data?.requests) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            requests: oldData.data.requests.map((request: MaintenanceRequest) =>
              request.id === requestId ? response.data : request
            ),
          },
        };
      });
    },
  });
}

/**
 * Hook to update request status
 */
export function useUpdateRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: UpdateStatusRequest }) =>
      requestsApi.updateStatus(requestId, data),
    onSuccess: (response, { requestId }) => {
      // Update cached data
      queryClient.setQueryData(requestKeys.detail(requestId), response);

      queryClient.setQueriesData({ queryKey: requestKeys.lists() }, (oldData: any) => {
        if (!oldData?.data?.requests) return oldData;

        return {
          ...oldData,
          data: {
            ...oldData.data,
            requests: oldData.data.requests.map((request: MaintenanceRequest) =>
              request.id === requestId ? response.data : request
            ),
          },
        };
      });

      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: requestKeys.lists() });
    },
  });
}

/**
 * Hook to get auto-fill suggestions for request creation
 */
export function useAutoFillSuggestions() {
  return useMutation({
    mutationFn: (data: RequestAutoFillRequest) => requestsApi.getAutoFillSuggestions(data),
  });
}
