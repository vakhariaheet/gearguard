import { useNavigate } from 'react-router-dom';
import { SmartRequestForm } from '../../components/requests/SmartRequestForm';
import { toast } from 'sonner';
import { useCreateRequest } from '../../hooks/useRequests';
import type { CreateRequestRequest } from '../../types/requests';
import { Button } from '../../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const RequestCreatePage = () => {
  const navigate = useNavigate();
  const createRequestMutation = useCreateRequest();

  const handleSubmit = async (requestData: CreateRequestRequest) => {
    try {
      const response = await createRequestMutation.mutateAsync(requestData);

      toast.success('Your maintenance request has been created successfully.');

      // Navigate to the created request details
      navigate(`/requests/${response.data.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create the request. Please try again.');
    }
  };

  const handleBack = () => {
    navigate('/requests');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Request</h1>
            <p className="text-muted-foreground">Submit a new maintenance request with AI-powered suggestions</p>
          </div>
        </div>

        <SmartRequestForm onSubmit={handleSubmit} />
      </div>
    </div>
  );
};