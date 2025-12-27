module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',

  // Node environment for Lambda functions
  testEnvironment: 'node',

  // Test file locations - tests folder mirrors src structure
  roots: ['<rootDir>/tests'],

  // Test file patterns
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.spec.ts'],

  // Supported file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Coverage collection configuration
  collectCoverageFrom: [
    'src/**/*.ts',
    // Exclude type definition files
    '!src/**/*.d.ts',
    // Exclude YAML configuration files
    '!src/**/*.yml',
    '!src/**/*.yaml',
    // Exclude test directories
    '!src/**/__tests__/**',
    // Exclude type-only files (interfaces, types, enums)
    '!src/**/types.ts',
    '!src/shared/types.ts',
    // Exclude barrel exports (index files that just re-export)
    '!src/**/index.ts',
    '!src/shared/clients/index.ts',
    // Exclude system files
    '!src/**/.DS_Store',
  ],

  // Coverage output directory
  coverageDirectory: 'coverage',

  // Coverage report formats
  coverageReporters: [
    'text', // Console output
    'text-summary', // Summary in console
    'lcov', // For CI/CD tools
    'html', // HTML report
    'json-summary', // JSON summary
  ],

  // Coverage thresholds - tests will fail if below these percentages
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 60,
      functions: 70,
      lines: 70,
    },
    // Higher thresholds for critical modules
    './src/shared/auth/**/*.ts': {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
    './src/config/**/*.ts': {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },

  // Force coverage collection for all matching files
  forceCoverageMatch: ['**/src/**/*.ts'],

  // TypeScript transformation
  transform: {
    '^.+\\.ts': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },

  // Setup file to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Test timeout (10 seconds)
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Automatically clear mock calls and instances between tests
  clearMocks: true,

  // Reset mock state between tests
  resetMocks: true,

  // Restore original implementations between tests
  restoreMocks: true,

  // Collect coverage from untested files
  collectCoverage: true,

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/.serverless/'],

  // Coverage ignore patterns
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/', '/.serverless/', '/tests/'],
};
