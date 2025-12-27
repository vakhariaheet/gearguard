import { AuthenticatedAPIGatewayEvent } from '../../../../src/shared/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock RBAC middleware
jest.mock('../../../../src/shared/auth/rbacMiddleware', () => ({
  withRbac: jest.fn((handler) => handler),
}));

import { handler } from '../../../../src/modules/demo/handlers/adminOnly';

describe('adminOnly Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return admin access granted for admin user', async () => {
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'admin_123',
              email: 'admin@test.com',
              role: 'admin',
            },
          },
        },
      },
    } as AuthenticatedAPIGatewayEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.OK);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Admin Access Granted');
    expect(body.data.role).toBe('admin');
    expect(body.data.userId).toBe('admin_123');
    expect(body.data.email).toBe('admin@test.com');
    expect(body.data.accessLevel).toBe('admin');
    expect(body.data.adminCapabilities).toEqual([
      'View all users',
      'Modify any user',
      'Delete users',
      'Access system settings',
      'View audit logs',
    ]);
    expect(body.data.timestamp).toBeDefined();
  });
});
