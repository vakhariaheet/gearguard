import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  Calendar,
  Timer,
  TrendingUp,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import type { RequestWorkflow, WorkflowStep } from '@/types/requests';
interface WorkflowTimelineProps {
  requestId: string;
  onWorkflowUpdate?: (workflow: RequestWorkflow) => void;
}

export const WorkflowTimeline = ({ requestId, onWorkflowUpdate }: WorkflowTimelineProps) => {
  const [workflow, setWorkflow] = useState<RequestWorkflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchWorkflow = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);

    try {
      const token = localStorage.getItem('clerk-db-jwt');
      const response = await fetch(`/api/requests/${requestId}/workflow`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Check if response is HTML (404 page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!response.ok || !contentType?.includes('application/json')) {
        throw new Error('API not available');
      }

      const data = await response.json();
      setWorkflow(data.data);
      onWorkflowUpdate?.(data.data);
    } catch (error) {
      console.error('Failed to fetch workflow:', error);

      // Use mock workflow data for development
      const mockWorkflow = {
        requestId,
        currentStep: 'InProgress' as const,
        workflowHistory: [
          {
            step: 'Created',
            status: 'Completed' as const,
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
            duration: 5,
            assignedTo: 'System',
            notes: 'Request created automatically',
            automatedAction: true,
          },
          {
            step: 'Assigned',
            status: 'Completed' as const,
            startTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
            endTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            duration: 35,
            assignedTo: 'Auto-Assignment System',
            notes: 'Assigned to best available technician',
            automatedAction: true,
          },
          {
            step: 'InProgress',
            status: 'Active' as const,
            startTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            assignedTo: 'John Smith',
            notes: 'Technician started working on the issue',
            automatedAction: false,
          },
          {
            step: 'Review',
            status: 'Pending' as const,
            automatedAction: false,
          },
          {
            step: 'Completed',
            status: 'Pending' as const,
            automatedAction: false,
          },
        ],
        slaTracking: {
          responseTime: {
            target: 60,
            actual: 35,
            deadline: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
            isBreached: false,
            remainingTime: 25,
          },
          resolutionTime: {
            target: 240,
            deadline: new Date(Date.now() + 150 * 60 * 1000).toISOString(),
            isBreached: false,
            remainingTime: 150,
          },
          escalationTriggers: [
            {
              level: 1,
              triggerTime: 120,
              triggered: false,
            },
            {
              level: 2,
              triggerTime: 180,
              triggered: false,
            },
          ],
        },
        escalationRules: [
          {
            level: 1,
            triggerCondition: 'TimeElapsed' as const,
            triggerValue: 120,
            escalateTo: 'supervisor@company.com',
            notificationMethod: 'Email' as const,
            isActive: true,
          },
        ],
        assignmentHistory: [
          {
            assignedTo: 'john.smith@company.com',
            assignedBy: 'auto-assignment-system',
            assignedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            reason: 'Best skill match and availability',
            isAutoAssigned: true,
          },
        ],
        estimatedCompletion: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
      };

      setWorkflow(mockWorkflow);
      onWorkflowUpdate?.(mockWorkflow);
    } finally {
      setIsLoading(false);
      if (showRefreshIndicator) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
  }, [requestId]);

  const getStepIcon = (step: WorkflowStep) => {
    if (step.status === 'Completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (step.status === 'Active') {
      return <Clock className="h-5 w-5 text-blue-500" />;
    }
    if (step.status === 'Skipped') {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
  };

  const getStepStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Skipped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSLAStatusColor = (isBreached: boolean, remainingTime: number) => {
    if (isBreached) return 'text-red-600';
    if (remainingTime < 60) return 'text-yellow-600'; // Less than 1 hour
    return 'text-green-600';
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatTimeRemaining = (minutes: number) => {
    if (minutes <= 0) return 'Overdue';
    return formatDuration(minutes);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-sm text-muted-foreground">Loading workflow...</div>
        </CardContent>
      </Card>
    );
  }

  if (!workflow) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-lg font-medium mb-2">No Workflow Data</div>
          <div className="text-sm text-muted-foreground">
            Workflow tracking is not available for this request.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Workflow Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Workflow Progress
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchWorkflow(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-lg font-semibold">Current Step: {workflow.currentStep}</div>
              <div className="text-sm text-muted-foreground">
                Estimated completion: {new Date(workflow.estimatedCompletion).toLocaleString()}
              </div>
            </div>
            <Badge className={getStepStatusColor(workflow.currentStep)}>
              {workflow.currentStep}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>
                {Math.round(
                  (workflow.workflowHistory.filter((s) => s.status === 'Completed').length /
                    workflow.workflowHistory.length) *
                    100
                )}
                %
              </span>
            </div>
            <Progress
              value={
                (workflow.workflowHistory.filter((s) => s.status === 'Completed').length /
                  workflow.workflowHistory.length) *
                100
              }
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* SLA Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-orange-500" />
            SLA Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Response Time SLA */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Response Time</div>
                <Badge
                  variant={workflow.slaTracking.responseTime.isBreached ? 'destructive' : 'default'}
                >
                  {workflow.slaTracking.responseTime.isBreached ? 'BREACHED' : 'ON TRACK'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Target:</span>
                  <span>{formatDuration(workflow.slaTracking.responseTime.target)}</span>
                </div>
                {workflow.slaTracking.responseTime.actual && (
                  <div className="flex justify-between text-sm">
                    <span>Actual:</span>
                    <span>{formatDuration(workflow.slaTracking.responseTime.actual)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Remaining:</span>
                  <span
                    className={getSLAStatusColor(
                      workflow.slaTracking.responseTime.isBreached,
                      workflow.slaTracking.responseTime.remainingTime
                    )}
                  >
                    {formatTimeRemaining(workflow.slaTracking.responseTime.remainingTime)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Deadline: {new Date(workflow.slaTracking.responseTime.deadline).toLocaleString()}
                </div>
              </div>
            </div>

            {/* Resolution Time SLA */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium">Resolution Time</div>
                <Badge
                  variant={
                    workflow.slaTracking.resolutionTime.isBreached ? 'destructive' : 'default'
                  }
                >
                  {workflow.slaTracking.resolutionTime.isBreached ? 'BREACHED' : 'ON TRACK'}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Target:</span>
                  <span>{formatDuration(workflow.slaTracking.resolutionTime.target)}</span>
                </div>
                {workflow.slaTracking.resolutionTime.actual && (
                  <div className="flex justify-between text-sm">
                    <span>Actual:</span>
                    <span>{formatDuration(workflow.slaTracking.resolutionTime.actual)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Remaining:</span>
                  <span
                    className={getSLAStatusColor(
                      workflow.slaTracking.resolutionTime.isBreached,
                      workflow.slaTracking.resolutionTime.remainingTime
                    )}
                  >
                    {formatTimeRemaining(workflow.slaTracking.resolutionTime.remainingTime)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Deadline:{' '}
                  {new Date(workflow.slaTracking.resolutionTime.deadline).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflow.workflowHistory.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  {getStepIcon(step)}
                  {index < workflow.workflowHistory.length - 1 && (
                    <div className="w-px h-8 bg-gray-200 mt-2"></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-medium">{step.step}</div>
                    <Badge className={getStepStatusColor(step.status)}>{step.status}</Badge>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    {step.startTime && (
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Started: {new Date(step.startTime).toLocaleString()}
                      </div>
                    )}

                    {step.endTime && (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        Completed: {new Date(step.endTime).toLocaleString()}
                      </div>
                    )}

                    {step.duration && (
                      <div className="flex items-center gap-2">
                        <Timer className="h-3 w-3" />
                        Duration: {formatDuration(step.duration)}
                      </div>
                    )}

                    {step.assignedTo && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        Assigned to: {step.assignedTo}
                      </div>
                    )}

                    {step.automatedAction && (
                      <Badge variant="secondary" className="text-xs">
                        Automated
                      </Badge>
                    )}

                    {step.notes && (
                      <div className="text-xs bg-gray-50 p-2 rounded border">{step.notes}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Assignment History */}
      {workflow.assignmentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-500" />
              Assignment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflow.assignmentHistory.map((assignment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">Assigned to: {assignment.assignedTo}</div>
                    <div className="text-sm text-muted-foreground">
                      By: {assignment.assignedBy} •{' '}
                      {new Date(assignment.assignedAt).toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">{assignment.reason}</div>
                  </div>
                  {assignment.isAutoAssigned && <Badge variant="secondary">Auto-Assigned</Badge>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
