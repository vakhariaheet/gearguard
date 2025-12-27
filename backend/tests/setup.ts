/**
 * Jest Test Setup
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'ap-south-1';
process.env.STAGE = 'test';
process.env.CLERK_SECRET_KEY = 'test_clerk_secret_key';
process.env.CLERK_AUDIENCE = 'test_audience';
process.env.CLERK_REDIRECT_URL = 'http://localhost:3000/accept-invite';
process.env.WEBSOCKET_API_ENDPOINT = 'wss://test.execute-api.ap-south-1.amazonaws.com/test';
process.env.WEBSOCKET_API_ID = 'test-api-id';
process.env.LOG_LEVEL = 'ERROR'; // Reduce noise in tests

// Mock console methods to reduce test output noise (compatible with Bun)
const mockFn = () => {};
global.console = {
  ...console,
  log: mockFn,
  debug: mockFn,
  info: mockFn,
  warn: mockFn,
  error: mockFn,
};
