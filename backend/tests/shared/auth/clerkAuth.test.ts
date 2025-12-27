import {
  verifyClerkJWT,
  getUserIdFromToken,
  hasRole,
  isAdmin,
} from '../../../src/shared/auth/clerkAuth';
import { verifyToken } from '@clerk/backend';

jest.mock('@clerk/backend', () => ({
  verifyToken: jest.fn(),
}));

describe('Clerk Auth', () => {
  describe('verifyClerkJWT', () => {
    it('should verify valid JWT token', async () => {
      const mockPayload = {
        sub: 'user_123',
        email: 'user@test.com',
        role: 'user',
        iat: 1234567890,
        exp: 1234567990,
      };

      (verifyToken as jest.Mock).mockResolvedValue(mockPayload);

      const result = await verifyClerkJWT('valid_token');

      expect(result).toEqual({
        sub: 'user_123',
        email: 'user@test.com',
        role: 'user',
        iat: 1234567890,
        exp: 1234567990,
      });
    });

    it('should handle Bearer prefix', async () => {
      const mockPayload = {
        sub: 'user_123',
        email: 'user@test.com',
      };

      (verifyToken as jest.Mock).mockResolvedValue(mockPayload);

      await verifyClerkJWT('Bearer valid_token');

      expect(verifyToken).toHaveBeenCalledWith('valid_token', expect.any(Object));
    });

    it('should return null for invalid token', async () => {
      (verifyToken as jest.Mock).mockRejectedValue(new Error('Invalid token'));

      const result = await verifyClerkJWT('invalid_token');

      expect(result).toBeNull();
    });

    it('should return null for token without sub', async () => {
      (verifyToken as jest.Mock).mockResolvedValue({ email: 'user@test.com' });

      const result = await verifyClerkJWT('token_without_sub');

      expect(result).toBeNull();
    });
  });

  describe('getUserIdFromToken', () => {
    it('should extract user ID from token', () => {
      const user = {
        sub: 'user_123',
        email: 'user@test.com',
        role: 'user',
      };

      const userId = getUserIdFromToken(user);

      expect(userId).toBe('user_123');
    });
  });

  describe('hasRole', () => {
    it('should return true for matching role', () => {
      const user = {
        sub: 'user_123',
        role: 'user',
      };

      expect(hasRole(user, 'user')).toBe(true);
    });

    it('should return true for admin accessing any role', () => {
      const user = {
        sub: 'admin_123',
        role: 'admin',
      };

      expect(hasRole(user, 'user')).toBe(true);
    });

    it('should return false for non-matching role', () => {
      const user = {
        sub: 'user_123',
        role: 'user',
      };

      expect(hasRole(user, 'admin')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', () => {
      const user = {
        sub: 'admin_123',
        role: 'admin',
      };

      expect(isAdmin(user)).toBe(true);
    });

    it('should return false for non-admin user', () => {
      const user = {
        sub: 'user_123',
        role: 'user',
      };

      expect(isAdmin(user)).toBe(false);
    });
  });
});
