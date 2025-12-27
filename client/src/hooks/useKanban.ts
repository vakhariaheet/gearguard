/**
 * Kanban Hooks
 *
 * React hooks for Kanban board operations with real-time updates
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { kanbanApi } from '../services/kanbanApi';
import { getMockKanbanBoard, updateMockRequestStatus } from '../data/mockData';
import { useMockData } from '../contexts/MockDataContext';
import { DEV_FLAGS, logMockUsage } from '../utils/devMode';
import type { BoardFilters, RequestCard, UpdateRequestStatusRequest } from '../types/kanban';

// =============================================================================
// KANBAN BOARD HOOK
// =============================================================================

export const useKanbanBoard = (filters?: BoardFilters) => {
  const mockData = DEV_FLAGS.useMockKanban ? useMockData() : null;

  // Query for Kanban board data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['kanban-board', filters],
    queryFn: async () => {
      if (DEV_FLAGS.useMockKanban && mockData) {
        logMockUsage('Kanban Board', true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockData.generateBoard(filters);
      }
      return kanbanApi.getKanbanBoard(filters);
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: DEV_FLAGS.useMockKanban ? false : 60 * 1000, // Don't auto-refetch mock data
  });

  return {
    board: data?.board,
    stats: data?.stats,
    isLoading,
    error,
    refetch,
  };
};

// =============================================================================
// REQUEST STATUS UPDATE HOOK
// =============================================================================

export const useUpdateRequestStatus = () => {
  const queryClient = useQueryClient();
  const mockData = DEV_FLAGS.useMockKanban ? useMockData() : null;

  return useMutation({
    mutationFn: async ({
      requestId,
      statusUpdate,
    }: {
      requestId: string;
      statusUpdate: UpdateRequestStatusRequest;
    }) => {
      if (DEV_FLAGS.useMockKanban && mockData) {
        logMockUsage('Update Request Status', true);
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Update the mock data state via context
        mockData.updateRequestStatus(requestId, statusUpdate.newStatus as any);

        return {
          success: true,
          message: `Request ${requestId} status updated to ${statusUpdate.newStatus}`,
        };
      }
      return kanbanApi.updateRequestStatus(requestId, statusUpdate);
    },

    onMutate: async ({ requestId, statusUpdate }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['kanban-board'] });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(['kanban-board']);

      // Optimistically update the cache
      queryClient.setQueriesData({ queryKey: ['kanban-board'] }, (oldData: any) => {
        if (!oldData?.board) return oldData;

        const newBoard = { ...oldData.board };
        let movedRequest: RequestCard | null = null;

        // Remove from source column
        newBoard.columns = newBoard.columns.map((column: any) => {
          if (column.status === statusUpdate.previousStatus) {
            const requestIndex = column.requests.findIndex((r: RequestCard) => r.id === requestId);
            if (requestIndex !== -1) {
              movedRequest = column.requests[requestIndex];
              return {
                ...column,
                requests: column.requests.filter((r: RequestCard) => r.id !== requestId),
              };
            }
          }
          return column;
        });

        // Add to destination column
        if (movedRequest) {
          newBoard.columns = newBoard.columns.map((column: any) => {
            if (column.status === statusUpdate.newStatus) {
              return {
                ...column,
                requests: [
                  ...column.requests,
                  {
                    ...movedRequest!,
                    status: statusUpdate.newStatus as any,
                    updatedAt: new Date().toISOString(),
                  },
                ],
              };
            }
            return column;
          });
        }

        return {
          ...oldData,
          board: newBoard,
        };
      });

      return { previousData };
    },

    onSuccess: (data) => {
      toast.success(data.message || 'Request status updated successfully');

      // Only invalidate queries if not using mock data
      if (!DEV_FLAGS.useMockKanban) {
        queryClient.invalidateQueries({ queryKey: ['kanban-board'] });
      }
    },

    onError: (error, _params, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueryData(['kanban-board'], context.previousData);
      }

      toast.error(error instanceof Error ? error.message : 'Failed to update request status');

      // Only invalidate queries if not using mock data
      if (!DEV_FLAGS.useMockKanban) {
        queryClient.invalidateQueries({ queryKey: ['kanban-board'] });
      }
    },

    // Remove onSettled to prevent automatic invalidation
  });
};

// =============================================================================
// BOARD STATISTICS HOOK
// =============================================================================

export const useBoardStats = (filters?: BoardFilters) => {
  const mockData = DEV_FLAGS.useMockKanban ? useMockData() : null;

  return useQuery({
    queryKey: ['board-stats', filters],
    queryFn: async () => {
      if (DEV_FLAGS.useMockKanban && mockData) {
        logMockUsage('Board Stats', true);
        await new Promise((resolve) => setTimeout(resolve, 300));
        return mockData.generateBoard(filters);
      }
      return kanbanApi.getKanbanBoard(filters);
    },
    select: (data) => data.stats,
    staleTime: 60 * 1000, // 1 minute
  });
};

// =============================================================================
// DRAG AND DROP HOOK
// =============================================================================

export const useDragAndDrop = () => {
  const updateStatusMutation = useUpdateRequestStatus();

  const handleDragEnd = useCallback(
    async (requestId: string, fromStatus: string, toStatus: string, reason?: string) => {
      if (fromStatus === toStatus) return;

      try {
        await updateStatusMutation.mutateAsync({
          requestId,
          statusUpdate: {
            newStatus: toStatus as any,
            previousStatus: fromStatus,
            reason: reason || 'Kanban drag and drop',
          },
        });
      } catch (error) {
        // Error handling is done in the mutation
        console.error('Drag and drop failed:', error);
      }
    },
    [updateStatusMutation]
  );

  return {
    handleDragEnd,
    isUpdating: updateStatusMutation.isPending,
  };
};

// =============================================================================
// BOARD FILTERS HOOK
// =============================================================================

export const useBoardFilters = () => {
  const [activeFilters, setActiveFilters] = useState<BoardFilters>({});

  const updateFilter = useCallback((key: keyof BoardFilters, value: any) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeFilter = useCallback((key: keyof BoardFilters) => {
    setActiveFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
  }, []);

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  const getFilterCount = useCallback(() => {
    let count = 0;
    Object.entries(activeFilters).forEach(([_key, value]) => {
      if (Array.isArray(value) && value.length > 0) count++;
      else if (typeof value === 'boolean' && value) count++;
      else if (typeof value === 'object' && value !== null) count++;
      else if (value) count++;
    });
    return count;
  }, [activeFilters]);

  return {
    activeFilters,
    updateFilter,
    removeFilter,
    clearAllFilters,
    hasActiveFilters,
    filterCount: getFilterCount(),
  };
};

// =============================================================================
// EXPORT ALL HOOKS
// =============================================================================

export const kanbanHooks = {
  useKanbanBoard,
  useUpdateRequestStatus,
  useBoardStats,
  useDragAndDrop,
  useBoardFilters,
};
