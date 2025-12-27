/**
 * Permissions Display Component
 * Shows available roles and their permissions (for debugging/admin info)
 */

import { usePermissions } from '../../hooks/useUsers';
import { LoadingSpinner } from './LoadingComponents';

export function PermissionsDisplay() {
  const { data: permissionsData, isLoading, error } = usePermissions();

  if (isLoading) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center' }}>
        <LoadingSpinner size={20} />
        <p>Loading permissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '1rem', color: '#ef4444' }}>
        <p>Error loading permissions: {error.message}</p>
      </div>
    );
  }

  if (!permissionsData?.data) {
    return (
      <div style={{ padding: '1rem', color: '#6b7280' }}>
        <p>No permissions data available</p>
      </div>
    );
  }

  const { roles, permissions, modules, actions } = permissionsData.data;

  return (
    <div
      style={{
        padding: '1rem',
        backgroundColor: '#f8fafc',
        borderRadius: '0.5rem',
        margin: '1rem 0',
      }}
    >
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem', fontWeight: 600 }}>
        System Permissions Configuration
      </h3>

      <div
        style={{
          display: 'grid',
          gap: '1rem',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 500 }}>
            Available Roles:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {roles.map((role) => (
              <li key={role} style={{ marginBottom: '0.25rem' }}>
                <strong>{role}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 500 }}>
            Available Modules:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {modules.map((module) => (
              <li key={module} style={{ marginBottom: '0.25rem' }}>
                {module}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 500 }}>
            Available Actions:
          </h4>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {actions.map((action) => (
              <li key={action} style={{ marginBottom: '0.25rem' }}>
                {action}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 500 }}>
          Role Permissions:
        </h4>
        {roles.map((role) => (
          <div
            key={role}
            style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              backgroundColor: 'white',
              borderRadius: '0.375rem',
              border: '1px solid #e2e8f0',
            }}
          >
            <h5
              style={{
                margin: '0 0 0.5rem 0',
                fontSize: '0.875rem',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {role} Role:
            </h5>
            {Object.entries(permissions[role] || {}).map(([module, modulePermissions]) => (
              <div key={module} style={{ marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{module}:</span>
                <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                  {modulePermissions.join(', ') || 'No permissions'}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
