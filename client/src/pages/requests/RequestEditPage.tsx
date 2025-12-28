import { useParams, useNavigate } from 'react-router-dom';
import { RequestForm } from '../../components/requests/RequestForm';
import { useRequestDetails, useUpdateRequest } from '../../hooks/useRequests';
import { toast } from 'sonner';
import { Card, CardContent } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import type { UpdateRequestRequest } from '../../types/requests';

export const RequestEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const updateRequestMutation = useUpdateRequest();

  const { data: requestResponse, isLoading, error } = useRequestDetails(id!);
  const request = requestResponse?.data;

  const handleSubmit = async (requestData: UpdateRequestRequest) => {
    if (!id) return;

    try {
      await updateRequestMutation.mutateAsync({
        requestId: id,
        data: requestData,
      });

      toast.success('The maintenance request has been updated successfully.');

      // Navigate back to request details
      navigate(`/requests/${id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update the request. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(`/requests/${id}`);
  };

  const handleBack = () => {
    navigate(`/requests/${id}`);
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

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Request</h1>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Request Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The requested maintenance request could not be found or you don't have permission to
              edit it.
            </p>
            <Button onClick={() => navigate('/requests')}>Back to Requests</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if request can be edited
  const canEdit = !['Repaired', 'Scrap'].includes(request.status);

  if (!canEdit) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Edit Request</h1>
          </div>
        </div>

        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Cannot Edit Request</h3>
            <p className="text-muted-foreground mb-4">
              This request cannot be edited because it has been completed or scrapped.
            </p>
            <Button onClick={handleBack}>Back to Request</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Request</h1>
          <p className="text-muted-foreground">Update the details of "{request.subject}"</p>
        </div>
      </div>

      {/* Form */}
      <RequestForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        isLoading={updateRequestMutation.isPending}
        initialData={request}
        mode="edit"
      />
    </div>
  );
};
