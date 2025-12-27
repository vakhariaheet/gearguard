import { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Wrench, Clock } from 'lucide-react';
import { useUpdateRequestStatus } from '../../hooks/useRequests';
import { useToast } from '../ui/use-toast';
import type { MaintenanceRequest, RequestStatus } from '../../types/requests';

interface StatusUpdateDialogProps {
  request: MaintenanceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_OPTIONS: { value: RequestStatus; label: string; description: string }[] = [
  {
    value: 'New',
    label: 'New',
    description: 'Request has been created and is awaiting assignment',
  },
  { value: 'In Progress', label: 'In Progress', description: 'Work has started on this request' },
  { value: 'Repaired', label: 'Repaired', description: 'Request has been completed successfully' },
  {
    value: 'Scrap',
    label: 'Scrap',
    description: 'Equipment cannot be repaired and needs replacement',
  },
];

export const StatusUpdateDialog = ({ request, open, onOpenChange }: StatusUpdateDialogProps) => {
  const [newStatus, setNewStatus] = useState<RequestStatus>('New');
  const [notes, setNotes] = useState('');
  const [hoursSpent, setHoursSpent] = useState<string>('');

  const updateStatusMutation = useUpdateRequestStatus();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!request) return;

    try {
      await updateStatusMutation.mutateAsync({
        requestId: request.id,
        data: {
          newStatus,
          notes: notes.trim() || undefined,
          hoursSpent: hoursSpent ? parseFloat(hoursSpent) : undefined,
        },
      });

      toast({
        title: 'Status updated',
        description: `Request status changed to ${newStatus}`,
      });

      // Reset form and close dialog
      setNewStatus('New');
      setNotes('');
      setHoursSpent('');
      onOpenChange(false);
    } catch (error) {
      console.error('Status update failed:', error);
      toast({
        title: 'Update failed',
        description: 'Failed to update request status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setNewStatus(request?.status || 'New');
      setNotes('');
      setHoursSpent('');
    } else if (request) {
      // Initialize form with current values when opening
      setNewStatus(request.status);
    }
    onOpenChange(open);
  };

  const getValidStatusTransitions = (currentStatus: RequestStatus): RequestStatus[] => {
    switch (currentStatus) {
      case 'New':
        return ['In Progress', 'Scrap'];
      case 'In Progress':
        return ['Repaired', 'Scrap'];
      case 'Repaired':
        return []; // Terminal state
      case 'Scrap':
        return []; // Terminal state
      default:
        return [];
    }
  };

  const validStatuses = request ? getValidStatusTransitions(request.status) : [];
  const isCompletionStatus = ['Repaired', 'Scrap'].includes(newStatus);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Update Request Status
          </DialogTitle>
          <DialogDescription>
            {validStatuses.length === 0
              ? `"${request?.subject}" is in a final state and cannot be changed.`
              : `Update the status of "${request?.subject}" and add any relevant notes.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="p-2 bg-muted rounded-md text-sm">{request?.status}</div>
          </div>

          {validStatuses.length === 0 ? (
            /* No valid transitions available */
            <div className="p-4 bg-muted rounded-md text-center">
              <p className="text-sm text-muted-foreground">
                This request is in a final state and cannot be changed.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {request?.status === 'Repaired'
                  ? 'The request has been completed successfully.'
                  : 'The equipment has been marked for scrap/replacement.'}
              </p>
            </div>
          ) : (
            <>
              {/* New Status */}
              <div className="space-y-2">
                <Label htmlFor="status">New Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value: RequestStatus) => setNewStatus(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.filter((option) => validStatuses.includes(option.value)).map(
                      (option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {option.description}
                            </div>
                          </div>
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Hours Spent (for completion statuses) */}
              {isCompletionStatus && (
                <div className="space-y-2">
                  <Label htmlFor="hours" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Hours Spent (optional)
                  </Label>
                  <Input
                    id="hours"
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="e.g., 2.5"
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(e.target.value)}
                  />
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any relevant notes about the status change..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateStatusMutation.isPending}
          >
            {validStatuses.length === 0 ? 'Close' : 'Cancel'}
          </Button>
          {validStatuses.length > 0 && (
            <Button
              onClick={handleSubmit}
              disabled={
                updateStatusMutation.isPending || !newStatus || newStatus === request?.status
              }
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
