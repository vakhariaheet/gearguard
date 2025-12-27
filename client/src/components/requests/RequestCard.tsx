import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { StatusBadge } from './StatusBadge';
import {
  getPriorityColor,
  getPriorityIcon,
  formatDuration,
  type MaintenanceRequest,
} from '../../types/requests';
import {
  Calendar,
  Clock,
  User,
  Users,
  Wrench,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCheck,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface RequestCardProps {
  request: MaintenanceRequest;
  onEdit?: (request: MaintenanceRequest) => void;
  onDelete?: (request: MaintenanceRequest) => void;
  onAssign?: (request: MaintenanceRequest) => void;
  onStatusUpdate?: (request: MaintenanceRequest) => void;
  onView?: (request: MaintenanceRequest) => void;
  showActions?: boolean;
  userRole?: string;
}

export const RequestCard = ({
  request,
  onEdit,
  onDelete,
  onAssign,
  onStatusUpdate,
  onView,
  showActions = true,
  userRole = 'employee',
}: RequestCardProps) => {
  const canEdit = userRole !== 'employee' || !['Repaired', 'Scrap'].includes(request.status);
  const canDelete = ['manager', 'admin'].includes(userRole) && request.status !== 'In Progress';
  const canAssign = ['manager', 'admin'].includes(userRole);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView?.(request)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate">{request.subject}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {request.requestType}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs text-white ${getPriorityColor(request.priority)}`}
              >
                <span className="mr-1">{getPriorityIcon(request.priority)}</span>
                {request.priority}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={request.status} />
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {canEdit && onEdit && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(request);
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {canAssign && onAssign && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onAssign(request);
                      }}
                    >
                      <UserCheck className="h-4 w-4 mr-2" />
                      Assign
                    </DropdownMenuItem>
                  )}
                  {onStatusUpdate && !['Repaired', 'Scrap'].includes(request.status) && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusUpdate(request);
                      }}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Update Status
                    </DropdownMenuItem>
                  )}
                  {canDelete && onDelete && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(request);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {request.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{request.description}</p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{request.equipmentName}</span>
            <Badge variant="outline" className="text-xs">
              {request.equipmentCategory}
            </Badge>
          </div>

          {request.assignedTechnician && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>Assigned to: {request.assignedTechnician}</span>
            </div>
          )}

          {request.assignedTeam && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Team: {request.assignedTeam}</span>
            </div>
          )}

          {request.scheduledDate && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Scheduled: {formatDate(request.scheduledDate)}</span>
            </div>
          )}

          {request.hoursSpent && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Duration: {formatDuration(request.hoursSpent)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center mt-4 pt-3 border-t text-xs text-muted-foreground">
          <span>Created: {formatDate(request.createdAt)}</span>
          <span>Updated: {formatDate(request.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
};
