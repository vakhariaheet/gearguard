import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle, CheckCircle, TrendingUp, AlertCircle, Target } from 'lucide-react';
import type { SLATracking } from '@/types/requests';
import { toast } from 'sonner';

interface SLATrackerProps {
  requestId: string;
  slaTracking?: SLATracking;
  onSLAUpdate?: (sla: SLATracking) => void;
}

export const SLATracker = ({
  requestId,
  slaTracking: initialSlaTracking,
  onSLAUpdate,
}: SLATrackerProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [slaTracking, setSlaTracking] = useState<SLATracking | null>(initialSlaTracking || null);
  const [isLoading, setIsLoading] = useState(!initialSlaTracking);

  // Fetch SLA tracking data if not provided
  useEffect(() => {
    if (!initialSlaTracking) {
      fetchSLATracking();
    }
  }, [requestId, initialSlaTracking]);

  const fetchSLATracking = async () => {
    try {
      setIsLoading(true);
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
      setSlaTracking(data.data.slaTracking);
    } catch (error) {
      console.error('Failed to fetch SLA tracking:', error);

      // Use mock SLA data for development
      const mockSlaTracking = {
        responseTime: {
          target: 60, // 1 hour
          actual: 35,
          deadline: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
          isBreached: false,
          remainingTime: 25,
        },
        resolutionTime: {
          target: 240, // 4 hours
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
      };

      setSlaTracking(mockSlaTracking);
      toast.success('Using demo SLA data (API not available)');
    } finally {
      setIsLoading(false);
    }
  };

  // Update current time every minute for real-time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const markResponseComplete = async () => {
    setIsUpdating(true);
    try {
      const responseTime = Math.round(
        (currentTime.getTime() -
          new Date(slaTracking.responseTime.deadline).getTime() +
          slaTracking.responseTime.target * 60000) /
          60000
      );

      const token = localStorage.getItem('clerk-db-jwt');
      const response = await fetch(`/api/requests/${requestId}/sla`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          responseTime: {
            ...slaTracking.responseTime,
            actual: responseTime,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update SLA');
      }

      const data = await response.json();
      onSLAUpdate?.(data.data);

      toast.success('Response time recorded successfully');
    } catch (error) {
      console.error('Failed to update SLA:', error);
      toast.error('Failed to update SLA tracking');
    } finally {
      setIsUpdating(false);
    }
  };

  const markResolutionComplete = async () => {
    setIsUpdating(true);
    try {
      const resolutionTime = Math.round(
        (currentTime.getTime() -
          new Date(slaTracking.resolutionTime.deadline).getTime() +
          slaTracking.resolutionTime.target * 60000) /
          60000
      );

      const token = localStorage.getItem('clerk-db-jwt');
      const response = await fetch(`/api/requests/${requestId}/sla`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resolutionTime: {
            ...slaTracking.resolutionTime,
            actual: resolutionTime,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update SLA');
      }

      const data = await response.json();
      onSLAUpdate?.(data.data);

      toast.success('Resolution time recorded successfully');
    } catch (error) {
      console.error('Failed to update SLA:', error);
      toast.error('Failed to update SLA tracking');
    } finally {
      setIsUpdating(false);
    }
  };

  const calculateRemainingTime = (deadline: string) => {
    const deadlineTime = new Date(deadline).getTime();
    const now = currentTime.getTime();
    const remaining = Math.max(0, Math.round((deadlineTime - now) / 60000)); // minutes
    return remaining;
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

  const getSLAStatusColor = (isBreached: boolean, remainingTime: number) => {
    if (isBreached) return 'text-red-600';
    if (remainingTime < 60) return 'text-yellow-600'; // Less than 1 hour
    return 'text-green-600';
  };

  const calculateProgress = (remainingTime: number, target: number) => {
    const elapsed = target - remainingTime;
    return Math.min(100, Math.max(0, (elapsed / target) * 100));
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-sm text-muted-foreground">Loading SLA tracking...</div>
        </CardContent>
      </Card>
    );
  }

  // No SLA data
  if (!slaTracking) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-sm text-muted-foreground">No SLA tracking data available</div>
        </CardContent>
      </Card>
    );
  }

  // Calculate real-time remaining times
  const responseRemainingTime = slaTracking.responseTime.actual
    ? slaTracking.responseTime.remainingTime
    : calculateRemainingTime(slaTracking.responseTime.deadline);

  const resolutionRemainingTime = slaTracking.resolutionTime.actual
    ? slaTracking.resolutionTime.remainingTime
    : calculateRemainingTime(slaTracking.resolutionTime.deadline);

  // Check for breaches
  const responseBreached = slaTracking.responseTime.isBreached || responseRemainingTime <= 0;
  const resolutionBreached = slaTracking.resolutionTime.isBreached || resolutionRemainingTime <= 0;

  return (
    <div className="space-y-6">
      {/* SLA Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            SLA Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Response Time SLA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Response Time</span>
                </div>
                <Badge variant={responseBreached ? 'destructive' : 'default'}>
                  {responseBreached ? 'BREACHED' : 'ON TRACK'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Target:</span>
                  <span>{formatDuration(slaTracking.responseTime.target)}</span>
                </div>

                {slaTracking.responseTime.actual ? (
                  <div className="flex justify-between text-sm">
                    <span>Actual:</span>
                    <span
                      className={
                        slaTracking.responseTime.actual <= slaTracking.responseTime.target
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {formatDuration(slaTracking.responseTime.actual)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Remaining:</span>
                      <span className={getSLAStatusColor(responseBreached, responseRemainingTime)}>
                        {formatTimeRemaining(responseRemainingTime)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <Progress
                        value={calculateProgress(
                          responseRemainingTime,
                          slaTracking.responseTime.target
                        )}
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        Deadline: {new Date(slaTracking.responseTime.deadline).toLocaleString()}
                      </div>
                    </div>

                    <Button
                      onClick={markResponseComplete}
                      disabled={isUpdating}
                      size="sm"
                      className="w-full"
                    >
                      {isUpdating ? 'Updating...' : 'Mark Response Complete'}
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Resolution Time SLA */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Resolution Time</span>
                </div>
                <Badge variant={resolutionBreached ? 'destructive' : 'default'}>
                  {resolutionBreached ? 'BREACHED' : 'ON TRACK'}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Target:</span>
                  <span>{formatDuration(slaTracking.resolutionTime.target)}</span>
                </div>

                {slaTracking.resolutionTime.actual ? (
                  <div className="flex justify-between text-sm">
                    <span>Actual:</span>
                    <span
                      className={
                        slaTracking.resolutionTime.actual <= slaTracking.resolutionTime.target
                          ? 'text-green-600'
                          : 'text-red-600'
                      }
                    >
                      {formatDuration(slaTracking.resolutionTime.actual)}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-sm">
                      <span>Remaining:</span>
                      <span
                        className={getSLAStatusColor(resolutionBreached, resolutionRemainingTime)}
                      >
                        {formatTimeRemaining(resolutionRemainingTime)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <Progress
                        value={calculateProgress(
                          resolutionRemainingTime,
                          slaTracking.resolutionTime.target
                        )}
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        Deadline: {new Date(slaTracking.resolutionTime.deadline).toLocaleString()}
                      </div>
                    </div>

                    <Button
                      onClick={markResolutionComplete}
                      disabled={isUpdating}
                      size="sm"
                      className="w-full"
                    >
                      {isUpdating ? 'Updating...' : 'Mark Resolution Complete'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SLA Alerts */}
      {(responseBreached ||
        resolutionBreached ||
        responseRemainingTime < 60 ||
        resolutionRemainingTime < 60) && (
        <div className="space-y-3">
          {responseBreached && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Response time SLA has been breached. Immediate attention required.
              </AlertDescription>
            </Alert>
          )}

          {resolutionBreached && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Resolution time SLA has been breached. Escalation may be required.
              </AlertDescription>
            </Alert>
          )}

          {!responseBreached && responseRemainingTime < 60 && responseRemainingTime > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Response time SLA deadline approaching. Less than 1 hour remaining.
              </AlertDescription>
            </Alert>
          )}

          {!resolutionBreached && resolutionRemainingTime < 60 && resolutionRemainingTime > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Resolution time SLA deadline approaching. Less than 1 hour remaining.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {/* Escalation Triggers */}
      {slaTracking.escalationTriggers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              Escalation Triggers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {slaTracking.escalationTriggers.map((trigger, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">Level {trigger.level} Escalation</div>
                    <div className="text-sm text-muted-foreground">
                      Trigger time: {formatDuration(trigger.triggerTime)}
                    </div>
                    {trigger.triggeredAt && (
                      <div className="text-sm text-muted-foreground">
                        Triggered: {new Date(trigger.triggeredAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                  <Badge variant={trigger.triggered ? 'destructive' : 'secondary'}>
                    {trigger.triggered ? 'TRIGGERED' : 'PENDING'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
