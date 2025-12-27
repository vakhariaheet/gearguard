/**
 * TeamListPage Component
 * Main page for listing and managing teams
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeamList } from '@/components/teams/TeamList';
import { TeamForm } from '@/components/teams/TeamForm';
import { AddTeamMemberForm } from '@/components/teams/AddTeamMemberForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { useCreateTeam, useUpdateTeam, useDeleteTeam, useAddTeamMember } from '@/hooks/useTeams';
import type {
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  AddTeamMemberRequest,
} from '@/types/teams';

export const TeamListPage = () => {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [addingMemberToTeam, setAddingMemberToTeam] = useState<Team | null>(null);

  const createTeamMutation = useCreateTeam();
  const updateTeamMutation = useUpdateTeam();
  const deleteTeamMutation = useDeleteTeam();
  const addTeamMemberMutation = useAddTeamMember();

  const handleCreateTeam = () => {
    setShowCreateDialog(true);
  };

  const handleViewTeam = (team: Team) => {
    navigate(`/teams/${team.id}`);
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
  };

  const handleDeleteTeam = (team: Team) => {
    setDeletingTeam(team);
  };

  const handleAddMember = (team: Team) => {
    setAddingMemberToTeam(team);
  };

  const handleAddMemberSubmit = async (data: AddTeamMemberRequest) => {
    if (!addingMemberToTeam) return;

    try {
      await addTeamMemberMutation.mutateAsync({
        teamId: addingMemberToTeam.id,
        request: data,
      });
      setAddingMemberToTeam(null);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleCreateSubmit = async (data: CreateTeamRequest | UpdateTeamRequest) => {
    try {
      await createTeamMutation.mutateAsync(data as CreateTeamRequest);
      setShowCreateDialog(false);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleEditSubmit = async (data: CreateTeamRequest | UpdateTeamRequest) => {
    if (!editingTeam) return;

    try {
      await updateTeamMutation.mutateAsync({
        teamId: editingTeam.id,
        request: data as UpdateTeamRequest,
      });
      setEditingTeam(null);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTeam) return;

    try {
      await deleteTeamMutation.mutateAsync(deletingTeam.id);
      setDeletingTeam(null);
    } catch (error) {
      // Error is handled by the mutation hook
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <TeamList
        onCreateTeam={handleCreateTeam}
        onViewTeam={handleViewTeam}
        onEditTeam={handleEditTeam}
        onDeleteTeam={handleDeleteTeam}
        onAddMember={handleAddMember}
      />

      {/* Create Team Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
          </DialogHeader>
          <TeamForm
            onSubmit={handleCreateSubmit}
            onCancel={() => setShowCreateDialog(false)}
            isLoading={createTeamMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={!!editingTeam} onOpenChange={(open) => !open && setEditingTeam(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
          </DialogHeader>
          {editingTeam && (
            <TeamForm
              team={editingTeam}
              onSubmit={handleEditSubmit}
              onCancel={() => setEditingTeam(null)}
              isLoading={updateTeamMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingTeam} onOpenChange={(open) => !open && setDeletingTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTeam?.teamName}"? This action cannot be
              undone. All team members will be removed and any assigned maintenance requests will
              need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTeamMutation.isPending}
            >
              {deleteTeamMutation.isPending ? 'Deleting...' : 'Delete Team'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Team Member Dialog */}
      <AddTeamMemberForm
        isOpen={!!addingMemberToTeam}
        onClose={() => setAddingMemberToTeam(null)}
        onSubmit={handleAddMemberSubmit}
        isLoading={addTeamMemberMutation.isPending}
      />
    </div>
  );
};
