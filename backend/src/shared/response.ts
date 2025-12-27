import { APIGatewayProxyResult } from "aws-lambda";

// Standard HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Common headers for CORS and security
const COMMON_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
  "Access-Control-Allow-Methods": "GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
} as const;

// Response interface for consistent error handling
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/**
 * Create a successful API response
 */
export const successResponse = <T>(
  data: T,
  statusCode: number = HTTP_STATUS.OK,
  additionalHeaders: Record<string, string> = {}
): APIGatewayProxyResult => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return {
    statusCode,
    headers: { ...COMMON_HEADERS, ...additionalHeaders },
    body: JSON.stringify(response),
  };
};

/**
 * Create an error API response
 */
export const errorResponse = (
  code: string,
  message: string,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  details?: any,
  additionalHeaders: Record<string, string> = {}
): APIGatewayProxyResult => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return {
    statusCode,
    headers: { ...COMMON_HEADERS, ...additionalHeaders },
    body: JSON.stringify(response),
  };
};

/**
 * Common error responses
 */
export const commonErrors = {
  badRequest: (message: string = "Bad Request", details?: any) =>
    errorResponse("BAD_REQUEST", message, HTTP_STATUS.BAD_REQUEST, details),

  unauthorized: (message: string = "Unauthorized") =>
    errorResponse("UNAUTHORIZED", message, HTTP_STATUS.UNAUTHORIZED),

  forbidden: (message: string = "Forbidden") =>
    errorResponse("FORBIDDEN", message, HTTP_STATUS.FORBIDDEN),

  notFound: (resource: string = "Resource") =>
    errorResponse("NOT_FOUND", `${resource} not found`, HTTP_STATUS.NOT_FOUND),

  conflict: (message: string = "Resource already exists") =>
    errorResponse("CONFLICT", message, HTTP_STATUS.CONFLICT),

  validationError: (message: string = "Validation failed", details?: any) =>
    errorResponse("VALIDATION_ERROR", message, HTTP_STATUS.UNPROCESSABLE_ENTITY, details),

  internalServerError: (message: string = "Internal server error", details?: any) =>
    errorResponse("INTERNAL_SERVER_ERROR", message, HTTP_STATUS.INTERNAL_SERVER_ERROR, details),
};

/**
 * Handle async function errors consistently
 */
export const handleAsyncError = (error: any): APIGatewayProxyResult => {
  console.error("Unhandled error:", error);
  
  // If it's already a formatted API response, return it
  if (error.statusCode && error.body) {
    return error;
  }

  // Handle common AWS errors
  if (error.name === "ConditionalCheckFailedException") {
    return commonErrors.conflict("Resource already exists or condition not met");
  }

  if (error.name === "ResourceNotFoundException") {
    return commonErrors.notFound();
  }

  if (error.name === "ValidationException") {
    return commonErrors.validationError(error.message);
  }

  // Default to internal server error
  return commonErrors.internalServerError(
    process.env['NODE_ENV'] === "production" 
      ? "An unexpected error occurred" 
      : error.message
  );
};