import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TeamForm } from '@/components/teams/TeamForm';
import { teamsApi } from '@/services/teamsApi';
import type { UpdateTeamRequest } from '@/types/teams';
import { toast } from 'sonner';

export function TeamEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch team data
  const {
    data: teamResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getTeam(id!),
    enabled: !!id,
  });

  const team = teamResponse?.data;

  // Update team mutation
  const updateTeamMutation = useMutation({
    mutationFn: (request: UpdateTeamRequest) => teamsApi.updateTeam(id!, request),
    onSuccess: () => {
      toast.success('Team updated successfully');
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      queryClient.invalidateQueries({ queryKey: ['team', id] });
      navigate(`/teams/${id}`);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update team');
    },
  });

  const handleSubmit = async (data: UpdateTeamRequest) => {
    await updateTeamMutation.mutateAsync(data);
  };

  const handleCancel = () => {
    navigate(`/teams/${id}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading team...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load team</p>
            <Button onClick={() => navigate('/teams')} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button onClick={() => navigate(`/teams/${id}`)} variant="ghost" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Team Details
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Team</h1>
        <p className="text-gray-600 mt-2">Update team information and settings</p>
      </div>

      <div className="max-w-4xl">
        <TeamForm
          team={team}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={updateTeamMutation.isPending}
        />
      </div>
    </div>
  );
}
