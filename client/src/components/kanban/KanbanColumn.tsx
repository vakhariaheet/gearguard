/**
 * Kanban Column Component
 *
 * Droppable column for organizing maintenance requests by status
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { RequestCard } from './RequestCard';
import type {
  KanbanColumn as KanbanColumnType,
  RequestCard as RequestCardType,
} from '@/types/kanban';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onRequestClick?: (request: RequestCardType) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({ column, onRequestClick }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const getColumnIcon = () => {
    switch (column.status) {
      case 'New':
        return <Clock className="h-4 w-4" />;
      case 'In Progress':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Repaired':
        return <CheckCircle className="h-4 w-4" />;
      case 'Scrap':
        return <Trash2 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getColumnStats = () => {
    const total = column.requests.length;
    const overdue = column.requests.filter((r) => r.isOverdue).length;
    const highPriority = column.requests.filter(
      (r) => r.priority === 'High' || r.priority === 'Critical'
    ).length;

    return { total, overdue, highPriority };
  };

  const stats = getColumnStats();

  const isNearLimit = column.limits?.warnAt && stats.total >= column.limits.warnAt;
  const isAtLimit = column.limits?.max && stats.total >= column.limits.max;

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <Card className="mb-4 flex-shrink-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: column.color }}
              />
              <div className="flex items-center gap-1">
                {getColumnIcon()}
                <span className="font-medium">{column.title}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs',
                  isAtLimit
                    ? 'bg-red-100 text-red-800'
                    : isNearLimit
                      ? 'bg-yellow-100 text-yellow-800'
                      : ''
                )}
              >
                {stats.total}
                {column.limits?.max && ` / ${column.limits.max}`}
              </Badge>

              {stats.overdue > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {stats.overdue} overdue
                </Badge>
              )}

              {stats.highPriority > 0 && (
                <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                  {stats.highPriority} high
                </Badge>
              )}
            </div>
          </CardTitle>

          {/* Limits Warning */}
          {isNearLimit && (
            <div className="text-xs text-amber-600 mt-1">
              {isAtLimit ? 'At capacity limit' : 'Approaching capacity limit'}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[200px] p-2 rounded-lg transition-colors',
          'border-2 border-dashed border-transparent',
          isOver ? 'border-blue-300 bg-blue-50' : '',
          isAtLimit ? 'bg-red-50' : ''
        )}
      >
        <SortableContext
          items={column.requests.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {column.requests.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-gray-400">
                <div className="text-center">
                  <div className="text-2xl mb-2">📋</div>
                  <p className="text-sm">No requests</p>
                </div>
              </div>
            ) : (
              column.requests.map((request) => (
                <RequestCard key={request.id} request={request} onClick={onRequestClick} />
              ))
            )}
          </div>
        </SortableContext>
      </div>

      {/* Column Footer with Additional Info */}
      {(column.limits || column.automationRules?.length) && (
        <Card className="mt-2 flex-shrink-0">
          <CardContent className="p-2">
            <div className="text-xs text-gray-500 space-y-1">
              {column.limits && (
                <div className="flex justify-between">
                  <span>Capacity:</span>
                  <span>
                    {stats.total}
                    {column.limits.max && ` / ${column.limits.max}`}
                  </span>
                </div>
              )}

              {column.automationRules && column.automationRules.length > 0 && (
                <div className="flex justify-between">
                  <span>Auto Rules:</span>
                  <span>{column.automationRules.length} active</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
