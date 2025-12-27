import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RequestList } from '../../components/requests/RequestList';
import { StatusUpdateDialog } from '../../components/requests/StatusUpdateDialog';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '../../components/ui/use-toast';
import { useDeleteRequest } from '../../hooks/useRequests';
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

export const RequestListPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { toast } = useToast();
  const deleteRequestMutation = useDeleteRequest();

  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    request: MaintenanceRequest | null;
  }>({
    open: false,
    request: null,
  });

  const [statusUpdateDialog, setStatusUpdateDialog] = useState<{
    open: boolean;
    request: MaintenanceRequest | null;
  }>({
    open: false,
    request: null,
  });

  const userRole = (user?.publicMetadata?.role as string) || 'employee';

  const handleCreateRequest = () => {
    navigate('/requests/create');
  };

  const handleEditRequest = (request: MaintenanceRequest) => {
    navigate(`/requests/${request.id}/edit`);
  };

  const handleViewRequest = (request: MaintenanceRequest) => {
    navigate(`/requests/${request.id}`);
  };

  const handleDeleteRequest = (request: MaintenanceRequest) => {
    setDeleteDialog({ open: true, request });
  };

  const handleAssignRequest = (request: MaintenanceRequest) => {
    navigate(`/requests/${request.id}/assign`);
  };

  const handleStatusUpdate = (request: MaintenanceRequest) => {
    setStatusUpdateDialog({ open: true, request });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.request) return;

    try {
      await deleteRequestMutation.mutateAsync(deleteDialog.request.id);
      toast({
        title: 'Request deleted',
        description: 'The maintenance request has been deleted successfully.',
      });
      setDeleteDialog({ open: false, request: null });
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <RequestList
        onCreateRequest={handleCreateRequest}
        onEditRequest={handleEditRequest}
        onDeleteRequest={handleDeleteRequest}
        onAssignRequest={handleAssignRequest}
        onStatusUpdate={handleStatusUpdate}
        onViewRequest={handleViewRequest}
        userRole={userRole}
        showCreateButton={true}
      />

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        request={statusUpdateDialog.request}
        open={statusUpdateDialog.open}
        onOpenChange={(open) =>
          setStatusUpdateDialog({ open, request: open ? statusUpdateDialog.request : null })
        }
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, request: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Request
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the request "{deleteDialog.request?.subject}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, request: null })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteRequestMutation.isPending}
            >
              {deleteRequestMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
