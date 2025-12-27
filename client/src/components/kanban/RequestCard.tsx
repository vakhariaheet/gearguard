/**
 * Request Card Component
 *
 * Individual draggable card for maintenance requests in the Kanban board
 */

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, AlertTriangle, User, Calendar, Wrench, Activity } from 'lucide-react';
import type { RequestCard as RequestCardType } from '@/types/kanban';
import { getPriorityBadgeColor, formatRelativeTime, formatDuration } from '@/types/kanban';
import { cn } from '@/lib/utils';

interface RequestCardProps {
  request: RequestCardType;
  isDragging?: boolean;
  onClick?: (request: RequestCardType) => void;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  isDragging = false,
  onClick,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: request.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleClick = () => {
    if (!isDragging && !isSortableDragging) {
      onClick?.(request);
    }
  };

  const getPriorityIcon = () => {
    if (request.priority === 'Critical') {
      return <AlertTriangle className="h-3 w-3" />;
    }
    return null;
  };

  const getStatusIcon = () => {
    switch (request.status) {
      case 'New':
        return <Clock className="h-3 w-3 text-blue-500" />;
      case 'In Progress':
        return <Activity className="h-3 w-3 text-amber-500" />;
      case 'Repaired':
        return <Wrench className="h-3 w-3 text-green-500" />;
      case 'Scrap':
        return <AlertTriangle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        'border border-gray-200 bg-white',
        isDragging || isSortableDragging ? 'shadow-lg rotate-2 scale-105' : '',
        request.isOverdue ? 'border-red-300 bg-red-50' : '',
        request.priority === 'Critical' ? 'border-red-400' : '',
        request.priority === 'High' ? 'border-orange-400' : ''
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">{request.subject}</h4>
            <p className="text-xs text-gray-500 mt-1 truncate">{request.equipmentName}</p>
          </div>
          <div className="flex items-center gap-1">
            {getPriorityIcon()}
            <Badge variant={getPriorityBadgeColor(request.priority)} className="text-xs">
              {request.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Equipment Category */}
        <div className="flex items-center gap-1 mb-2">
          <Wrench className="h-3 w-3 text-gray-400" />
          <span className="text-xs text-gray-600">{request.equipmentCategory}</span>
        </div>

        {/* Description (if available) */}
        {request.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{request.description}</p>
        )}

        {/* Assigned Technician */}
        {request.assignedTechnician && (
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-5 w-5">
              <AvatarImage src={request.assignedTechnician.avatar} />
              <AvatarFallback className="text-xs">
                {request.assignedTechnician.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-600 truncate">
              {request.assignedTechnician.name}
            </span>
          </div>
        )}

        {/* Team Assignment */}
        {request.assignedTeam && (
          <div className="flex items-center gap-1 mb-2">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">{request.assignedTeam}</span>
          </div>
        )}

        {/* Due Date */}
        {request.dueDate && (
          <div
            className={cn(
              'flex items-center gap-1 mb-2',
              request.isOverdue ? 'text-red-600' : 'text-gray-600'
            )}
          >
            <Calendar className="h-3 w-3" />
            <span className="text-xs">Due: {new Date(request.dueDate).toLocaleDateString()}</span>
            {request.isOverdue && (
              <Badge variant="destructive" className="text-xs ml-1">
                Overdue
              </Badge>
            )}
          </div>
        )}

        {/* Time Information */}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{formatRelativeTime(request.updatedAt)}</span>
          </div>

          {request.estimatedHours && (
            <div className="flex items-center gap-1">
              <span>Est: {formatDuration(request.estimatedHours * 60)}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {request.tags && request.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {request.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {request.tags.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{request.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Health Score */}
        {request.healthScore !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <Activity className="h-3 w-3 text-gray-400" />
            <span className="text-xs text-gray-600">Health: {request.healthScore}%</span>
            <div className="flex-1 bg-gray-200 rounded-full h-1 ml-1">
              <div
                className={cn(
                  'h-1 rounded-full transition-all',
                  request.healthScore >= 80
                    ? 'bg-green-500'
                    : request.healthScore >= 60
                      ? 'bg-yellow-500'
                      : request.healthScore >= 40
                        ? 'bg-orange-500'
                        : 'bg-red-500'
                )}
                style={{ width: `${request.healthScore}%` }}
              />
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span className="text-xs font-medium text-gray-700">{request.status}</span>
          </div>

          {request.actualHours && (
            <span className="text-xs text-gray-500">
              Spent: {formatDuration(request.actualHours * 60)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
