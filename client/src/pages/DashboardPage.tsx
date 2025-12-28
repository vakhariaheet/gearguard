import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Wrench,
  Users,
  BarChart3,
  Calendar,
  AlertTriangle,
  Plus,
  Eye,
  UserCheck,
  Shield,
} from 'lucide-react';

interface DashboardCard {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  roles: string[];
}

export function DashboardPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const userRole = (user?.publicMetadata?.role as string) || 'employee';

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Maintenance Requests',
      description: 'View and manage maintenance requests',
      icon: <FileText className="h-8 w-8" />,
      path: '/requests',
      color: 'bg-blue-500',
      roles: ['admin', 'manager', 'technician', 'employee'],
    },
    {
      title: 'Create Request',
      description: 'Submit a new maintenance request',
      icon: <Plus className="h-8 w-8" />,
      path: '/requests/create',
      color: 'bg-green-500',
      roles: ['admin', 'manager', 'technician', 'employee'],
    },
    {
      title: 'Equipment Management',
      description: 'Manage and track equipment inventory',
      icon: <Wrench className="h-8 w-8" />,
      path: '/equipment',
      color: 'bg-orange-500',
      roles: ['admin', 'manager', 'technician'],
    },
    {
      title: 'Equipment Health',
      description: 'Monitor equipment health and status',
      icon: <BarChart3 className="h-8 w-8" />,
      path: '/equipment/health',
      color: 'bg-purple-500',
      roles: ['admin', 'manager', 'technician'],
    },
    {
      title: 'Maintenance Schedule',
      description: 'View and manage maintenance schedules',
      icon: <Calendar className="h-8 w-8" />,
      path: '/equipment/maintenance',
      color: 'bg-indigo-500',
      roles: ['admin', 'manager', 'technician'],
    },
    {
      title: 'Team Management',
      description: 'Manage teams and assignments',
      icon: <Users className="h-8 w-8" />,
      path: '/teams',
      color: 'bg-teal-500',
      roles: ['admin', 'manager'],
    },
    {
      title: 'Admin Panel',
      description: 'System administration and settings',
      icon: <Shield className="h-8 w-8" />,
      path: '/admin',
      color: 'bg-red-500',
      roles: ['admin'],
    },
  ];

  const availableCards = dashboardCards.filter((card) => card.roles.includes(userRole));

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'manager':
        return 'Manager';
      case 'technician':
        return 'Technician';
      case 'employee':
        return 'Employee';
      default:
        return 'User';
    }
  };

  return (
    <main className="main-content">
      <div className="dashboard-classic">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1 className="dashboard-title">Welcome to GearGuard</h1>
            <p className="dashboard-subtitle">
              Hello, {user?.firstName || user?.emailAddresses[0]?.emailAddress}!
            </p>
          </div>
          <div className="user-badge">
            <UserCheck className="h-5 w-5" />
            <span>{getRoleDisplayName(userRole)}</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon bg-blue-100">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <div className="stat-content">
              <h3>My Requests</h3>
              <p className="stat-number">--</p>
            </div>
          </div>

          {(userRole === 'admin' || userRole === 'manager' || userRole === 'technician') && (
            <div className="stat-card">
              <div className="stat-icon bg-orange-100">
                <Wrench className="h-6 w-6 text-orange-600" />
              </div>
              <div className="stat-content">
                <h3>Equipment</h3>
                <p className="stat-number">--</p>
              </div>
            </div>
          )}

          {(userRole === 'admin' || userRole === 'manager') && (
            <div className="stat-card">
              <div className="stat-icon bg-teal-100">
                <Users className="h-6 w-6 text-teal-600" />
              </div>
              <div className="stat-content">
                <h3>Team Members</h3>
                <p className="stat-number">--</p>
              </div>
            </div>
          )}

          <div className="stat-card">
            <div className="stat-icon bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="stat-content">
              <h3>Urgent Items</h3>
              <p className="stat-number">--</p>
            </div>
          </div>
        </div>

        {/* Main Actions Grid */}
        <div className="dashboard-grid">
          <h2 className="section-title">Quick Actions</h2>
          <div className="cards-grid">
            {availableCards.map((card, index) => (
              <div
                key={index}
                className="dashboard-card"
                onClick={() => handleCardClick(card.path)}
              >
                <div className={`card-icon ${card.color}`}>{card.icon}</div>
                <div className="card-content">
                  <h3 className="card-title">{card.title}</h3>
                  <p className="card-description">{card.description}</p>
                </div>
                <div className="card-arrow">
                  <Eye className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Info Section */}
        <div className="user-info-section">
          <h2 className="section-title">Account Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.emailAddresses[0]?.emailAddress}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">
                {user?.firstName} {user?.lastName}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Role:</span>
              <span className="info-value">{getRoleDisplayName(userRole)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">User ID:</span>
              <span className="info-value">{user?.id}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
