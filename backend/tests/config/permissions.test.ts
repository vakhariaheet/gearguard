import { ac, hasPermission, getRolePermissions } from '../../src/config/permissions';

describe('RBAC Permissions', () => {
  describe('User Role', () => {
    it('should allow user to read own profile', () => {
      const permission = ac.can('user').readOwn('users');
      expect(permission.granted).toBe(true);
    });

    it('should allow user to update own profile', () => {
      const permission = ac.can('user').updateOwn('users');
      expect(permission.granted).toBe(true);
    });

    it('should not allow user to read any user profile', () => {
      const permission = ac.can('user').readAny('users');
      expect(permission.granted).toBe(false);
    });

    it('should not allow user to delete any user', () => {
      const permission = ac.can('user').deleteAny('users');
      expect(permission.granted).toBe(false);
    });

    it('should allow user to read demo module', () => {
      const permission = ac.can('user').readAny('demo');
      expect(permission.granted).toBe(true);
    });

    it('should allow user to access websocket', () => {
      const permission = ac.can('user').readAny('websocket');
      expect(permission.granted).toBe(true);
    });

    it('should not allow user to access admin module', () => {
      const permission = ac.can('user').readAny('admin');
      expect(permission.granted).toBe(false);
    });
  });

  describe('Admin Role', () => {
    it('should allow admin to read any user', () => {
      const permission = ac.can('admin').readAny('users');
      expect(permission.granted).toBe(true);
    });

    it('should allow admin to create users', () => {
      const permission = ac.can('admin').createAny('users');
      expect(permission.granted).toBe(true);
    });

    it('should allow admin to update any user', () => {
      const permission = ac.can('admin').updateAny('users');
      expect(permission.granted).toBe(true);
    });

    it('should allow admin to delete any user', () => {
      const permission = ac.can('admin').deleteAny('users');
      expect(permission.granted).toBe(true);
    });

    it('should allow admin to access admin module', () => {
      const permission = ac.can('admin').readAny('admin');
      expect(permission.granted).toBe(true);
    });

    it('should allow admin full CRUD on all modules', () => {
      const modules = ['users', 'demo', 'admin', 'websocket'];
      const actions = ['create', 'read', 'update', 'delete'] as const;

      modules.forEach((module) => {
        actions.forEach((action) => {
          const method = `${action}Any` as const;
          const permission = ac.can('admin')[method](module);
          expect(permission.granted).toBe(true);
        });
      });
    });
  });

  describe('hasPermission helper', () => {
    it('should return true for valid user permission', () => {
      expect(hasPermission('user', 'read', 'demo', false)).toBe(true);
    });

    it('should return false for invalid user permission', () => {
      expect(hasPermission('user', 'delete', 'users', false)).toBe(false);
    });

    it('should return true for user own permission', () => {
      expect(hasPermission('user', 'read', 'users', true)).toBe(true);
    });

    it('should return true for admin permission', () => {
      expect(hasPermission('admin', 'delete', 'users', false)).toBe(true);
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for user role', () => {
      const permissions = getRolePermissions('user');
      expect(permissions).toHaveProperty('users');
      expect(permissions).toHaveProperty('demo');
      expect(permissions).toHaveProperty('websocket');
    });

    it('should return all permissions for admin role', () => {
      const permissions = getRolePermissions('admin');
      expect(permissions).toHaveProperty('users');
      expect(permissions).toHaveProperty('demo');
      expect(permissions).toHaveProperty('admin');
      expect(permissions).toHaveProperty('websocket');
    });

    it('should throw error for unknown role', () => {
      expect(() => getRolePermissions('unknown')).toThrow();
    });
  });
});
