import { handler } from '../../../../src/modules/demo/handlers/whoami';
import { AuthenticatedAPIGatewayEvent } from '../../../../src/shared/types';
import { HTTP_STATUS } from '../../../../src/shared/response';

describe('Whoami Handler', () => {
  it('should return user info and permissions for authenticated user', async () => {
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'user_123',
              email: 'user@test.com',
              role: 'user',
              iss: 'https://clerk.test.com',
              aud: 'test-audience',
              exp: 1234567890,
              iat: 1234567800,
            },
          },
        },
      },
    } as AuthenticatedAPIGatewayEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.OK);
    const body = JSON.parse(response.body);
    expect(body.success).toBe(true);
    expect(body.data.user).toEqual({
      userId: 'user_123',
      email: 'user@test.com',
      role: 'user',
    });
    expect(body.data.permissions).toBeDefined();
    expect(body.data.jwtClaims).toBeDefined();
  });

  it('should return admin permissions for admin user', async () => {
    const event = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'admin_123',
              email: 'admin@test.com',
              role: 'admin',
              iss: 'https://clerk.test.com',
              aud: 'test-audience',
              exp: 1234567890,
              iat: 1234567800,
            },
          },
        },
      },
    } as AuthenticatedAPIGatewayEvent;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.OK);
    const body = JSON.parse(response.body);
    expect(body.data.user.role).toBe('admin');
    expect(body.data.permissions).toHaveProperty('admin');
  });

  it('should handle missing JWT claims', async () => {
    const event = {
      requestContext: {
        authorizer: {},
      },
    } as any;

    const response = await handler(event);

    expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
  });
});
