import { AccessControl } from 'accesscontrol';

/**
 * RBAC Configuration using accesscontrol library
 *
 * Two roles:
 * - user: Can only access own resources in users module, read-only access to demo
 * - admin: Full access to all modules and all resources
 *
 * Actions follow accesscontrol naming convention:
 * - *Own: Can only perform action on own resources
 * - *Any: Can perform action on any resource
 */

// Define module access permissions for each role in GearGuard
const ROLE_MODULE_ACCESS: Record<string, Record<string, { any: string[]; own: string[] }>> = {
  employee: {
    equipment: { any: ['read'], own: [] }, // Can view all equipment
    requests: { any: [], own: ['create', 'read', 'update', 'delete'] }, // Can fully manage own requests
    teams: { any: ['read'], own: [] }, // Can view teams
    dashboard: { any: [], own: ['read', 'update'] }, // Can only view and customize their own dashboard
    calendar: { any: [], own: ['read', 'create', 'update', 'delete'] }, // Can only manage their own calendar events
    users: { any: [], own: ['read', 'update'] }, // Can manage own profile
    notifications: { any: [], own: ['read', 'update', 'delete'] }, // Can manage own notifications (added delete)
  },
  technician: {
    equipment: { any: ['read'], own: ['create', 'read', 'update'] }, // Can view all equipment, create new entries, and update assigned equipment (delete requires manager approval for audit/compliance)
    requests: { any: ['read', 'update'], own: ['create', 'read', 'update', 'delete'] }, // Can manage assigned requests + fully manage own
    teams: { any: ['read'], own: [] }, // Can view teams
    dashboard: { any: [], own: ['read', 'update'] }, // Can only view and customize their own dashboard
    calendar: { any: ['read', 'update'], own: ['create', 'delete'] }, // Can view/update calendar, manage own events
    users: { any: ['read'], own: ['read', 'update'] }, // Can view other users (for assignments), manage own profile
    notifications: { any: [], own: ['read', 'update', 'delete'] }, // Can manage own notifications
  },
  manager: {
    equipment: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Full equipment management
    requests: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Full request management
    teams: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Full team management
    dashboard: { any: ['read', 'update'], own: [] }, // Can view and customize dashboard (updated)
    calendar: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Full calendar management
    analytics: { any: ['read'], own: [] }, // Can view analytics
    users: { any: ['read', 'update'], own: ['read', 'update'] }, // Can manage team members, own profile (updated)
    notifications: { any: ['create', 'read'], own: ['read', 'update'] }, // Can send notifications, manage own (added)
  },
  admin: {
    equipment: { any: ['create', 'read', 'update', 'delete'], own: [] },
    requests: { any: ['create', 'read', 'update', 'delete'], own: [] },
    teams: { any: ['create', 'read', 'update', 'delete'], own: [] },
    dashboard: { any: ['create', 'read', 'update', 'delete'], own: [] },
    calendar: { any: ['create', 'read', 'update', 'delete'], own: [] },
    analytics: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Can configure analytics (updated)
    users: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Full user management
    notifications: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Full notification management (added)
    admin: { any: ['create', 'read', 'update', 'delete'], own: [] },
  },
};

// All available modules in the GearGuard system
const ALL_MODULES = [
  'equipment',
  'requests',
  'teams',
  'dashboard',
  'calendar',
  'analytics',
  'users',
  'notifications', // Added notifications module
  'demo',
  'admin',
  'websocket',
];

// All CRUD actions
const ALL_ACTIONS = ['create', 'read', 'update', 'delete'] as const;

/**
 * Create and configure the AccessControl instance
 */
const createAccessControl = (): AccessControl => {
  const ac = new AccessControl();

  Object.entries(ROLE_MODULE_ACCESS).forEach(([role, modules]) => {
    Object.entries(modules).forEach(([moduleName, permissions]) => {
      permissions.any.forEach((action) => {
        const grantMethod = `${action}Any` as 'createAny' | 'readAny' | 'updateAny' | 'deleteAny';
        ac.grant(role)[grantMethod](moduleName);
      });

      permissions.own.forEach((action) => {
        const grantMethod = `${action}Own` as 'createOwn' | 'readOwn' | 'updateOwn' | 'deleteOwn';
        ac.grant(role)[grantMethod](moduleName);
      });
    });
  });

  return ac;
};

// Export singleton AccessControl instance
export const ac = createAccessControl();

// Export helper types
export type Role = 'employee' | 'technician' | 'manager' | 'admin';
export type Action = (typeof ALL_ACTIONS)[number];
export type ModuleName = (typeof ALL_MODULES)[number];

/**
 * Get all available roles in the system
 */
export const getAvailableRoles = (): string[] => {
  return Object.keys(ROLE_MODULE_ACCESS);
};

/**
 * Get all available modules in the system
 */
export const getAvailableModules = (): string[] => {
  return [...ALL_MODULES];
};

/**
 * Get all available actions in the system
 */
export const getAvailableActions = (): string[] => {
  return [...ALL_ACTIONS];
};

/**
 * Check if a role has permission to perform an action on a module
 * This is a convenience wrapper around ac.can()
 */
export const hasPermission = (
  role: string,
  action: Action,
  moduleName: string,
  isOwner: boolean = false
): boolean => {
  const permission = isOwner
    ? ac.can(role)[`${action}Own`](moduleName)
    : ac.can(role)[`${action}Any`](moduleName);

  return permission.granted;
};

/**
 * Check if a user can access a specific resource
 * Combines both 'any' and 'own' permissions
 */
export const canAccessResource = (
  role: string,
  action: Action,
  moduleName: string,
  isOwner: boolean = false
): boolean => {
  // Check 'any' permission first (higher privilege)
  if (hasPermission(role, action, moduleName, false)) {
    return true;
  }

  // If not granted 'any', check 'own' permission if user is owner
  if (isOwner && hasPermission(role, action, moduleName, true)) {
    return true;
  }

  return false;
};

/**
 * Get user's effective permissions for a module
 * Returns both 'any' and 'own' permissions they have
 */
export const getModulePermissions = (
  role: string,
  moduleName: string
): { any: Action[]; own: Action[] } => {
  const permissions = { any: [] as Action[], own: [] as Action[] };

  ALL_ACTIONS.forEach((action) => {
    if (hasPermission(role, action, moduleName, false)) {
      permissions.any.push(action);
    }
    if (hasPermission(role, action, moduleName, true)) {
      permissions.own.push(action);
    }
  });

  return permissions;
};

/**
 * Get all granted permissions for a role
 * Useful for debugging and admin dashboards
 */
export const getRolePermissions = (role: string): Record<string, string[]> => {
  const permissions: Record<string, string[]> = {};

  ALL_MODULES.forEach((moduleName) => {
    const modulePerms: string[] = [];

    ALL_ACTIONS.forEach((action) => {
      if (ac.can(role)[`${action}Any`](moduleName).granted) {
        modulePerms.push(`${action}Any`);
      }
      if (ac.can(role)[`${action}Own`](moduleName).granted) {
        modulePerms.push(`${action}Own`);
      }
    });

    if (modulePerms.length > 0) {
      permissions[moduleName] = modulePerms;
    }
  });

  return permissions;
};

/**
 * Role hierarchy for permission inheritance
 * Higher roles inherit permissions from lower roles
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  employee: 1,
  technician: 2,
  manager: 3,
  admin: 4,
};

/**
 * Check if a role has sufficient level for an operation
 * Useful for role-based UI rendering and access control
 */
export const hasRoleLevel = (userRole: Role, requiredRole: Role): boolean => {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
};

/**
 * Get all modules a role can access (has any permission on)
 */
export const getAccessibleModules = (role: string): string[] => {
  const accessibleModules: string[] = [];

  ALL_MODULES.forEach((moduleName) => {
    const hasAnyPermission = ALL_ACTIONS.some(
      (action) =>
        hasPermission(role, action, moduleName, false) ||
        hasPermission(role, action, moduleName, true)
    );

    if (hasAnyPermission) {
      accessibleModules.push(moduleName);
    }
  });

  return accessibleModules;
};
