# Contributing to Odoo Xadani

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Maintain a professional environment

## Getting Started

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/your-username/odooxadani.git
   cd odooxadani
   ```

2. **Install dependencies:**
   ```bash
   # Backend
   cd backend
   npm install  # or bun install
   
   # Client
   cd ../client
   npm install  # or bun install
   ```

3. **Set up environment:**
   ```bash
   cd backend
   cp .env.example .env
   # Fill in your credentials
   ```

4. **Create a feature branch:**
   ```bash
   git checkout -b feat/your-feature-name
   ```

## Development Workflow

### 1. Branch Naming Convention

Use descriptive branch names with prefixes:

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or updates
- `chore/` - Maintenance tasks

Examples:
```bash
feat/user-authentication
fix/websocket-connection-issue
docs/update-deployment-guide
refactor/clean-architecture-users
```

### 2. Development Process

1. **Make your changes** in your feature branch
2. **Test locally:**
   ```bash
   # Backend
   cd backend
   npm test
   npm run typecheck
   npm run lint
   
   # Deploy to your dev stage
   ./deploy.sh heet  # or your assigned stage
   ```

3. **Commit your changes** (see Commit Guidelines below)

4. **Push to your fork:**
   ```bash
   git push origin feat/your-feature-name
   ```

5. **Create a Pull Request** to the `test` branch

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/) for clear and structured commit messages.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system or dependency changes
- `ci`: CI/CD configuration changes
- `chore`: Other changes (maintenance, etc)
- `revert`: Revert a previous commit

### Scopes

- `backend` - Backend changes
- `client` - Frontend changes
- `api` - API changes
- `auth` - Authentication/authorization
- `users` - User management
- `websocket` - WebSocket functionality
- `deploy` - Deployment configuration
- `config` - Configuration changes
- `deps` - Dependency updates
- `docs` - Documentation
- `tests` - Test files

### Examples

```bash
# Good commit messages
feat(auth): add JWT token refresh mechanism
fix(websocket): resolve connection timeout issue
docs(deploy): update multi-stage deployment guide
refactor(users): extract user service to separate module
test(api): add integration tests for user endpoints
chore(deps): update AWS SDK to v3.950.0

# With body and footer
feat(users): implement user invitation system

- Add invitation creation endpoint
- Add invitation revocation endpoint
- Add email notification service
- Update user service with invitation logic

Closes #123
```

### Commit Message Rules

1. **Use imperative mood** in the subject line ("add" not "added")
2. **Don't capitalize** the first letter of the subject
3. **No period** at the end of the subject
4. **Limit subject line** to 72 characters
5. **Separate subject from body** with a blank line
6. **Wrap body** at 72 characters
7. **Use body** to explain what and why, not how

### Breaking Changes

For breaking changes, add `BREAKING CHANGE:` in the footer:

```bash
feat(api): change user endpoint response format

BREAKING CHANGE: User endpoint now returns { data: user } instead of user directly
```

## Pull Request Process

### 1. Before Creating a PR

- [ ] Code follows project coding standards
- [ ] All tests pass locally
- [ ] TypeScript compiles without errors
- [ ] Linting passes without errors
- [ ] Changes are tested in your dev stage
- [ ] Documentation is updated if needed
- [ ] Commit messages follow conventional commits

### 2. PR Title

Use the same format as commit messages:

```
feat(users): add user invitation system
fix(websocket): resolve connection timeout
docs(deploy): update deployment guide
```

### 3. PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Deployed to dev stage: dev-heet
- [ ] All tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated
- [ ] Dependent changes merged

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Closes #123
```

### 4. Review Process

1. **Create PR** to `test` branch
2. **Automated checks** must pass (linting, tests, build)
3. **Code review** by at least one team member
4. **Address feedback** and push updates
5. **Approval** from reviewer(s)
6. **Merge** to `test` branch
7. **Deploy to test** environment for QA
8. **After QA approval**, create PR from `test` to `main`
9. **Deploy to production** after merge to `main`

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define proper types (avoid `any`)
- Use interfaces for object shapes
- Use enums for constants
- Document complex functions with JSDoc

### Code Style

- Use 2 spaces for indentation
- Use single quotes for strings
- Add semicolons
- Use trailing commas in objects/arrays
- Max line length: 100 characters
- Use meaningful variable names

### File Organization

```
backend/src/
├── modules/           # Feature modules
│   ├── users/
│   │   ├── handlers/  # Lambda handlers
│   │   ├── services/  # Business logic
│   │   ├── types.ts   # Type definitions
│   │   └── functions/ # Serverless function configs
│   └── ...
├── shared/            # Shared utilities
│   ├── auth/
│   ├── utils/
│   └── types/
└── ...
```

### Testing

- Write unit tests for services
- Write integration tests for handlers
- Aim for >80% code coverage
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      // Arrange
      const userData = { email: 'test@example.com', name: 'Test User' };
      
      // Act
      const result = await userService.createUser(userData);
      
      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
    });
  });
});
```

## Git Hooks

This project uses Husky for git hooks:

- **pre-commit**: Runs linting and formatting on staged files
- **commit-msg**: Validates commit message format

If you need to bypass hooks (not recommended):
```bash
git commit --no-verify -m "your message"
```

## Questions?

If you have questions or need help:

1. Check existing documentation
2. Search existing issues
3. Ask in team chat
4. Create a new issue with the `question` label

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
