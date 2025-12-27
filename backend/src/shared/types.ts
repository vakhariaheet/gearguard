import { APIGatewayProxyEventV2 } from 'aws-lambda';

/**
 * Authenticated context extracted from JWT claims
 * This is populated by the HTTP API JWT Authorizer from Clerk
 */
export interface AuthenticatedContext {
  /** User ID from Clerk (sub claim or custom userid claim) */
  userId: string;
  /** User's email address */
  email: string;
  /** User's role from public_metadata */
  role: string;
}

/**
 * JWT claims structure from HTTP API v2 JWT Authorizer
 * The claims are available at event.requestContext.authorizer.jwt.claims
 */
export interface JwtClaims {
  /** Subject - Clerk user ID */
  sub: string;
  /** Custom user ID claim (if configured in Clerk JWT template) */
  userid?: string;
  /** User email */
  email?: string;
  /** User role from public_metadata */
  role?: string;
  /** Metadata object (if using nested claim in Clerk) */
  metadata?: {
    role?: string;
  };
  /** Issued at timestamp */
  iat?: number;
  /** Expiration timestamp */
  exp?: number;
  /** Issuer (Clerk instance URL) */
  iss?: string;
  /** Audience */
  aud?: string | string[];
}

/**
 * Extended HTTP API v2 event with typed authorizer context
 */
export interface AuthenticatedAPIGatewayEvent extends Omit<APIGatewayProxyEventV2, 'requestContext'> {
  requestContext: APIGatewayProxyEventV2['requestContext'] & {
    authorizer?: {
      jwt?: {
        claims: JwtClaims;
        scopes?: string[];
      };
    };
  };
}

/**
 * Extract authentication context from HTTP API v2 event
 * 
 * @param event - API Gateway v2 event with JWT authorizer
 * @returns AuthenticatedContext with userId, email, and role
 * 
 * @example
 * ```typescript
 * const { userId, email, role } = getAuthContext(event);
 * console.log(`User ${userId} with role ${role} is accessing the resource`);
 * ```
 */
export const getAuthContext = (event: AuthenticatedAPIGatewayEvent): AuthenticatedContext => {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  
  if (!claims) {
    throw new Error('JWT claims not found in request context. Ensure JWT authorizer is configured.');
  }

  // Extract userId: prefer custom 'userid' claim, fallback to 'sub'
  const userId = claims.userid || claims.sub;
  
  if (!userId) {
    throw new Error('User ID not found in JWT claims');
  }

  // Extract email
  const email = claims.email || '';

  // Extract role: check multiple possible locations
  // 1. Direct 'role' claim (recommended)
  // 2. Nested in 'metadata.role' (Clerk's default metadata structure)
  // 3. Default to 'user' if not found
  const role = claims.role || claims.metadata?.role || 'user';

  return {
    userId,
    email,
    role,
  };
};

/**
 * Type guard to check if event has valid authentication context
 */
export const isAuthenticated = (event: APIGatewayProxyEventV2): event is AuthenticatedAPIGatewayEvent => {
  const authEvent = event as AuthenticatedAPIGatewayEvent;
  return !!(authEvent.requestContext?.authorizer?.jwt?.claims?.sub);
};

/**
 * Repository interface for ownership checking
 * Any repository used with ownershipMiddleware must implement this
 */
export interface OwnershipRepository<T> {
  getById(id: string): Promise<T | null>;
}

/**
 * WebSocket API Gateway event structure
 */
export interface WebSocketAPIGatewayEvent {
  requestContext: {
    connectionId: string;
    routeKey: string;
    eventType: 'CONNECT' | 'DISCONNECT' | 'MESSAGE';
    requestTime: string;
    requestTimeEpoch: number;
    apiId: string;
    stage: string;
    domainName?: string;
    authorizer?: {
      jwt?: {
        claims: JwtClaims;
        scopes?: string[];
      };
    };
  };
  body?: string;
  headers?: Record<string, string>;
  multiValueHeaders?: Record<string, string[]>;
  queryStringParameters?: Record<string, string>;
  multiValueQueryStringParameters?: Record<string, string[]>;
  pathParameters?: Record<string, string>;
  stageVariables?: Record<string, string>;
  isBase64Encoded?: boolean;
}

/**
 * Authenticated WebSocket event with typed authorizer context
 */
export interface AuthenticatedWebSocketEvent extends WebSocketAPIGatewayEvent {
  requestContext: WebSocketAPIGatewayEvent['requestContext'] & {
    authorizer: {
      jwt: {
        claims: JwtClaims;
        scopes?: string[];
      };
    };
  };
}

/**
 * Extract authentication context from WebSocket event
 */
export const getWebSocketAuthContext = (event: AuthenticatedWebSocketEvent): AuthenticatedContext => {
  const claims = event.requestContext?.authorizer?.jwt?.claims;
  
  if (!claims) {
    throw new Error('JWT claims not found in WebSocket request context. Ensure JWT authorizer is configured.');
  }

  // Extract userId: prefer custom 'userid' claim, fallback to 'sub'
  const userId = claims.userid || claims.sub;
  
  if (!userId) {
    throw new Error('User ID not found in JWT claims');
  }

  // Extract email
  const email = claims.email || '';

  // Extract role
  const role = claims.role || claims.metadata?.role || 'user';

  return {
    userId,
    email,
    role,
  };
};

/**
 * Handler type for Lambda functions
 */
export type LambdaHandler<TEvent = AuthenticatedAPIGatewayEvent, TResult = unknown> = (
  event: TEvent
) => Promise<TResult>;

/**
 * Handler type for WebSocket Lambda functions
 */
export type WebSocketHandler<TResult = unknown> = (
  event: AuthenticatedWebSocketEvent
) => Promise<TResult>;
