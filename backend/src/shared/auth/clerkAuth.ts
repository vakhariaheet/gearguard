/**
 * Clerk JWT Authentication Helper
 * 
 * Provides JWT token verification for WebSocket and other services
 */

import { verifyToken } from '@clerk/backend';

export interface ClerkUser {
  sub: string; // User ID
  email?: string;
  role?: string;
  iat?: number;
  exp?: number;
}

/**
 * Verify Clerk JWT token
 */
export async function verifyClerkJWT(token: string): Promise<ClerkUser | null> {
  try {
    // Remove 'Bearer ' prefix if present
    const cleanToken = token.replace(/^Bearer\s+/, '');
    
    // Verify the JWT token with Clerk
    const payload = await verifyToken(cleanToken, {
      secretKey: process.env['CLERK_SECRET_KEY']!,
      audience: process.env['CLERK_AUDIENCE'],
    });

    if (!payload || !payload.sub) {
      console.warn('[ClerkAuth] Invalid token payload');
      return null;
    }

    // Extract user information from the token
    const user: ClerkUser = {
      sub: payload.sub,
      email: payload['email'] as string,
      role: payload['role'] as string || 'user',
      iat: payload.iat as number,
      exp: payload.exp as number,
    };

    console.debug('[ClerkAuth] Token verified successfully', { 
      userId: user.sub, 
      role: user.role 
    });

    return user;
  } catch (error) {
    console.error('[ClerkAuth] Token verification failed:', error);
    return null;
  }
}

/**
 * Extract user ID from verified token
 */
export function getUserIdFromToken(user: ClerkUser): string {
  return user.sub;
}

/**
 * Check if user has required role
 */
export function hasRole(user: ClerkUser, requiredRole: string): boolean {
  return user.role === requiredRole || user.role === 'admin';
}

/**
 * Check if user is admin
 */
export function isAdmin(user: ClerkUser): boolean {
  return user.role === 'admin';
}