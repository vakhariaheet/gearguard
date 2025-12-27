import { Logger, LogLevel, createLogger } from '../../src/shared/logger';

describe('Logger', () => {
  let logger: Logger;
  let consoleSpy: {
    log: jest.SpyInstance;
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };
  let originalLogLevel: string | undefined;

  beforeEach(() => {
    // Save original LOG_LEVEL and set to DEBUG for testing
    originalLogLevel = process.env.LOG_LEVEL;
    process.env.LOG_LEVEL = 'DEBUG';

    // Spy on console methods instead of replacing global.console
    consoleSpy = {
      log: jest.spyOn(console, 'log').mockImplementation(() => {}),
      debug: jest.spyOn(console, 'debug').mockImplementation(() => {}),
      info: jest.spyOn(console, 'info').mockImplementation(() => {}),
      warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
      error: jest.spyOn(console, 'error').mockImplementation(() => {}),
    };

    logger = new Logger({ service: 'test-service' });
  });

  afterEach(() => {
    // Restore all console spies
    Object.values(consoleSpy).forEach((spy) => spy.mockRestore());
    // Restore original LOG_LEVEL
    if (originalLogLevel !== undefined) {
      process.env.LOG_LEVEL = originalLogLevel;
    } else {
      delete process.env.LOG_LEVEL;
    }
  });

  describe('log levels', () => {
    it('should log debug messages', () => {
      logger.debug('Debug message', { data: 'test' });
      expect(consoleSpy.debug).toHaveBeenCalled();
    });

    it('should log info messages', () => {
      logger.info('Info message', { data: 'test' });
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should log warn messages', () => {
      logger.warn('Warning message', { data: 'test' });
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error('Error message', error);
      expect(consoleSpy.error).toHaveBeenCalled();
    });
  });

  describe('child logger', () => {
    it('should create child logger with additional context', () => {
      const childLogger = logger.child({ module: 'test-module' });
      expect(childLogger).toBeInstanceOf(Logger);

      childLogger.info('Test message');
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('request context', () => {
    it('should set request context', () => {
      logger.setRequestContext('req-123', 'user-456');
      logger.info('Test with context');
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('timing', () => {
    it('should log timing information', () => {
      const endTimer = logger.time('test-operation');
      endTimer();
      // Debug message for start, info message for end
      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('createLogger', () => {
    it('should create module-specific logger', () => {
      const moduleLogger = createLogger('users', { extra: 'context' });
      expect(moduleLogger).toBeInstanceOf(Logger);
    });
  });
});
