/**
 * Admin stats section component
 */

import { StatsCard } from './StatsCard';
import { StatsCardSkeleton } from './LoadingComponents';
import { usePermissions } from '../../hooks/useUsers';

interface AdminStatsProps {
  stats?: {
    totalUsers: number;
    usersByRole?: Record<string, number>;
    bannedUsers: number;
    activeUsers: number;
  };
  isLoading: boolean;
  error?: Error | null;
}

export function AdminStats({ stats, isLoading, error }: AdminStatsProps) {
  const { data: permissionsData } = usePermissions();
  const availableRoles = permissionsData?.data?.roles || ['user', 'admin'];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
        minHeight: '120px',
      }}
    >
      {isLoading ? (
        <>
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton />
        </>
      ) : error ? (
        <div
          style={{
            gridColumn: '1 / -1',
            padding: '2rem',
            textAlign: 'center',
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            borderRadius: '1rem',
            border: '1px solid #fecaca',
          }}
        >
          Error loading stats: {error.message}
        </div>
      ) : stats ? (
        <>
          <StatsCard title="Total Users" value={stats.totalUsers} color="#2563eb" />
          {/* Dynamic role stats */}
          {availableRoles.map((role, index) => {
            const colors = ['#7c3aed', '#059669', '#f59e0b', '#dc2626', '#06b6d4'];
            const roleDisplayName = role.charAt(0).toUpperCase() + role.slice(1);
            const pluralName = role === 'admin' ? 'Admins' : `${roleDisplayName}s`;

            return (
              <StatsCard
                key={role}
                title={pluralName}
                value={stats.usersByRole?.[role] ?? 0}
                color={colors[index % colors.length]}
              />
            );
          })}
          <StatsCard title="Banned" value={stats.bannedUsers} color="#dc2626" />
          <StatsCard title="Active Users" value={stats.activeUsers} color="#f59e0b" />
        </>
      ) : null}
    </div>
  );
}
