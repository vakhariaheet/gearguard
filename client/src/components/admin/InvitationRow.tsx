/**
 * Invitation row component for admin dashboard
 */

import { ButtonWithLoading } from './LoadingComponents';
import type { Invitation } from '../../types/user';

interface InvitationRowProps {
  invitation: Invitation;
  onRevoke: (invitationId: string) => void;
  onResend: (invitationId: string) => void;
  loadingStates: {
    [invitationId: string]: {
      resend?: boolean;
      revoke?: boolean;
    };
  };
}

export function InvitationRow({ invitation, onRevoke, onResend, loadingStates }: InvitationRowProps) {
  const invitationLoading = loadingStates[invitation.id] || {};
  const role = invitation.publicMetadata?.role || 'user';
  const isPending = invitation.status === 'pending';
  
  return (
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      <td style={{ padding: '1rem' }}>
        <div style={{ fontWeight: 500 }}>{invitation.emailAddress}</div>
      </td>
      <td style={{ padding: '1rem' }}>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 500,
          backgroundColor: role === 'admin' ? '#dbeafe' : '#f3f4f6',
          color: role === 'admin' ? '#1d4ed8' : '#374151',
        }}>
          {role}
        </span>
      </td>
      <td style={{ padding: '1rem' }}>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 500,
          backgroundColor: invitation.status === 'pending' ? '#fef3c7' : 
                          invitation.status === 'accepted' ? '#dcfce7' : '#fee2e2',
          color: invitation.status === 'pending' ? '#d97706' : 
                 invitation.status === 'accepted' ? '#16a34a' : '#dc2626',
        }}>
          {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
        </span>
      </td>
      <td style={{ padding: '1rem' }}>
        {new Date(invitation.createdAt).toLocaleDateString()}
      </td>
      <td style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <ButtonWithLoading
            onClick={() => onResend(invitation.id)}
            isLoading={invitationLoading.resend}
            disabled={!isPending}
            loadingText="Resending..."
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: !isPending ? '#94a3b8' : '#2563eb',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: !isPending ? 'none' : '0 2px 4px rgba(37, 99, 235, 0.3)',
              cursor: !isPending ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e: any) => {
              if (!invitationLoading.resend && isPending) {
                e.target.style.backgroundColor = '#1d4ed8';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.4)';
              }
            }}
            onMouseOut={(e: any) => {
              if (!invitationLoading.resend && isPending) {
                e.target.style.backgroundColor = '#2563eb';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.3)';
              }
            }}
          >
            Resend
          </ButtonWithLoading>
          <ButtonWithLoading
            onClick={() => onRevoke(invitation.id)}
            isLoading={invitationLoading.revoke}
            disabled={!isPending}
            loadingText="Revoking..."
            style={{
              padding: '0.375rem 0.875rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: !isPending ? '#94a3b8' : '#dc2626',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: !isPending ? 'none' : '0 2px 4px rgba(220, 38, 38, 0.3)',
              cursor: !isPending ? 'not-allowed' : 'pointer',
            }}
            onMouseOver={(e: any) => {
              if (!invitationLoading.revoke && isPending) {
                e.target.style.backgroundColor = '#b91c1c';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.4)';
              }
            }}
            onMouseOut={(e: any) => {
              if (!invitationLoading.revoke && isPending) {
                e.target.style.backgroundColor = '#dc2626';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.3)';
              }
            }}
          >
            Revoke
          </ButtonWithLoading>
        </div>
      </td>
    </tr>
  );
}