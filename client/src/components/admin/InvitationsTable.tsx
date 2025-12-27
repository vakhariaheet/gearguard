/**
 * Invitations table component for admin dashboard
 */

import { InvitationRow } from './InvitationRow';
import { TableRowSkeleton } from './LoadingComponents';
import { Pagination } from './Pagination';
import type { Invitation } from '../../types/user';

interface InvitationsTableProps {
  invitations: Invitation[];
  isLoading: boolean;
  error?: Error | null;
  loadingStates: {
    [invitationId: string]: {
      resend?: boolean;
      revoke?: boolean;
    };
  };
  onRevoke: (invitationId: string) => void;
  onResend: (invitationId: string) => void;
  // Pagination props
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function InvitationsTable({
  invitations,
  isLoading,
  error,
  loadingStates,
  onRevoke,
  onResend,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: InvitationsTableProps) {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '1rem',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      overflow: 'hidden',
      border: '1px solid #f1f5f9',
      minWidth: '800px',
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ 
            background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)', 
            borderBottom: '2px solid #e2e8f0' 
          }}>
            <th style={{ 
              padding: '1.25rem 1rem', 
              textAlign: 'left', 
              fontWeight: 700,
              color: '#374151',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: '30%'
            }}>
              Email
            </th>
            <th style={{ 
              padding: '1.25rem 1rem', 
              textAlign: 'left', 
              fontWeight: 700,
              color: '#374151',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: '15%'
            }}>
              Role
            </th>
            <th style={{ 
              padding: '1.25rem 1rem', 
              textAlign: 'left', 
              fontWeight: 700,
              color: '#374151',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: '15%'
            }}>
              Status
            </th>
            <th style={{ 
              padding: '1.25rem 1rem', 
              textAlign: 'left', 
              fontWeight: 700,
              color: '#374151',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: '15%'
            }}>
              Invited
            </th>
            <th style={{ 
              padding: '1.25rem 1rem', 
              textAlign: 'left', 
              fontWeight: 700,
              color: '#374151',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: '25%'
            }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: itemsPerPage }).map((_, index) => (
              <TableRowSkeleton key={index} columns={5} />
            ))
          ) : error ? (
            <tr>
              <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
                Error loading invitations: {error.message}
              </td>
            </tr>
          ) : invitations.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                No pending invitations
              </td>
            </tr>
          ) : (
            invitations.map((invitation) => (
              <InvitationRow
                key={invitation.id}
                invitation={invitation}
                onRevoke={onRevoke}
                onResend={onResend}
                loadingStates={loadingStates}
              />
            ))
          )}
        </tbody>
      </table>
      
      {!isLoading && !error && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          totalItems={totalItems}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}