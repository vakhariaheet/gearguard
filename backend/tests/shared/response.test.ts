import {
  successResponse,
  errorResponse,
  commonErrors,
  HTTP_STATUS,
  handleAsyncError,
} from '../../src/shared/response';

describe('Response Utilities', () => {
  describe('successResponse', () => {
    it('should create a successful response with default status code', () => {
      const data = { message: 'Success' };
      const response = successResponse(data);

      expect(response.statusCode).toBe(HTTP_STATUS.OK);
      expect(response.headers).toHaveProperty('Content-Type', 'application/json');
      expect(response.headers).toHaveProperty('Access-Control-Allow-Origin', '*');

      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toEqual(data);
      expect(body.meta).toHaveProperty('timestamp');
    });

    it('should create a successful response with custom status code', () => {
      const data = { id: '123' };
      const response = successResponse(data, HTTP_STATUS.CREATED);

      expect(response.statusCode).toBe(HTTP_STATUS.CREATED);
      const body = JSON.parse(response.body);
      expect(body.data).toEqual(data);
    });

    it('should include additional headers', () => {
      const response = successResponse({}, HTTP_STATUS.OK, { 'X-Custom': 'value' });
      expect(response.headers).toHaveProperty('X-Custom', 'value');
    });
  });

  describe('errorResponse', () => {
    it('should create an error response', () => {
      const response = errorResponse('TEST_ERROR', 'Test error message', HTTP_STATUS.BAD_REQUEST);

      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error message',
      });
    });

    it('should include error details when provided', () => {
      const details = { field: 'email', reason: 'invalid format' };
      const response = errorResponse(
        'VALIDATION_ERROR',
        'Validation failed',
        HTTP_STATUS.BAD_REQUEST,
        details
      );

      const body = JSON.parse(response.body);
      expect(body.error.details).toEqual(details);
    });
  });

  describe('commonErrors', () => {
    it('should create badRequest error', () => {
      const response = commonErrors.badRequest('Invalid input');
      expect(response.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('BAD_REQUEST');
    });

    it('should create unauthorized error', () => {
      const response = commonErrors.unauthorized();
      expect(response.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    });

    it('should create forbidden error', () => {
      const response = commonErrors.forbidden();
      expect(response.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    });

    it('should create notFound error', () => {
      const response = commonErrors.notFound('User');
      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('User not found');
    });

    it('should create conflict error', () => {
      const response = commonErrors.conflict();
      expect(response.statusCode).toBe(HTTP_STATUS.CONFLICT);
    });

    it('should create validationError', () => {
      const response = commonErrors.validationError('Invalid data', { field: 'email' });
      expect(response.statusCode).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('should create internalServerError', () => {
      const response = commonErrors.internalServerError();
      expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
  });

  describe('handleAsyncError', () => {
    it('should return formatted response if error is already formatted', () => {
      const formattedError = {
        statusCode: 400,
        body: JSON.stringify({ error: 'test' }),
        headers: {},
      };
      const response = handleAsyncError(formattedError);
      expect(response).toEqual(formattedError);
    });

    it('should handle ConditionalCheckFailedException', () => {
      const error = { name: 'ConditionalCheckFailedException' };
      const response = handleAsyncError(error);
      expect(response.statusCode).toBe(HTTP_STATUS.CONFLICT);
    });

    it('should handle ResourceNotFoundException', () => {
      const error = { name: 'ResourceNotFoundException' };
      const response = handleAsyncError(error);
      expect(response.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    });

    it('should handle ValidationException', () => {
      const error = { name: 'ValidationException', message: 'Invalid input' };
      const response = handleAsyncError(error);
      expect(response.statusCode).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    it('should handle generic errors', () => {
      const error = new Error('Something went wrong');
      const response = handleAsyncError(error);
      expect(response.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    });
  });
});
