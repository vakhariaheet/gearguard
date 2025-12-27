/**
 * Query Parameter Utilities
 *
 * Helper functions for safely accessing query parameters with TypeScript
 */

/**
 * Safely get a query parameter value
 */
export const getQueryParam = (
  queryParams: Record<string, string | undefined> | null,
  key: string
): string | undefined => {
  return queryParams?.[key];
};

/**
 * Safely get multiple query parameter values
 */
export const getQueryParams = (
  queryParams: Record<string, string | undefined> | null,
  keys: string[]
): Record<string, string | undefined> => {
  const result: Record<string, string | undefined> = {};

  if (!queryParams) return result;

  keys.forEach((key) => {
    result[key] = queryParams[key];
  });

  return result;
};

/**
 * Get path parameter safely
 */
export const getPathParam = (
  pathParams: Record<string, string | undefined> | null,
  key: string
): string | undefined => {
  return pathParams?.[key];
};

/**
 * Get JWT claims safely
 */
export const getJwtClaims = (
  requestContext: any
): { userId?: string; email?: string; role?: string } => {
  const claims = requestContext?.authorizer?.['jwt']?.claims;

  return {
    userId: claims?.userid,
    email: claims?.email,
    role: claims?.role,
  };
};

/**
 * Handle unknown errors safely
 */
export const handleError = (error: unknown): { message: string; stack?: string } => {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
  };
};

/**
 * Validate date string and return Date object
 */
export const parseDate = (dateString: string | undefined): Date | null => {
  if (!dateString) return null;

  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};
