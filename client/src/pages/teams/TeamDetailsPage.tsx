/**
 * TeamDetailsPage Component
 * Detailed view of a single team with member management
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Edit,
  UserPlus,
  UserMinus,
  Users,
  Settings,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { useTeam, useRemoveTeamMember, useAddTeamMember } from '@/hooks/useTeams';
import type { TeamMember, AddTeamMemberRequest } from '@/types/teams';
import { SkillBadges } from '@/components/teams/SkillBadges';
import { AddTeamMemberForm } from '@/components/teams/AddTeamMemberForm';

export const TeamDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [removingMember, setRemovingMember] = useState<TeamMember | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);

  const { data: teamResponse, isLoading, error } = useTeam(id!);
  const removeTeamMemberMutation = useRemoveTeamMember();
  const addTeamMemberMutation = useAddTeamMember();

  const team = teamResponse?.data;

  const handleBack = () => {
    navigate('/teams');
  };

  const handleEdit = () => {
    navigate(`/teams/${id}/edit`);
  };

  const handleAddMember = () => {
    setShowAddMemberForm(true);
  };

  const handleAddMemberSubmit = async (data: AddTeamMemberRequest) => {
    if (!id) return;

    try {
      await addTeamMemberMutation.mutateAsync({
        teamId: id,
        request: data,
      });
      setShowAddMemberForm(false);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    setRemovingMember(member);
  };

  const handleRemoveConfirm = async () => {
    if (!removingMember || !id) return;

    try {
      await removeTeamMemberMutation.mutateAsync({
        teamId: id,
        userId: removingMember.userId,
      });
      setRemovingMember(null);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      Lead: 'bg-purple-100 text-purple-800',
      Senior: 'bg-blue-100 text-blue-800',
      Junior: 'bg-green-100 text-green-800',
      Trainee: 'bg-yellow-100 text-yellow-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getSpecializationColor = (specialization: string) => {
    const colors: Record<string, string> = {
      Mechanics: 'bg-blue-100 text-blue-800',
      Electricians: 'bg-yellow-100 text-yellow-800',
      'IT Support': 'bg-purple-100 text-purple-800',
      HVAC: 'bg-green-100 text-green-800',
      General: 'bg-gray-100 text-gray-800',
      Facilities: 'bg-orange-100 text-orange-800',
    };
    return colors[specialization] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading team details...</span>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              {error ? 'Failed to load team details' : 'Team not found'}
            </p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Teams
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const workloadPercentage = team.maxCapacity
    ? Math.round((team.currentWorkload / team.maxCapacity) * 100)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Teams
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {team.teamName}
              {team.isActive ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </h1>
            <Badge
              variant="secondary"
              className={`mt-1 ${getSpecializationColor(team.specialization)}`}
            >
              {team.specialization}
            </Badge>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleAddMember} variant="outline">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Team
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Team Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Description</h4>
                  <p className="text-sm">{team.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-lg font-semibold">{team.members.length}</div>
                  <div className="text-xs text-muted-foreground">Members</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-lg font-semibold">{team.currentWorkload}</div>
                  <div className="text-xs text-muted-foreground">Active Requests</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-lg font-semibold">{team.maxCapacity || 10}</div>
                  <div className="text-xs text-muted-foreground">Max Capacity</div>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-lg font-semibold">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Created</div>
                </div>
              </div>

              {/* Workload Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Workload</span>
                  <span className="font-medium">
                    {workloadPercentage}% ({team.currentWorkload}/{team.maxCapacity || 10})
                  </span>
                </div>
                <Progress value={workloadPercentage} className="h-3" />
              </div>

              {/* Lead Technician */}
              {team.leadTechnician && (
                <div className="flex items-center gap-2 text-sm">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Team Lead:</span>
                  <span className="font-medium">
                    {team.members.find((m) => m.userId === team.leadTechnician)?.userName ||
                      'Unknown'}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Team Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <SkillBadges skills={team.skills} maxDisplay={20} />
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Team Members
                <Button onClick={handleAddMember} size="sm" variant="outline">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {team.members.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-4">No team members yet</p>
                  <Button onClick={handleAddMember} size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Member
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {team.members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.userName}`}
                          />
                          <AvatarFallback className="text-xs">
                            {member.userName
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-sm">{member.userName}</div>
                          <div className="text-xs text-muted-foreground">{member.email}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="secondary"
                              className={`text-xs ${getRoleColor(member.role)}`}
                            >
                              {member.role}
                            </Badge>
                            {member.currentRequests > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {member.currentRequests} active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Team Member Form */}
      <AddTeamMemberForm
        isOpen={showAddMemberForm}
        onClose={() => setShowAddMemberForm(false)}
        onSubmit={handleAddMemberSubmit}
        isLoading={addTeamMemberMutation.isPending}
      />

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={!!removingMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{removingMember?.userName}" from the team? This
              action cannot be undone and any assigned maintenance requests will need to be
              reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={removeTeamMemberMutation.isPending}
            >
              {removeTeamMemberMutation.isPending ? 'Removing...' : 'Remove Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
