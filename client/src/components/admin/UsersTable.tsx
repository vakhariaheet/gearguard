/**
 * Users table component for admin dashboard
 */

import { UserRow } from './UserRow';
import { TableRowSkeleton } from './LoadingComponents';
import { Pagination } from './Pagination';
import type { User, UserRole } from '../../types/user';

interface UsersTableProps {
  users: User[];
  isLoading: boolean;
  error?: Error | null;
  loadingStates: {
    [userId: string]: {
      changeRole?: boolean;
      ban?: boolean;
      unban?: boolean;
      delete?: boolean;
    };
  };
  onChangeRole: (userId: string, role: UserRole) => void;
  onBan: (userId: string) => void;
  onUnban: (userId: string) => void;
  onDelete: (userId: string) => void;
  // Pagination props
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function UsersTable({
  users,
  isLoading,
  error,
  loadingStates,
  onChangeRole,
  onBan,
  onUnban,
  onDelete,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: UsersTableProps) {
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
              width: '35%'
            }}>
              User
            </th>
            <th style={{ 
              padding: '1.25rem 1rem', 
              textAlign: 'left', 
              fontWeight: 700,
              color: '#374151',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: '12%'
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
              width: '12%'
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
              Joined
            </th>
            <th style={{ 
              padding: '1.25rem 1rem', 
              textAlign: 'left', 
              fontWeight: 700,
              color: '#374151',
              fontSize: '0.875rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              width: '26%'
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
                Error loading users: {error.message}
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
                No users found
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onChangeRole={onChangeRole}
                onBan={onBan}
                onUnban={onUnban}
                onDelete={onDelete}
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