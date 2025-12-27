module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only changes
        'style',    // Changes that don't affect code meaning (formatting, etc)
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding or updating tests
        'build',    // Changes to build system or dependencies
        'ci',       // Changes to CI configuration
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Reverts a previous commit
      ],
    ],
    'subject-case': [0], // Allow any case for subject
    'scope-enum': [
      2,
      'always',
      [
        'backend',
        'client',
        'api',
        'auth',
        'users',
        'websocket',
        'deploy',
        'config',
        'deps',
        'docs',
        'tests',
      ],
    ],
  },
};
