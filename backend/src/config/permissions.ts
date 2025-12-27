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
    requests: { any: [], own: ['create', 'read', 'update'] }, // Can create and manage own requests
    teams: { any: ['read'], own: [] }, // Can view teams
    dashboard: { any: ['read'], own: [] }, // Can view dashboard
    users: { any: [], own: ['read', 'update'] }, // Can manage own profile
    demo: { any: ['read'], own: [] },
    websocket: { any: ['read', 'update'], own: [] },
  },
  technician: {
    equipment: { any: ['read', 'update'], own: [] }, // Can view and update equipment status
    requests: { any: ['read', 'update'], own: ['create', 'read', 'update'] }, // Can manage assigned requests
    teams: { any: ['read'], own: [] }, // Can view teams
    dashboard: { any: ['read'], own: [] }, // Can view dashboard
    calendar: { any: ['read', 'update'], own: [] }, // Can view and update calendar
    users: { any: [], own: ['read', 'update'] }, // Can manage own profile
    demo: { any: ['read'], own: [] },
    websocket: { any: ['read', 'update'], own: [] },
  },
  manager: {
    equipment: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Full equipment management
    requests: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Full request management
    teams: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Full team management
    dashboard: { any: ['read'], own: [] }, // Can view dashboard
    calendar: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Full calendar management
    analytics: { any: ['read'], own: [] }, // Can view analytics
    users: { any: ['read'], own: ['read', 'update'] }, // Can view users, manage own profile
    demo: { any: ['read'], own: [] },
    websocket: { any: ['read', 'update'], own: [] },
  },
  admin: {
    equipment: { any: ['create', 'read', 'update', 'delete'], own: [] },
    requests: { any: ['create', 'read', 'update', 'delete'], own: [] },
    teams: { any: ['create', 'read', 'update', 'delete'], own: [] },
    dashboard: { any: ['create', 'read', 'update', 'delete'], own: [] },
    calendar: { any: ['create', 'read', 'update', 'delete'], own: [] },
    analytics: { any: ['create', 'read', 'update', 'delete'], own: [] },
    users: { any: ['create', 'read', 'update', 'delete'], own: [] }, // Full user management
    demo: { any: ['create', 'read', 'update', 'delete'], own: [] },
    admin: { any: ['create', 'read', 'update', 'delete'], own: [] },
    websocket: { any: ['create', 'read', 'update', 'delete'], own: [] },
  },
};

// All available modules in the GearGuard system
const ALL_MODULES = ['equipment', 'requests', 'teams', 'dashboard', 'calendar', 'analytics', 'users', 'demo', 'admin', 'websocket'];

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
