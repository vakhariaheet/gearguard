/**
 * User row component for admin dashboard
 */

import { BanIcon, TrashIcon, CheckIcon } from './icons';
import { IconButtonWithLoading } from './LoadingComponents';
import { RoleSelect } from './RoleSelect';
import type { User, UserRole } from '../../types/user';

interface UserRowProps {
  user: User;
  onChangeRole: (userId: string, role: UserRole) => void;
  onBan: (userId: string) => void;
  onUnban: (userId: string) => void;
  onDelete: (userId: string) => void;
  loadingStates: {
    [userId: string]: {
      changeRole?: boolean;
      ban?: boolean;
      unban?: boolean;
      delete?: boolean;
    };
  };
}

export function UserRow({ user, onChangeRole, onBan, onUnban, onDelete, loadingStates }: UserRowProps) {
  const userLoading = loadingStates[user.id] || {};
  
  return (
    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
      <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <img
          src={user.profileImageUrl}
          alt={user.fullName || user.email}
          style={{ width: 40, height: 40, borderRadius: '50%' }}
        />
        <div>
          <div style={{ fontWeight: 500 }}>{user.fullName || 'No Name'}</div>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{user.email}</div>
        </div>
      </td>
      <td style={{ padding: '1rem' }}>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 500,
          backgroundColor: user.role === 'admin' ? '#dbeafe' : '#f3f4f6',
          color: user.role === 'admin' ? '#1d4ed8' : '#374151',
        }}>
          {user.role}
        </span>
      </td>
      <td style={{ padding: '1rem' }}>
        <span style={{
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontSize: '0.75rem',
          fontWeight: 500,
          backgroundColor: user.banned ? '#fee2e2' : '#dcfce7',
          color: user.banned ? '#dc2626' : '#16a34a',
        }}>
          {user.banned ? 'Banned' : 'Active'}
        </span>
      </td>
      <td style={{ padding: '1rem' }}>
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <RoleSelect
            value={user.role}
            onChange={(role) => onChangeRole(user.id, role)}
            disabled={userLoading.changeRole}
            isLoading={userLoading.changeRole}
          />
          
          {user.banned ? (
            <IconButtonWithLoading
              onClick={() => onUnban(user.id)}
              isLoading={userLoading.unban}
              title="Unban User"
              style={{
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: '#16a34a',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.3)',
                minWidth: '36px',
                height: '36px',
              }}
              onMouseOver={(e: any) => {
                if (!userLoading.unban) {
                  e.target.style.backgroundColor = '#15803d';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(22, 163, 74, 0.4)';
                }
              }}
              onMouseOut={(e: any) => {
                if (!userLoading.unban) {
                  e.target.style.backgroundColor = '#16a34a';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(22, 163, 74, 0.3)';
                }
              }}
            >
              <CheckIcon size={16} />
            </IconButtonWithLoading>
          ) : (
            <IconButtonWithLoading
              onClick={() => onBan(user.id)}
              isLoading={userLoading.ban}
              title="Ban User"
              style={{
                padding: '0.5rem',
                borderRadius: '0.375rem',
                border: 'none',
                backgroundColor: '#f59e0b',
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 500,
                boxShadow: '0 2px 4px rgba(245, 158, 11, 0.3)',
                minWidth: '36px',
                height: '36px',
              }}
              onMouseOver={(e: any) => {
                if (!userLoading.ban) {
                  e.target.style.backgroundColor = '#d97706';
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.4)';
                }
              }}
              onMouseOut={(e: any) => {
                if (!userLoading.ban) {
                  e.target.style.backgroundColor = '#f59e0b';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(245, 158, 11, 0.3)';
                }
              }}
            >
              <BanIcon size={16} />
            </IconButtonWithLoading>
          )}
          
          <IconButtonWithLoading
            onClick={() => onDelete(user.id)}
            isLoading={userLoading.delete}
            title="Delete User"
            style={{
              padding: '0.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              backgroundColor: '#dc2626',
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
              minWidth: '36px',
              height: '36px',
            }}
            onMouseOver={(e: any) => {
              if (!userLoading.delete) {
                e.target.style.backgroundColor = '#b91c1c';
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.4)';
              }
            }}
            onMouseOut={(e: any) => {
              if (!userLoading.delete) {
                e.target.style.backgroundColor = '#dc2626';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(220, 38, 38, 0.3)';
              }
            }}
          >
            <TrashIcon size={16} />
          </IconButtonWithLoading>
        </div>
      </td>
    </tr>
  );
}