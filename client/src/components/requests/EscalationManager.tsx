import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  AlertTriangle,
  User,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  Bell,
} from 'lucide-react';
import type { RequestWorkflow } from '@/types/requests';
import { toast } from 'sonner';

interface EscalationManagerProps {
  requestId: string;
  workflow?: RequestWorkflow;
  onEscalationComplete?: (workflow: RequestWorkflow) => void;
}

export const EscalationManager = ({
  requestId,
  workflow,
  onEscalationComplete,
}: EscalationManagerProps) => {
  const [isEscalating, setIsEscalating] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [escalationReason, setEscalationReason] = useState('');

  const handleEscalation = async () => {
    if (!escalationReason.trim()) {
      toast.error('Please provide a reason for escalation');
      return;
    }

    setIsEscalating(true);
    try {
      const token = localStorage.getItem('clerk-db-jwt');
      const response = await fetch(`/api/requests/${requestId}/escalate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          escalationLevel: selectedLevel,
          reason: escalationReason,
        }),
      });

      if (!response.ok) {
        // Check if response is HTML (404 page) instead of JSON
        const contentType = response.headers.get('content-type');
        if (!contentType?.includes('application/json')) {
          toast.success(`Demo: Request escalated to level ${selectedLevel} (API not available)`);
          setEscalationReason('');
          setSelectedLevel(1);
          return;
        }

        const error = await response.json();
        throw new Error(error.error?.message || 'Escalation failed');
      }

      const data = await response.json();
      onEscalationComplete?.(data.data);

      toast.success(`Request escalated to level ${selectedLevel}`);

      // Reset form
      setEscalationReason('');
      setSelectedLevel(1);
    } catch (error) {
      console.error('Escalation failed:', error);

      // If it's a network error, simulate escalation
      if (
        (error as any)?.message?.includes('fetch') ||
        (error as any)?.message?.includes('Failed to fetch')
      ) {
        toast.success(`Demo: Request escalated to level ${selectedLevel} (API not available)`);
        setEscalationReason('');
        setSelectedLevel(1);
      } else {
        toast.error((error as any)?.message || 'Failed to escalate request');
      }
    } finally {
      setIsEscalating(false);
    }
  };

  const getNotificationIcon = (method: string) => {
    switch (method) {
      case 'Email':
        return <Mail className="h-4 w-4" />;
      case 'SMS':
        return <MessageSquare className="h-4 w-4" />;
      case 'Push':
        return <Bell className="h-4 w-4" />;
      case 'Phone':
        return <Phone className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getEscalationLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 2:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 3:
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEscalationLevelDescription = (level: number) => {
    switch (level) {
      case 1:
        return 'Team Lead - First level escalation for guidance and support';
      case 2:
        return 'Manager - Second level escalation for resource allocation';
      case 3:
        return 'Director - Critical escalation requiring executive attention';
      default:
        return 'Unknown escalation level';
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Current Escalation Status */}
      {workflow?.currentStep === 'Escalated' && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This request has been escalated and is currently under review by management.
          </AlertDescription>
        </Alert>
      )}

      {/* Manual Escalation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Manual Escalation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="escalation-level">Escalation Level</Label>
              <Select
                value={selectedLevel.toString()}
                onValueChange={(value) => setSelectedLevel(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select escalation level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1 - Team Lead</SelectItem>
                  <SelectItem value="2">Level 2 - Manager</SelectItem>
                  <SelectItem value="3">Level 3 - Director</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-muted-foreground">
                {getEscalationLevelDescription(selectedLevel)}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Escalation Impact</Label>
              <div className="p-3 border rounded-lg">
                <Badge className={getEscalationLevelColor(selectedLevel)}>
                  Level {selectedLevel}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">
                  {selectedLevel === 1 && 'Standard escalation process'}
                  {selectedLevel === 2 && 'Requires management approval'}
                  {selectedLevel === 3 && 'Executive attention required'}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="escalation-reason">Reason for Escalation</Label>
            <Textarea
              id="escalation-reason"
              placeholder="Describe why this request needs to be escalated..."
              value={escalationReason}
              onChange={(e) => setEscalationReason(e.target.value)}
              rows={3}
            />
          </div>

          <Button
            onClick={handleEscalation}
            disabled={isEscalating || !escalationReason.trim()}
            className="w-full"
            variant="destructive"
          >
            {isEscalating ? 'Escalating...' : `Escalate to Level ${selectedLevel}`}
          </Button>
        </CardContent>
      </Card>

      {/* Escalation Rules */}
      {workflow?.escalationRules && workflow.escalationRules.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Automatic Escalation Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflow.escalationRules.map((rule, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge className={getEscalationLevelColor(rule.level)}>
                        Level {rule.level}
                      </Badge>
                      <span className="font-medium">Auto-Escalation Rule</span>
                    </div>
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Trigger Condition</span>
                      </div>
                      <div className="text-muted-foreground">
                        {rule.triggerCondition === 'TimeElapsed' &&
                          `After ${formatDuration(rule.triggerValue)}`}
                        {rule.triggerCondition === 'SLABreach' && 'When SLA is breached'}
                        {rule.triggerCondition === 'NoResponse' && 'No response received'}
                        {rule.triggerCondition === 'HighPriority' && 'High priority request'}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Escalate To</span>
                      </div>
                      <div className="text-muted-foreground capitalize">{rule.escalateTo}</div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {getNotificationIcon(rule.notificationMethod)}
                        <span className="font-medium">Notification Method</span>
                      </div>
                      <div className="text-muted-foreground">{rule.notificationMethod}</div>
                    </div>

                    {rule.lastTriggered && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Last Triggered</span>
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(rule.lastTriggered).toLocaleString()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Escalation History */}
      {workflow?.workflowHistory && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Escalation History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {workflow.workflowHistory
                .filter((step) => step.step.includes('Escalated'))
                .map((step, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{step.step}</div>
                      <div className="text-sm text-muted-foreground">
                        {step.startTime && `Started: ${new Date(step.startTime).toLocaleString()}`}
                      </div>
                      {step.notes && (
                        <div className="text-sm text-muted-foreground mt-1">{step.notes}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge variant={step.status === 'Completed' ? 'default' : 'secondary'}>
                        {step.status}
                      </Badge>
                      {step.automatedAction && (
                        <div className="text-xs text-muted-foreground mt-1">Automated</div>
                      )}
                    </div>
                  </div>
                ))}

              {workflow.workflowHistory.filter((step) => step.step.includes('Escalated')).length ===
                0 && (
                <div className="text-center py-6 text-muted-foreground">
                  No escalations have occurred for this request.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
