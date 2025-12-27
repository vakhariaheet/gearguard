/**
 * Admin Dashboard Component
 * Full admin panel with user management
 */

import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { ProtectedRoute } from './ProtectedRoute';
import { toast } from 'sonner';
import { useConfirmDialog } from '../hooks';
import {
  useUsers,
  useAdminStats,
  useChangeRole,
  useBanUser,
  useUnbanUser,
  useDeleteUser,
  useInviteUser,
  useInvitations,
  useRevokeInvitation,
  useResendInvitation,
  usePermissions,
} from '../hooks/useUsers';
import type { UserRole } from '../types/user';

// Admin components
import {
  AdminStats,
  TabNavigation,
  SearchInput,
  UsersTable,
  InvitationsTable,
  InviteModal,
  ConfirmDialog,
  PermissionsDisplay,
} from './admin';

function AdminDashboardContent() {
  const { user: currentUser } = useUser();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [invitationSearchQuery, setInvitationSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'invitations'>('users');
  const [showPermissions, setShowPermissions] = useState(false);

  // Confirmation dialog
  const { dialogState, hideConfirm, confirmDelete, confirmBan, confirmRevoke } = useConfirmDialog();

  // Pagination states
  const [usersPage, setUsersPage] = useState(1);
  const [invitationsPage, setInvitationsPage] = useState(1);
  const itemsPerPage = 10;

  // Individual loading states for actions
  const [userLoadingStates, setUserLoadingStates] = useState<{
    [userId: string]: {
      changeRole?: boolean;
      ban?: boolean;
      unban?: boolean;
      delete?: boolean;
    };
  }>({});

  const [invitationLoadingStates, setInvitationLoadingStates] = useState<{
    [invitationId: string]: {
      resend?: boolean;
      revoke?: boolean;
    };
  }>({});

  // Queries
  const { data: statsData, isLoading: statsLoading, error: statsError } = useAdminStats();
  const { data: permissionsData } = usePermissions();
  const {
    data: usersData,
    isLoading: usersLoading,
    error: usersError,
  } = useUsers({
    query: searchQuery || undefined,
    limit: itemsPerPage,
    offset: (usersPage - 1) * itemsPerPage,
    enabled: activeTab === 'users', // Only load when users tab is active
  });

  // Only load invitations when the invitations tab is active or has been visited
  const [hasVisitedInvitations, setHasVisitedInvitations] = useState(false);
  const shouldLoadInvitations = activeTab === 'invitations' || hasVisitedInvitations;

  const {
    data: invitationsData,
    isLoading: invitationsLoading,
    error: invitationsError,
  } = useInvitations({
    email: invitationSearchQuery || undefined,
    limit: itemsPerPage,
    offset: (invitationsPage - 1) * itemsPerPage,
    enabled: shouldLoadInvitations,
  });

  // Mutations
  const changeRoleMutation = useChangeRole();
  const banUserMutation = useBanUser();
  const unbanUserMutation = useUnbanUser();
  const deleteUserMutation = useDeleteUser();
  const inviteUserMutation = useInviteUser();
  const revokeInvitationMutation = useRevokeInvitation();
  const resendInvitationMutation = useResendInvitation();

  const handleChangeRole = (userId: string, role: UserRole) => {
    // Get available roles from permissions data for validation
    const availableRoles = permissionsData?.data?.roles || ['user', 'admin'];
    if (!availableRoles.includes(role)) {
      toast.error(`Invalid role: ${role}. Must be one of: ${availableRoles.join(', ')}`);
      return;
    }

    setUserLoadingStates((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], changeRole: true },
    }));

    // Safety timeout to clear loading state after 10 seconds
    const timeoutId = setTimeout(() => {
      setUserLoadingStates((prev) => ({
        ...prev,
        [userId]: { ...prev[userId], changeRole: false },
      }));
    }, 10000);

    // Show loading toast immediately
    const loadingToastId = toast.loading(`Changing user role to ${role}...`);

    changeRoleMutation.mutate(
      { userId, role },
      {
        onSuccess: () => {
          clearTimeout(timeoutId);
          // Show success message immediately
          toast.success(`User role changed to ${role} successfully!`, { id: loadingToastId });

          // The useChangeRole hook will handle the optimistic updates
        },
        onError: (error: any) => {
          clearTimeout(timeoutId);
          toast.error(`Failed to change user role: ${error.message}`, { id: loadingToastId });
        },
        onSettled: () => {
          clearTimeout(timeoutId);
          // Always clear loading state
          setUserLoadingStates((prev) => ({
            ...prev,
            [userId]: { ...prev[userId], changeRole: false },
          }));
        },
      }
    );
  };

  const handleBan = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    const userName = user?.fullName || user?.email || 'this user';

    const confirmed = await confirmBan(userName);
    if (!confirmed) return;

    setUserLoadingStates((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], ban: true },
    }));

    const promise = new Promise((resolve, reject) => {
      banUserMutation.mutate(
        { userId },
        {
          onSuccess: (data) => {
            resolve(data);
          },
          onError: (error) => {
            reject(error);
          },
          onSettled: () => {
            setUserLoadingStates((prev) => ({
              ...prev,
              [userId]: { ...prev[userId], ban: false },
            }));
          },
        }
      );
    });

    toast.promise(promise, {
      loading: 'Banning user...',
      success: 'User banned successfully!',
      error: (error) => `Failed to ban user: ${error.message}`,
    });
  };

  const handleUnban = (userId: string) => {
    setUserLoadingStates((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], unban: true },
    }));

    const promise = new Promise((resolve, reject) => {
      unbanUserMutation.mutate(userId, {
        onSuccess: (data) => {
          resolve(data);
        },
        onError: (error) => {
          reject(error);
        },
        onSettled: () => {
          setUserLoadingStates((prev) => ({
            ...prev,
            [userId]: { ...prev[userId], unban: false },
          }));
        },
      });
    });

    toast.promise(promise, {
      loading: 'Unbanning user...',
      success: 'User unbanned successfully!',
      error: (error) => `Failed to unban user: ${error.message}`,
    });
  };

  const handleDelete = async (userId: string) => {
    const user = users.find((u) => u.id === userId);
    const userName = user?.fullName || user?.email || 'this user';

    const confirmed = await confirmDelete(userName);
    if (!confirmed) return;

    setUserLoadingStates((prev) => ({
      ...prev,
      [userId]: { ...prev[userId], delete: true },
    }));

    const promise = new Promise((resolve, reject) => {
      deleteUserMutation.mutate(userId, {
        onSuccess: (data) => {
          resolve(data);
        },
        onError: (error) => {
          reject(error);
        },
        onSettled: () => {
          setUserLoadingStates((prev) => ({
            ...prev,
            [userId]: { ...prev[userId], delete: false },
          }));
        },
      });
    });

    toast.promise(promise, {
      loading: 'Deleting user...',
      success: 'User deleted successfully!',
      error: (error) => `Failed to delete user: ${error.message}`,
    });
  };

  const handleInvite = (email: string, role: UserRole) => {
    // Show loading toast immediately
    const loadingToastId = toast.loading(`Sending invitation to ${email}...`);

    inviteUserMutation.mutate(
      { email, role },
      {
        onSuccess: () => {
          setShowInviteModal(false);
          // Show success message immediately
          toast.success(`Invitation sent to ${email} successfully!`, { id: loadingToastId });

          // The useInviteUser hook will handle the query invalidation and optimistic updates
        },
        onError: (error) => {
          toast.error(`Failed to invite user: ${error.message}`, { id: loadingToastId });
        },
      }
    );
  };

  const handleRevokeInvitation = async (invitationId: string) => {
    const invitation = invitations.find((inv) => inv.id === invitationId);

    // Safety check: don't allow revoking non-pending invitations
    if (invitation && invitation.status !== 'pending') {
      toast.error(`Cannot revoke ${invitation.status} invitation`);
      return;
    }

    const invitationEmail = invitation?.emailAddress || 'this invitation';

    const confirmed = await confirmRevoke(`the invitation for ${invitationEmail}`);
    if (!confirmed) return;

    setInvitationLoadingStates((prev) => ({
      ...prev,
      [invitationId]: { ...prev[invitationId], revoke: true },
    }));

    // Show loading toast immediately
    const loadingToastId = toast.loading('Revoking invitation...');

    revokeInvitationMutation.mutate(invitationId, {
      onSuccess: () => {
        // Show success message immediately
        toast.success('Invitation revoked successfully!', { id: loadingToastId });

        // The useRevokeInvitation hook will handle the optimistic update and query invalidation
      },
      onError: (error) => {
        toast.error(`Failed to revoke invitation: ${error.message}`, { id: loadingToastId });
      },
      onSettled: () => {
        setInvitationLoadingStates((prev) => ({
          ...prev,
          [invitationId]: { ...prev[invitationId], revoke: false },
        }));
      },
    });
  };

  const handleResendInvitation = (invitationId: string) => {
    const invitation = invitations.find((inv) => inv.id === invitationId);

    // Safety check: only allow resending pending invitations
    if (invitation && invitation.status !== 'pending') {
      toast.error(`Cannot resend ${invitation.status} invitation`);
      return;
    }

    setInvitationLoadingStates((prev) => ({
      ...prev,
      [invitationId]: { ...prev[invitationId], resend: true },
    }));

    // Show loading toast immediately
    const loadingToastId = toast.loading('Resending invitation...');

    resendInvitationMutation.mutate(invitationId, {
      onSuccess: () => {
        // Show success message immediately
        toast.success('Invitation resent successfully!', { id: loadingToastId });

        // Then refresh the invitations data
        // The useResendInvitation hook will handle the query invalidation
      },
      onError: (error) => {
        toast.error(`Failed to resend invitation: ${error.message}`, { id: loadingToastId });
      },
      onSettled: () => {
        setInvitationLoadingStates((prev) => ({
          ...prev,
          [invitationId]: { ...prev[invitationId], resend: false },
        }));
      },
    });
  };

  const stats = statsData?.data;
  const users = usersData?.data?.users || [];
  const invitations = invitationsData?.data?.invitations || [];

  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        minWidth: '800px', // Prevent width from shrinking too much
        width: '100%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 700,
              color: '#111827',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Admin Dashboard
          </h2>
          <p
            style={{
              margin: '0.5rem 0 0',
              color: '#6b7280',
              fontSize: '1.1rem',
            }}
          >
            Welcome back, {currentUser?.firstName}!
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          style={{
            padding: '0.875rem 1.75rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)';
          }}
        >
          Invite User
        </button>
      </div>

      {/* Stats Cards */}
      <AdminStats stats={stats} isLoading={statsLoading} error={statsError} />

      {/* Permissions Debug Section (Optional) */}
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setShowPermissions(!showPermissions)}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid #d1d5db',
            backgroundColor: showPermissions ? '#f3f4f6' : 'white',
            color: '#374151',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          {showPermissions ? 'Hide' : 'Show'} Permissions Configuration
        </button>
        {showPermissions && <PermissionsDisplay />}
      </div>

      {/* Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onInvitationsTabClick={() => setHasVisitedInvitations(true)}
      />

      {/* Search */}
      <SearchInput
        value={activeTab === 'users' ? searchQuery : invitationSearchQuery}
        onChange={(value) => {
          if (activeTab === 'users') {
            setSearchQuery(value);
            setUsersPage(1);
          } else {
            setInvitationSearchQuery(value);
            setInvitationsPage(1);
          }
        }}
        placeholder={
          activeTab === 'users'
            ? 'Search users by email or name...'
            : 'Search invitations by email...'
        }
      />

      {/* Content based on active tab */}
      {activeTab === 'users' ? (
        <UsersTable
          users={users}
          isLoading={usersLoading && !usersData}
          error={usersError}
          loadingStates={userLoadingStates}
          onChangeRole={handleChangeRole}
          onBan={handleBan}
          onUnban={handleUnban}
          onDelete={handleDelete}
          currentPage={usersPage}
          totalPages={usersData?.data ? Math.ceil(usersData.data.totalCount / itemsPerPage) : 0}
          totalItems={usersData?.data?.totalCount || 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setUsersPage}
        />
      ) : (
        <InvitationsTable
          invitations={invitations}
          isLoading={invitationsLoading && !invitationsData}
          error={invitationsError}
          loadingStates={invitationLoadingStates}
          onRevoke={handleRevokeInvitation}
          onResend={handleResendInvitation}
          currentPage={invitationsPage}
          totalPages={
            invitationsData?.data ? Math.ceil(invitationsData.data.totalCount / itemsPerPage) : 0
          }
          totalItems={invitationsData?.data?.totalCount || 0}
          itemsPerPage={itemsPerPage}
          onPageChange={setInvitationsPage}
        />
      )}

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInvite}
        isLoading={inviteUserMutation.isPending}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={hideConfirm}
        onConfirm={dialogState.onConfirm || (() => {})}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        confirmVariant={dialogState.variant}
      />
    </div>
  );
}

export function AdminDashboard() {
  const { user } = useUser();

  return (
    <ProtectedRoute
      requiredRole="admin"
      fallback={
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.5rem',
            color: '#dc2626',
          }}
        >
          <h3>Admin Access Required</h3>
          <p>You need admin privileges to access this dashboard.</p>
          <p>Current role: {(user?.publicMetadata?.role as string) || 'user'}</p>
        </div>
      }
    >
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
