/**
 * Tab navigation component for admin dashboard
 */

interface TabNavigationProps {
  activeTab: 'users' | 'invitations';
  onTabChange: (tab: 'users' | 'invitations') => void;
  onInvitationsTabClick?: () => void;
}

export function TabNavigation({ activeTab, onTabChange, onInvitationsTabClick }: TabNavigationProps) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ 
        display: 'flex', 
        borderBottom: '2px solid #f1f5f9',
        backgroundColor: '#f8fafc',
        borderRadius: '0.75rem 0.75rem 0 0',
        padding: '0.25rem',
        width: 'fit-content',
        minWidth: '500px'
      }}>
        <button
          onClick={() => onTabChange('users')}
          style={{
            padding: '0.875rem 1.75rem',
            border: 'none',
            backgroundColor: activeTab === 'users' ? '#fff' : 'transparent',
            borderRadius: '0.5rem',
            color: activeTab === 'users' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'users' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'users' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
            minWidth: '140px',
            textAlign: 'center'
          }}
        >
          Users
        </button>
        <button
          onClick={() => {
            onTabChange('invitations');
            onInvitationsTabClick?.();
          }}
          style={{
            padding: '0.875rem 1.75rem',
            border: 'none',
            backgroundColor: activeTab === 'invitations' ? '#fff' : 'transparent',
            borderRadius: '0.5rem',
            color: activeTab === 'invitations' ? '#2563eb' : '#64748b',
            fontWeight: activeTab === 'invitations' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'invitations' ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none',
            minWidth: '200px',
            textAlign: 'center'
          }}
        >
          Invitations
        </button>
      </div>
    </div>
  );
}