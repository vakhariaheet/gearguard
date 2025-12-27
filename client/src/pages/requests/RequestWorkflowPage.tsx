import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Settings, TrendingUp, Target, Users, AlertTriangle, Clock } from 'lucide-react';
import type { MaintenanceRequest, RequestWorkflow } from '@/types/requests';
import { AutoAssignmentPanel } from '@/components/requests/AutoAssignmentPanel';
import { WorkflowTimeline } from '@/components/requests/WorkflowTimeline';
import { SLATracker } from '@/components/requests/SLATracker';
import { EscalationManager } from '@/components/requests/EscalationManager';
import { toast } from 'sonner';

export const RequestWorkflowPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [workflow, setWorkflow] = useState<RequestWorkflow | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRequestData();
    }
  }, [id]);

  const fetchRequestData = async () => {
    try {
      const token = localStorage.getItem('clerk-db-jwt');

      // Fetch request details
      const requestResponse = await fetch(`/api/requests/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!requestResponse.ok) {
        throw new Error('Failed to fetch request');
      }

      const requestData = await requestResponse.json();
      setRequest(requestData.data);

      // Fetch workflow data
      const workflowResponse = await fetch(`/api/requests/${id}/workflow`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (workflowResponse.ok) {
        const workflowData = await workflowResponse.json();
        setWorkflow(workflowData.data);
      }
    } catch (error) {
      console.error('Failed to fetch request data:', error);
      toast.error('Failed to load request data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleWorkflowUpdate = (updatedWorkflow: RequestWorkflow) => {
    setWorkflow(updatedWorkflow);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Repaired':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Scrap':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <div className="text-lg font-medium">Loading request workflow...</div>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="text-lg font-medium mb-2">Request Not Found</div>
          <div className="text-sm text-muted-foreground mb-4">
            The requested maintenance request could not be found.
          </div>
          <Button onClick={() => navigate('/requests')}>Back to Requests</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/requests')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Advanced Workflow Management</h1>
            <p className="text-muted-foreground">Request #{request.id}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => navigate(`/requests/${id}/edit`)}>
          <Settings className="h-4 w-4 mr-2" />
          Edit Request
        </Button>
      </div>

      {/* Request Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{request.subject}</span>
            <div className="flex items-center gap-2">
              <Badge className={getPriorityColor(request.priority)}>{request.priority}</Badge>
              <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Equipment</div>
              <div className="font-medium">{request.equipmentName}</div>
              <div className="text-sm text-muted-foreground">{request.equipmentCategory}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Assigned Team</div>
              <div className="font-medium">{request.assignedTeam || 'Unassigned'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Technician</div>
              <div className="font-medium">{request.assignedTechnician || 'Unassigned'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created</div>
              <div className="font-medium">{new Date(request.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          {request.description && (
            <div className="mt-4">
              <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
              <div className="text-sm">{request.description}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workflow Management Tabs */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="assignment" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Auto-Assignment
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            SLA Tracking
          </TabsTrigger>
          <TabsTrigger value="escalation" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Escalation
          </TabsTrigger>
          <TabsTrigger value="workflow" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Workflow
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <WorkflowTimeline requestId={request.id} onWorkflowUpdate={handleWorkflowUpdate} />
        </TabsContent>

        <TabsContent value="assignment">
          <AutoAssignmentPanel
            request={request}
            onAssignmentComplete={() => {
              // Refresh request data after assignment
              fetchRequestData();
            }}
          />
        </TabsContent>

        <TabsContent value="sla">
          {workflow?.slaTracking ? (
            <SLATracker
              requestId={request.id}
              slaTracking={workflow.slaTracking}
              onSLAUpdate={(updatedSLA) => {
                if (workflow) {
                  setWorkflow({ ...workflow, slaTracking: updatedSLA });
                }
              }}
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-medium mb-2">SLA Tracking Not Available</div>
                <div className="text-sm text-muted-foreground">
                  SLA tracking will be available once the workflow is initialized.
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="escalation">
          <EscalationManager
            requestId={request.id}
            workflow={workflow || undefined}
            onEscalationComplete={handleWorkflowUpdate}
          />
        </TabsContent>

        <TabsContent value="workflow">
          {workflow ? (
            <Card>
              <CardHeader>
                <CardTitle>Workflow Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Current Step</div>
                      <div className="font-medium">{workflow.currentStep}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">
                        Estimated Completion
                      </div>
                      <div className="font-medium">
                        {new Date(workflow.estimatedCompletion).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-2">
                      Workflow Steps
                    </div>
                    <div className="space-y-2">
                      {workflow.workflowHistory.map((step, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <span>{step.step}</span>
                          <Badge variant={step.status === 'Completed' ? 'default' : 'secondary'}>
                            {step.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="text-lg font-medium mb-2">Workflow Not Initialized</div>
                <div className="text-sm text-muted-foreground mb-4">
                  Initialize workflow tracking to access advanced features.
                </div>
                <Button onClick={fetchRequestData}>Initialize Workflow</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
