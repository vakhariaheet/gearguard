/**
 * Role Select Component
 * Specialized select for user roles with loading states
 */

import { CustomSelect } from './CustomSelect';
import { LoadingSpinner } from './LoadingComponents';
import { usePermissions } from '../../hooks/useUsers';
import type { UserRole } from '../../types/user';

interface RoleSelectProps {
  value: UserRole;
  onChange: (role: UserRole) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

export function RoleSelect({
  value,
  onChange,
  disabled = false,
  isLoading = false,
}: RoleSelectProps) {
  const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();

  // Get roles from backend, fallback to static roles
  const availableRoles = permissionsData?.data?.roles || ['user', 'admin'];

  const roleOptions = availableRoles.map((role) => ({
    value: role as UserRole,
    label: role.charAt(0).toUpperCase() + role.slice(1), // Capitalize first letter
  }));

  if (isLoading || isLoadingPermissions) {
    return (
      <div
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: '0.375rem',
          border: '2px solid #e2e8f0',
          backgroundColor: '#f1f5f9',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: '#94a3b8',
          opacity: 0.7,
          minWidth: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
        }}
      >
        <LoadingSpinner size={14} color="#94a3b8" />
        <span>Updating...</span>
      </div>
    );
  }

  return (
    <CustomSelect
      value={value}
      onChange={(newValue) => onChange(newValue as UserRole)}
      options={roleOptions}
      disabled={disabled}
      style={{
        minWidth: '100px',
      }}
    />
  );
}
