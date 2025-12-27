import { useNavigate } from 'react-router-dom';
import { SmartRequestForm } from '../../components/requests/SmartRequestForm';
import { useToast } from '../../components/ui/use-toast';
import { useCreateRequest } from '../../hooks/useRequests';
import type { CreateRequestRequest } from '../../types/requests';
import { Button } from '../../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const RequestCreatePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const createRequestMutation = useCreateRequest();

  const handleSubmit = async (requestData: CreateRequestRequest) => {
    try {
      const response = await createRequestMutation.mutateAsync(requestData);

      toast({
        title: 'Request created',
        description: 'Your maintenance request has been created successfully.',
      });

      // Navigate to the created request details
      navigate(`/requests/${response.data.id}`);
    } catch (error: any) {
      toast({
        title: 'Creation failed',
        description: error.message || 'Failed to create the request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleBack = () => {
    navigate('/requests');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Maintenance Request</h1>
          <p className="text-muted-foreground">
            Create a new maintenance request with AI-powered suggestions
          </p>
        </div>
      </div>

      {/* Form */}
      <SmartRequestForm onSubmit={handleSubmit} isLoading={createRequestMutation.isPending} />
    </div>
  );
};
