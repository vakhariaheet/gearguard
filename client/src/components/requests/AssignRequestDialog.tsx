import { useState } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { UserCheck, Users, User } from 'lucide-react';
import { useAssignRequest } from '../../hooks/useRequests';
import { useTeams } from '../../hooks/useTeams';
import { toast } from 'sonner';
import { useUserName } from '../../hooks/useUserName';
import type { MaintenanceRequest } from '../../types/requests';

interface AssignRequestDialogProps {
  request: MaintenanceRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AssignRequestDialog = ({ request, open, onOpenChange }: AssignRequestDialogProps) => {
  const [assignedTeam, setAssignedTeam] = useState<string>('');
  const [assignedTechnician, setAssignedTechnician] = useState<string>('');

  const assignRequestMutation = useAssignRequest();
  const { data: teamsResponse, isLoading: teamsLoading } = useTeams({ isActive: true });
  const currentTechnicianName = useUserName(request?.assignedTechnician);

  const teams = teamsResponse?.data?.teams || [];

  const handleSubmit = async () => {
    if (!request) return;

    // Validate that at least one assignment is provided
    if (!assignedTeam && !assignedTechnician) {
      toast.error('Please select either a team or technician to assign the request.');
      return;
    }

    try {
      await assignRequestMutation.mutateAsync({
        requestId: request.id,
        data: {
          assignedTeam: assignedTeam || undefined,
          assignedTechnician: assignedTechnician || undefined,
        },
      });

      toast.success('Request has been assigned successfully.');

      // Reset form and close dialog
      setAssignedTeam('');
      setAssignedTechnician('');
      onOpenChange(false);
    } catch (error) {
      console.error('Assignment failed:', error);
      toast.error('Failed to assign request. Please try again.');
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setAssignedTeam('');
      setAssignedTechnician('');
    } else if (request) {
      // Initialize form with current values when opening
      setAssignedTeam(request.assignedTeam || '');
      setAssignedTechnician(request.assignedTechnician || '');
    }
    onOpenChange(open);
  };

  // Check if request is in a terminal state
  const isTerminalState = request && ['Repaired', 'Scrap'].includes(request.status);

  // Get available technicians from selected team
  const selectedTeam = teams.find((team) => team.id === assignedTeam);
  const availableTechnicians = selectedTeam?.members || [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Assign Request
          </DialogTitle>
          <DialogDescription>
            {isTerminalState
              ? `"${request?.subject}" is completed and cannot be reassigned.`
              : `Assign "${request?.subject}" to a team or specific technician.`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Assignment */}
          {(request?.assignedTeam || request?.assignedTechnician) && (
            <div className="space-y-2">
              <Label>Current Assignment</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                {request.assignedTeam && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      Team:{' '}
                      {teams.find((t) => t.id === request.assignedTeam)?.teamName || 'Unknown'}
                    </span>
                  </div>
                )}
                {request.assignedTechnician && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Technician: {currentTechnicianName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {isTerminalState ? (
            /* Terminal state message */
            <div className="p-4 bg-muted rounded-md text-center">
              <p className="text-sm text-muted-foreground">
                This request has been completed and cannot be reassigned.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {request?.status === 'Repaired'
                  ? 'The request has been completed successfully.'
                  : 'The equipment has been marked for scrap/replacement.'}
              </p>
            </div>
          ) : (
            <>
              {/* Team Assignment */}
              <div className="space-y-2">
                <Label htmlFor="team" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assign to Team
                </Label>
                <Select
                  value={assignedTeam}
                  onValueChange={(value) => {
                    setAssignedTeam(value === 'none' ? '' : value);
                    // Clear technician when team changes
                    if (value !== assignedTeam) {
                      setAssignedTechnician('');
                    }
                  }}
                  disabled={teamsLoading}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={teamsLoading ? 'Loading teams...' : 'Select a team'}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No team assignment</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div>
                          <div className="font-medium">{team.teamName}</div>
                          <div className="text-xs text-muted-foreground">
                            {team.specialization} • {team.members.length} members • Workload:{' '}
                            {team.currentWorkload}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Technician Assignment */}
              <div className="space-y-2">
                <Label htmlFor="technician" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assign to Technician (Optional)
                </Label>
                <Select
                  value={assignedTechnician}
                  onValueChange={(value) => setAssignedTechnician(value === 'none' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        assignedTeam && availableTechnicians.length === 0
                          ? 'No technicians in selected team'
                          : 'Select a technician (optional)'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific technician</SelectItem>
                    {assignedTeam
                      ? // Show technicians from selected team
                        availableTechnicians.map((member) => (
                          <SelectItem key={member.userId} value={member.userId}>
                            <div>
                              <div className="font-medium">{member.userName}</div>
                              <div className="text-xs text-muted-foreground">
                                {member.role} • {member.currentRequests} active requests
                                {member.skills && member.skills.length > 0 && (
                                  <span> • {member.skills.slice(0, 2).join(', ')}</span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      : // Show all technicians from all teams when no team is selected
                        teams.flatMap((team) =>
                          team.members.map((member) => (
                            <SelectItem key={member.userId} value={member.userId}>
                              <div>
                                <div className="font-medium">{member.userName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {team.teamName} • {member.role} • {member.currentRequests} active
                                  requests
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                  </SelectContent>
                </Select>
                {assignedTechnician && !assignedTeam && (
                  <p className="text-xs text-muted-foreground">
                    💡 Consider also selecting the technician's team for better coordination
                  </p>
                )}
              </div>

              {/* Assignment Info */}
              <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                <p className="font-medium mb-1">Assignment Options:</p>
                <ul className="space-y-1">
                  <li>
                    • <strong>Team only:</strong> Work distributed among team members
                  </li>
                  <li>
                    • <strong>Technician only:</strong> Direct assignment to individual
                  </li>
                  <li>
                    • <strong>Both:</strong> Assigned to team with specific technician lead
                  </li>
                  <li>• Status will automatically change to "In Progress" when assigned</li>
                </ul>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={assignRequestMutation.isPending}
          >
            {isTerminalState ? 'Close' : 'Cancel'}
          </Button>
          {!isTerminalState && (
            <Button
              onClick={handleSubmit}
              disabled={
                assignRequestMutation.isPending ||
                (!assignedTeam && !assignedTechnician) ||
                (assignedTeam === (request?.assignedTeam || '') &&
                  assignedTechnician === (request?.assignedTechnician || ''))
              }
            >
              {assignRequestMutation.isPending ? 'Assigning...' : 'Assign Request'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
