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
  Clock,
  User,
  Users,
  Wrench,
  Edit,
  Trash2,
  UserCheck,
  ArrowLeft,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useTeamName } from '../../hooks/useTeamName';
import { useUserName } from '../../hooks/useUserName';

interface RequestDetailsProps {
  request: MaintenanceRequest;
  onEdit?: (request: MaintenanceRequest) => void;
  onDelete?: (request: MaintenanceRequest) => void;
  onAssign?: (request: MaintenanceRequest) => void;
  onStatusUpdate?: (request: MaintenanceRequest) => void;
  onBack?: () => void;
  userRole?: string;
}

export const RequestDetails = ({
  request,
  onEdit,
  onDelete,
  onAssign,
  onStatusUpdate,
  onBack,
  userRole = 'employee',
}: RequestDetailsProps) => {
  const canEdit = userRole !== 'employee' || !['Repaired', 'Scrap'].includes(request.status);
  const canDelete = ['manager', 'admin'].includes(userRole) && request.status !== 'In Progress';
  const canAssign = ['manager', 'admin'].includes(userRole);
  const teamName = useTeamName(request.assignedTeam);
  const technicianName = useUserName(request.assignedTechnician);
  const createdByName = useUserName(request.createdBy);

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'New':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'In Progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'Repaired':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'Scrap':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-3xl font-bold">{request.subject}</h1>
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
              <StatusBadge status={request.status} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <Button variant="outline" onClick={() => onEdit(request)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canAssign && onAssign && (
            <Button variant="outline" onClick={() => onAssign(request)}>
              <UserCheck className="h-4 w-4 mr-2" />
              Assign
            </Button>
          )}
          {onStatusUpdate && !['Repaired', 'Scrap'].includes(request.status) && (
            <Button onClick={() => onStatusUpdate(request)}>
              <Wrench className="h-4 w-4 mr-2" />
              Update Status
            </Button>
          )}
          {canDelete && onDelete && (
            <Button variant="destructive" onClick={() => onDelete(request)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              {request.description ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.description}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided</p>
              )}
            </CardContent>
          </Card>

          {/* Equipment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Equipment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Equipment Name:</span>
                <span className="text-sm">{request.equipmentName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Category:</span>
                <Badge variant="outline">{request.equipmentCategory}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Equipment ID:</span>
                <span className="text-sm font-mono">{request.equipmentId}</span>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Assigned Team:</span>
                <span className="text-sm">
                  {request.assignedTeam ? (
                    teamName
                  ) : (
                    <span className="text-muted-foreground italic">Not assigned</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Assigned Technician:</span>
                <span className="text-sm">
                  {request.assignedTechnician ? (
                    technicianName
                  ) : (
                    <span className="text-muted-foreground italic">Not assigned</span>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {request.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(request.status)}
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">Created</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(request.createdAt)}
                    </div>
                  </div>
                </div>

                {request.startedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">Started</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(request.startedAt)}
                      </div>
                    </div>
                  </div>
                )}

                {request.completedAt && (
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        request.status === 'Repaired' ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {request.status === 'Repaired' ? 'Completed' : 'Scrapped'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(request.completedAt)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule & Duration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Schedule & Duration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {request.scheduledDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Scheduled:</span>
                  <span className="text-sm">{formatDateTime(request.scheduledDate)}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hours Spent:</span>
                <span className="text-sm">
                  {request.hoursSpent ? formatDuration(request.hoursSpent) : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Updated:</span>
                <span className="text-sm">{formatDateTime(request.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Request Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Request Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Request ID:</span>
                <span className="text-sm font-mono">{request.id}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Created By:</span>
                <span className="text-sm">{createdByName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Type:</span>
                <Badge variant="outline">{request.requestType}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priority:</span>
                <Badge
                  variant="outline"
                  className={`text-white ${getPriorityColor(request.priority)}`}
                >
                  {request.priority}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
