import { useParams, useNavigate } from 'react-router-dom';
import { RequestDetails } from '../../components/requests/RequestDetails';
import { StatusUpdateDialog } from '../../components/requests/StatusUpdateDialog';
import { AssignRequestDialog } from '../../components/requests/AssignRequestDialog';
import { useRequestDetails, useDeleteRequest } from '../../hooks/useRequests';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '../../components/ui/use-toast';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import type { MaintenanceRequest } from '../../types/requests';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';

export const RequestDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const deleteRequestMutation = useDeleteRequest();

  const [deleteDialog, setDeleteDialog] = useState(false);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [assignDialog, setAssignDialog] = useState(false);

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
      toast({
        title: 'Request deleted',
        description: 'The maintenance request has been deleted successfully.',
      });
      navigate('/requests');
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the request. Please try again.',
        variant: 'destructive',
      });
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
      <RequestDetails
        request={request}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAssign={handleAssign}
        onStatusUpdate={handleStatusUpdate}
        onBack={handleBack}
        userRole={userRole}
      />

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
