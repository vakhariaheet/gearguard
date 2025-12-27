import { AuthenticatedAPIGatewayEvent } from '../../../../src/shared/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

// Mock RBAC middleware
jest.mock('../../../../src/shared/auth/rbacMiddleware', () => ({
  withRbac: jest.fn((handler) => handler),
}));

import { handler } from '../../../../src/modules/demo/handlers/userOnly';

describe('userOnly Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user access for regular user', async () => {
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'user_123',
              email: 'user@test.com',
              role: 'user',
            },
          },
        },
      },
    } as AuthenticatedAPIGatewayEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.OK);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.message).toBe('Hello User!');
    expect(body.data.role).toBe('user');
    expect(body.data.userId).toBe('user_123');
    expect(body.data.email).toBe('user@test.com');
    expect(body.data.accessLevel).toBe('user');
    expect(body.data.timestamp).toBeDefined();
  });

  it('should return user access for admin user', async () => {
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
    expect(body.data.message).toBe('Hello User!');
    expect(body.data.role).toBe('admin');
    expect(body.data.userId).toBe('admin_123');
    expect(body.data.email).toBe('admin@test.com');
    expect(body.data.accessLevel).toBe('user');
    expect(body.data.timestamp).toBeDefined();
  });
});
