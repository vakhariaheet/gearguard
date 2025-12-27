/**
 * Mock Kanban State Hook
 *
 * React state-based mock data management for Kanban board
 */

import { useState, useCallback, useMemo } from 'react';
import { mockKanbanRequests, mockKanbanBoard } from '../data/mockData';
import type {
  RequestCard,
  KanbanBoard,
  KanbanColumn,
  BoardStats,
  BoardFilters,
} from '../types/kanban';

export const useMockKanbanState = () => {
  // Initialize state with mock data
  const [requests, setRequests] = useState<RequestCard[]>(() => [...mockKanbanRequests]);

  // Update request status
  const updateRequestStatus = useCallback(
    (requestId: string, newStatus: 'New' | 'In Progress' | 'Repaired' | 'Scrap') => {
      setRequests((prevRequests) =>
        prevRequests.map((req) =>
          req.id === requestId
            ? { ...req, status: newStatus, updatedAt: new Date().toISOString() }
            : req
        )
      );
    },
    []
  );

  // Reset to original mock data
  const resetMockData = useCallback(() => {
    setRequests([...mockKanbanRequests]);
  }, []);

  // Generate board with current state and filters
  const generateBoard = useCallback(
    (filters?: BoardFilters): { board: KanbanBoard; stats: BoardStats } => {
      let filteredRequests = [...requests];

      // Apply filters
      if (filters?.teams && filters.teams.length > 0) {
        filteredRequests = filteredRequests.filter((req) =>
          filters.teams!.includes(req.assignedTeam)
        );
      }

      if (filters?.priorities && filters.priorities.length > 0) {
        filteredRequests = filteredRequests.filter((req) =>
          filters.priorities!.includes(req.priority)
        );
      }

      if (filters?.showOverdueOnly) {
        filteredRequests = filteredRequests.filter(
          (req) => new Date(req.dueDate) < new Date() && req.status !== 'Repaired'
        );
      }

      if (filters?.assignedTechnician) {
        filteredRequests = filteredRequests.filter((req) =>
          req.assignedTechnician?.name
            .toLowerCase()
            .includes(filters.assignedTechnician!.toLowerCase())
        );
      }

      // Create columns with current filtered requests
      const columns: KanbanColumn[] = [
        {
          id: 'col_new',
          title: 'New',
          status: 'New',
          color: '#3B82F6',
          requests: filteredRequests.filter((req) => req.status === 'New'),
          limits: { max: 10 },
          order: 0,
        },
        {
          id: 'col_progress',
          title: 'In Progress',
          status: 'In Progress',
          color: '#8B5CF6',
          requests: filteredRequests.filter((req) => req.status === 'In Progress'),
          limits: { max: 8 },
          order: 1,
        },
        {
          id: 'col_repaired',
          title: 'Repaired',
          status: 'Repaired',
          color: '#10B981',
          requests: filteredRequests.filter((req) => req.status === 'Repaired'),
          limits: {},
          order: 2,
        },
        {
          id: 'col_scrap',
          title: 'Scrap',
          status: 'Scrap',
          color: '#EF4444',
          requests: filteredRequests.filter((req) => req.status === 'Scrap'),
          limits: {},
          order: 3,
        },
      ];

      const board: KanbanBoard = {
        ...mockKanbanBoard,
        columns,
        filters: filters || {},
        lastUpdated: new Date().toISOString(),
      };

      // Calculate stats
      const stats: BoardStats = {
        totalRequests: filteredRequests.length,
        byStatus: {
          New: filteredRequests.filter((req) => req.status === 'New').length,
          'In Progress': filteredRequests.filter((req) => req.status === 'In Progress').length,
          Repaired: filteredRequests.filter((req) => req.status === 'Repaired').length,
          Scrap: filteredRequests.filter((req) => req.status === 'Scrap').length,
        },
        byPriority: {
          Critical: filteredRequests.filter((req) => req.priority === 'Critical').length,
          High: filteredRequests.filter((req) => req.priority === 'High').length,
          Medium: filteredRequests.filter((req) => req.priority === 'Medium').length,
          Low: filteredRequests.filter((req) => req.priority === 'Low').length,
        },
        overdueCount: filteredRequests.filter(
          (req) => new Date(req.dueDate) < new Date() && req.status !== 'Repaired'
        ).length,
        averageAge: 2.5,
      };

      return { board, stats };
    },
    [requests]
  );

  return {
    requests,
    updateRequestStatus,
    resetMockData,
    generateBoard,
  };
};

// Create a singleton instance for global state management
let globalMockState: ReturnType<typeof useMockKanbanState> | null = null;

export const getGlobalMockState = () => {
  if (!globalMockState) {
    // This is a hack to create a singleton, but it works for our mock data needs
    const mockHook = () => {
      const [requests, setRequests] = useState<RequestCard[]>([...mockKanbanRequests]);

      const updateRequestStatus = (
        requestId: string,
        newStatus: 'New' | 'In Progress' | 'Repaired' | 'Scrap'
      ) => {
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? { ...req, status: newStatus, updatedAt: new Date().toISOString() }
              : req
          )
        );
      };

      const resetMockData = () => {
        setRequests([...mockKanbanRequests]);
      };

      const generateBoard = (filters?: BoardFilters) => {
        let filteredRequests = [...requests];

        if (filters?.teams && filters.teams.length > 0) {
          filteredRequests = filteredRequests.filter((req) =>
            filters.teams!.includes(req.assignedTeam)
          );
        }

        if (filters?.priorities && filters.priorities.length > 0) {
          filteredRequests = filteredRequests.filter((req) =>
            filters.priorities!.includes(req.priority)
          );
        }

        if (filters?.showOverdueOnly) {
          filteredRequests = filteredRequests.filter(
            (req) => new Date(req.dueDate) < new Date() && req.status !== 'Repaired'
          );
        }

        if (filters?.assignedTechnician) {
          filteredRequests = filteredRequests.filter((req) =>
            req.assignedTechnician?.name
              .toLowerCase()
              .includes(filters.assignedTechnician!.toLowerCase())
          );
        }

        const columns: KanbanColumn[] = [
          {
            id: 'col_new',
            title: 'New',
            status: 'New',
            color: '#3B82F6',
            requests: filteredRequests.filter((req) => req.status === 'New'),
            limits: { max: 10 },
            order: 0,
          },
          {
            id: 'col_progress',
            title: 'In Progress',
            status: 'In Progress',
            color: '#8B5CF6',
            requests: filteredRequests.filter((req) => req.status === 'In Progress'),
            limits: { max: 8 },
            order: 1,
          },
          {
            id: 'col_repaired',
            title: 'Repaired',
            status: 'Repaired',
            color: '#10B981',
            requests: filteredRequests.filter((req) => req.status === 'Repaired'),
            limits: {},
            order: 2,
          },
          {
            id: 'col_scrap',
            title: 'Scrap',
            status: 'Scrap',
            color: '#EF4444',
            requests: filteredRequests.filter((req) => req.status === 'Scrap'),
            limits: {},
            order: 3,
          },
        ];

        const board: KanbanBoard = {
          ...mockKanbanBoard,
          columns,
          filters: filters || {},
          lastUpdated: new Date().toISOString(),
        };

        const stats: BoardStats = {
          totalRequests: filteredRequests.length,
          byStatus: {
            New: filteredRequests.filter((req) => req.status === 'New').length,
            'In Progress': filteredRequests.filter((req) => req.status === 'In Progress').length,
            Repaired: filteredRequests.filter((req) => req.status === 'Repaired').length,
            Scrap: filteredRequests.filter((req) => req.status === 'Scrap').length,
          },
          byPriority: {
            Critical: filteredRequests.filter((req) => req.priority === 'Critical').length,
            High: filteredRequests.filter((req) => req.priority === 'High').length,
            Medium: filteredRequests.filter((req) => req.priority === 'Medium').length,
            Low: filteredRequests.filter((req) => req.priority === 'Low').length,
          },
          overdueCount: filteredRequests.filter(
            (req) => new Date(req.dueDate) < new Date() && req.status !== 'Repaired'
          ).length,
          averageAge: 2.5,
        };

        return { board, stats };
      };

      return { requests, updateRequestStatus, resetMockData, generateBoard };
    };
  }

  return globalMockState;
};
