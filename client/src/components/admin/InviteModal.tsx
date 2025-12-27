/**
 * Invite user modal component
 */

import { useState, useEffect } from 'react';
import { ButtonWithLoading } from './LoadingComponents';
import { RoleSelect } from './RoleSelect';
import { usePermissions } from '../../hooks/useUsers';
import type { UserRole } from '../../types/user';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, role: UserRole) => void;
  isLoading: boolean;
}

export function InviteModal({ isOpen, onClose, onInvite, isLoading }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('user');
  const { data: permissionsData } = usePermissions();

  // Set default role dynamically based on available roles
  useEffect(() => {
    if (permissionsData?.data?.roles) {
      const availableRoles = permissionsData.data.roles;
      const defaultRole = availableRoles.includes('user') ? 'user' : availableRoles[0];
      setRole(defaultRole);
    }
  }, [permissionsData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onInvite(email, role);
    setEmail('');
    // Reset to default role
    const availableRoles = permissionsData?.data?.roles || ['user'];
    const defaultRole = availableRoles.includes('user') ? 'user' : availableRoles[0];
    setRole(defaultRole);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2.5rem',
          borderRadius: '1rem',
          width: '100%',
          maxWidth: '450px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          border: '1px solid #f1f5f9',
          animation: 'modalFadeIn 0.2s ease-out',
        }}
      >
        <h3
          style={{
            margin: '0 0 1.5rem',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#111827',
            textAlign: 'center',
          }}
        >
          Invite New User
        </h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontWeight: 600,
                color: '#374151',
                fontSize: '0.95rem',
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              style={{
                width: '100%',
                padding: '0.875rem 1rem',
                borderRadius: '0.5rem',
                border: '2px solid #e2e8f0',
                fontSize: '1rem',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#2563eb';
                e.target.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e2e8f0';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>
          <div style={{ marginBottom: '2rem' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontWeight: 600,
                color: '#374151',
                fontSize: '0.95rem',
              }}
            >
              Role
            </label>
            <RoleSelect value={role} onChange={setRole} />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: '2px solid #e2e8f0',
                backgroundColor: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                color: '#64748b',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.backgroundColor = '#f8fafc';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              Cancel
            </button>
            <ButtonWithLoading
              type="submit"
              isLoading={isLoading}
              loadingText="Sending invite..."
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: 'white',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              Send Invite
            </ButtonWithLoading>
          </div>
        </form>
      </div>
    </div>
  );
}
