/**
 * Kanban Board Component
 *
 * Main Kanban board interface with drag-and-drop functionality and real-time updates
 */

import React, { useState, useCallback } from 'react';
import { DndContext, DragOverlay, closestCorners } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Users,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle,
  Settings,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { KanbanColumn } from './KanbanColumn';
import { RequestCard } from './RequestCard';
import { useKanbanBoard, useDragAndDrop, useBoardFilters } from '@/hooks/useKanban';
import type {
  KanbanBoard as KanbanBoardType,
  RequestCard as RequestCardType,
} from '@/types/kanban';

interface KanbanBoardProps {
  onRequestClick?: (request: RequestCardType) => void;
  onCalendarView?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ onRequestClick, onCalendarView }) => {
  const [activeCard, setActiveCard] = useState<RequestCardType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Board filters hook
  const { activeFilters, updateFilter, clearAllFilters, hasActiveFilters, filterCount } =
    useBoardFilters();

  // Kanban board data hook
  const { board, stats, isLoading, error, refetch } = useKanbanBoard(activeFilters);

  // Drag and drop hook
  const { handleDragEnd, isUpdating } = useDragAndDrop();

  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const activeRequest = findRequestById(active.id as string);
      setActiveCard(activeRequest);
    },
    [board]
  );

  // Handle drag end
  const handleDragEndInternal = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCard(null);

      if (!over || !board) return;

      const requestId = active.id as string;
      const newColumnId = over.id as string;

      // Find the request and current column
      const activeRequest = findRequestById(requestId);
      const currentColumn = findColumnByRequestId(requestId);
      const targetColumn = board.columns.find((col) => col.id === newColumnId);

      if (
        !activeRequest ||
        !currentColumn ||
        !targetColumn ||
        currentColumn.id === targetColumn.id
      ) {
        return;
      }

      // Check if transition is valid
      const allowedTransitions = board.rules.allowedTransitions[currentColumn.status] || [];
      if (!allowedTransitions.includes(targetColumn.status)) {
        toast.error(`Cannot move request from ${currentColumn.title} to ${targetColumn.title}`);
        return;
      }

      // Check column limits
      if (targetColumn.limits?.max && targetColumn.requests.length >= targetColumn.limits.max) {
        toast.error(
          `${targetColumn.title} column is at capacity (${targetColumn.limits.max} requests)`
        );
        return;
      }

      // Perform the drag and drop
      await handleDragEnd(requestId, currentColumn.status, targetColumn.status);
    },
    [board, handleDragEnd]
  );

  // Find request by ID
  const findRequestById = useCallback(
    (id: string): RequestCardType | null => {
      if (!board) return null;

      for (const column of board.columns) {
        const request = column.requests.find((r) => r.id === id);
        if (request) return request;
      }
      return null;
    },
    [board]
  );

  // Find column by request ID
  const findColumnByRequestId = useCallback(
    (requestId: string) => {
      if (!board) return null;
      return board.columns.find((column) =>
        column.requests.some((request) => request.id === requestId)
      );
    },
    [board]
  );

  // Filter requests based on search term
  const getFilteredBoard = useCallback((): KanbanBoardType | null => {
    if (!board) return null;

    if (!searchTerm.trim()) return board;

    const filteredColumns = board.columns.map((column) => ({
      ...column,
      requests: column.requests.filter(
        (request) =>
          request.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.equipmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.assignedTechnician?.name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }));

    return {
      ...board,
      columns: filteredColumns,
    };
  }, [board, searchTerm]);

  const filteredBoard = getFilteredBoard();

  // Handle filter changes
  const handleTeamFilter = (value: string) => {
    if (value === 'all') {
      updateFilter('teams', undefined);
    } else {
      updateFilter('teams', [value]);
    }
  };

  const handlePriorityFilter = (value: string) => {
    if (value === 'all') {
      updateFilter('priorities', undefined);
    } else {
      updateFilter('priorities', [value]);
    }
  };

  const handleOverdueFilter = (checked: boolean) => {
    updateFilter('showOverdueOnly', checked);
  };

  const handleMyRequestsFilter = (checked: boolean) => {
    updateFilter('showMyRequestsOnly', checked);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading Kanban board...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-600 mb-4">Failed to load Kanban board</p>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!filteredBoard) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No board data available</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with filters and controls */}
      <Card className="mb-6 flex-shrink-0">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <span>Maintenance Kanban Board</span>
              {isUpdating && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Updating
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={onCalendarView}>
                <Calendar className="h-4 w-4 mr-2" />
                Calendar View
              </Button>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-64">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>

            <Select onValueChange={handleTeamFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                <SelectItem value="Mechanics">Mechanics</SelectItem>
                <SelectItem value="Electricians">Electricians</SelectItem>
                <SelectItem value="IT Support">IT Support</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={handlePriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant={activeFilters.showOverdueOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleOverdueFilter(!activeFilters.showOverdueOnly)}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Overdue Only
            </Button>

            <Button
              variant={activeFilters.showMyRequestsOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleMyRequestsFilter(!activeFilters.showMyRequestsOnly)}
            >
              <Users className="h-4 w-4 mr-2" />
              My Requests
            </Button>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                Clear Filters ({filterCount})
              </Button>
            )}
          </div>

          {/* Board Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Total: {stats.totalRequests}</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <span className="text-sm">Overdue: {stats.overdueCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm">In Progress: {stats.byStatus['In Progress']}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Completed: {stats.byStatus.Repaired}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          onDragStart={handleDragStart}
          onDragEnd={handleDragEndInternal}
          collisionDetection={closestCorners}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full">
            {filteredBoard.columns.map((column) => (
              <KanbanColumn key={column.id} column={column} onRequestClick={onRequestClick} />
            ))}
          </div>

          <DragOverlay>
            {activeCard ? (
              <RequestCard request={activeCard} isDragging={true} onClick={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};
