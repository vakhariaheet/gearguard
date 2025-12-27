import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { RequestDetails } from '../../components/requests/RequestDetails';
import { StatusUpdateDialog } from '../../components/requests/StatusUpdateDialog';
import { AssignRequestDialog } from '../../components/requests/AssignRequestDialog';
import { AutoAssignmentPanel } from '../../components/requests/AutoAssignmentPanel';
import { WorkflowTimeline } from '../../components/requests/WorkflowTimeline';
import { SLATracker } from '../../components/requests/SLATracker';
import { EscalationManager } from '../../components/requests/EscalationManager';
import { useRequestDetails, useDeleteRequest } from '../../hooks/useRequests';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  AlertCircle,
  ArrowLeft,
  FileText,
  Zap,
  GitBranch,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import type { MaintenanceRequest } from '../../types/requests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Trash2 } from 'lucide-react';

export const RequestDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const deleteRequestMutation = useDeleteRequest();

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  const { data: requestResponse, isLoading, error } = useRequestDetails(id!);
  const request = requestResponse?.data;

  const userRole = (user?.publicMetadata?.role as string) || 'employee';

  const handleEdit = (request: MaintenanceRequest) => {
    navigate(`/requests/${request.id}/edit`);
  };

  const handleDelete = () => {
    setDeleteDialog(true);
  };

  const handleAssign = () => {
    setAssignDialog(true);
  };

  const handleStatusUpdate = () => {
    setStatusUpdateDialog(true);
  };

  const handleBack = () => {
    navigate('/requests');
  };

  const confirmDelete = async () => {
    if (!request) return;

    try {
      await deleteRequestMutation.mutateAsync(request.id);
      toast.success('The maintenance request has been deleted successfully.');
      navigate('/requests');
    } catch (error) {
      toast.error('Failed to delete the request. Please try again.');
    }
    setDeleteDialog(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Request Not Found</h3>
          <p className="text-muted-foreground mb-4">
            The requested maintenance request could not be found or you don't have permission to
            view it.
          </p>
          <Button onClick={handleBack}>Back to Requests</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{request.subject}</h1>
              <p className="text-muted-foreground">Request ID: {request.id}</p>
            </div>
          </div>
        </div>

        {/* M07 Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Details
            </TabsTrigger>
            <TabsTrigger value="auto-assign" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Auto-Assign
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="sla" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              SLA Tracking
            </TabsTrigger>
            <TabsTrigger value="escalation" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Escalation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <RequestDetails
              request={request}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onAssign={handleAssign}
              onStatusUpdate={handleStatusUpdate}
              userRole={userRole}
            />
          </TabsContent>

          <TabsContent value="auto-assign" className="mt-6">
            <AutoAssignmentPanel request={request} />
          </TabsContent>

          <TabsContent value="workflow" className="mt-6">
            <WorkflowTimeline requestId={request.id} />
          </TabsContent>

          <TabsContent value="sla" className="mt-6">
            <SLATracker requestId={request.id} />
          </TabsContent>

          <TabsContent value="escalation" className="mt-6">
            <EscalationManager requestId={request.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        request={request}
        open={statusUpdateDialog}
        onOpenChange={setStatusUpdateDialog}
      />

      {/* Assign Request Dialog */}
      <AssignRequestDialog request={request} open={assignDialog} onOpenChange={setAssignDialog} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the request "{request.subject}"? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteRequestMutation.isPending}
            >
              {deleteRequestMutation.isPending ? 'Deleting..' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
