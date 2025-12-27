# Project Guidelines

Comprehensive guidelines and best practices for the Odoo Xadani project.

## 📚 Available Guidelines

### [Cheat Sheet](./CHEAT_SHEET.md) 📄

One-page printable reference with the most common patterns:

- Git commands
- Handler/service templates
- Component patterns
- API endpoints
- Status codes
- Common commands
- Code style rules

**When to read:** Print this out or keep it on a second monitor!

### [Quick Reference Card](./QUICK_REFERENCE.md) ⭐

Essential commands, patterns, and conventions for daily development:

- Git commands and workflow
- Backend handler and service patterns
- Frontend component patterns
- API design quick reference
- DynamoDB patterns
- Testing patterns
- Common commands
- Code style rules
- Troubleshooting tips

**When to read:** Keep this open while coding! Perfect for quick lookups.

### [Coding Guidelines](./CODING_GUIDELINES.md)

Comprehensive coding standards and best practices covering:

- TypeScript standards and type safety
- Backend architecture (handlers, services, modules)
- Frontend architecture (components, hooks, state management)
- Code style and formatting
- Testing strategies
- Error handling
- Security best practices
- Performance optimization
- Documentation standards

**When to read:** Before writing any code, when onboarding new developers

### [API Design Guidelines](./API_DESIGN.md)

Best practices for designing consistent REST APIs:

- RESTful design principles
- URL structure and naming
- HTTP methods and status codes
- Request/response formats
- Pagination and filtering
- Authentication and authorization
- Error handling
- API versioning
- Documentation

**When to read:** Before creating new API endpoints, when designing new features

### [Git Workflow Guidelines](./GIT_WORKFLOW.md)

Version control and collaboration best practices:

- Branching strategy
- Commit message conventions
- Pull request process
- Code review guidelines
- Merge strategies
- Git commands reference
- Conflict resolution
- Troubleshooting

**When to read:** Before starting any work, when creating PRs, when reviewing code

### [Infrastructure Guidelines](./INFRASTRUCTURE.md)

AWS services and serverless architecture best practices:

- Serverless architecture principles
- AWS Lambda optimization
- API Gateway configuration
- DynamoDB patterns
- S3, SES, SQS usage
- WebSocket management
- Environment management
- Monitoring and logging
- Cost optimization

**When to read:** When working with AWS services, deploying infrastructure, optimizing performance

## 🚀 Quick Start

### For New Developers

1. **Read in this order:**
   - [Quick Reference](./QUICK_REFERENCE.md) - Bookmark this for daily use!
   - [Git Workflow](./GIT_WORKFLOW.md) - Learn our branching and commit strategy
   - [Coding Guidelines](./CODING_GUIDELINES.md) - Understand our code standards
   - [API Design](./API_DESIGN.md) - Learn how to design APIs
   - [Infrastructure](./INFRASTRUCTURE.md) - Understand AWS and serverless patterns

2. **Set up your environment:**
   - Follow the [main README](../README.md) for setup
   - Configure your editor with ESLint and Prettier
   - Install Git hooks with `npm install`

3. **Start coding:**
   - Create a feature branch
   - Follow coding standards
   - Write tests
   - Submit a PR

### For Experienced Developers

**Quick reference:**

- See [Quick Reference Card](./QUICK_REFERENCE.md) for all essential patterns
- Commit format: `type(scope): subject`
- Branch naming: `type/descriptive-name`
- PR to `test` branch first
- Always use RBAC middleware for protected routes
- Use standard response helpers
- Write tests for critical paths

## 📖 Key Principles

### Code Quality

- Write self-documenting code
- Follow SOLID principles
- Keep functions small and focused
- Use meaningful names
- Avoid magic numbers and strings

### Architecture

- **Backend:** Thin handlers, thick services
- **Frontend:** Small, focused components
- **Separation of concerns:** Clear boundaries between layers
- **Type safety:** Strict TypeScript everywhere

### Collaboration

- Small, focused PRs (< 400 lines)
- Conventional commits
- Thorough code reviews
- Clear documentation
- Regular communication

### Testing

- Unit tests for services
- Integration tests for handlers
- 80%+ coverage on critical paths
- Test edge cases and error conditions

### Security

- Validate all inputs
- Never trust client data
- Use environment variables for secrets
- Implement proper authentication/authorization
- Follow security best practices

## 🔍 Finding What You Need

### I want to...

**Write a new API endpoint:**

1. Read [API Design Guidelines](./API_DESIGN.md)
2. Check [Backend Architecture](./CODING_GUIDELINES.md#backend-architecture)
3. Look at existing handlers for examples

**Create a new React component:**

1. Read [Frontend Architecture](./CODING_GUIDELINES.md#frontend-architecture)
2. Check [Component Best Practices](./CODING_GUIDELINES.md#component-best-practices)
3. Look at existing components for examples

**Fix a bug:**

1. Create a branch: `fix/bug-description`
2. Write a test that reproduces the bug
3. Fix the bug
4. Ensure test passes
5. Submit PR with conventional commit

**Add a new feature:**

1. Create a branch: `feat/feature-name`
2. Follow [Backend](./CODING_GUIDELINES.md#backend-architecture) or [Frontend](./CODING_GUIDELINES.md#frontend-architecture) architecture
3. Write tests
4. Update documentation
5. Submit PR

**Review code:**

1. Read [Code Review Guidelines](./GIT_WORKFLOW.md#code-review)
2. Check against [Coding Standards](./CODING_GUIDELINES.md)
3. Verify tests and documentation
4. Provide constructive feedback

**Resolve merge conflicts:**

1. Read [Conflict Resolution](./GIT_WORKFLOW.md#conflict-resolution)
2. Communicate with team
3. Test after resolution

## 📝 Checklists

### Before Committing

- [ ] Code follows style guidelines
- [ ] TypeScript compiles without errors
- [ ] Linting passes
- [ ] Tests pass
- [ ] No console.log statements (use logger)
- [ ] No commented-out code
- [ ] No secrets in code
- [ ] Commit message follows convention

### Before Creating PR

- [ ] Branch is up to date with base
- [ ] All tests pass
- [ ] Code is self-reviewed
- [ ] Documentation is updated
- [ ] Screenshots added (if UI changes)
- [ ] PR description is complete
- [ ] Related issues are linked
- [ ] Deployed and tested in dev stage

### Before Merging PR

- [ ] All review comments addressed
- [ ] CI checks pass
- [ ] At least one approval
- [ ] No merge conflicts
- [ ] Documentation is up to date
- [ ] Breaking changes are documented

## 🛠️ Tools and Configuration

### Editor Setup

**VS Code (Recommended):**

- Install ESLint extension
- Install Prettier extension
- Install TypeScript extension
- Configure format on save

**Settings:**

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Git Configuration

```bash
# Set up user info
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up default branch
git config --global init.defaultBranch main

# Set up pull strategy
git config --global pull.rebase true
```

### Useful Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc
alias gs='git status'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline --graph'
alias gco='git checkout'
alias gcb='git checkout -b'
```

## 📚 Additional Resources

### Internal Documentation

- [Main README](../README.md) - Project overview and setup
- [Contributing Guide](../CONTRIBUTING.md) - How to contribute
- [Backend README](../backend/README.md) - Backend-specific docs
- [Deployment Guide](../backend/DEPLOYMENT.md) - Deployment instructions

### External Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [REST API Best Practices](https://restfulapi.net/)
- [Clean Code](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)

## 🤝 Contributing to Guidelines

Found something missing or incorrect? Guidelines need updating?

1. Create a branch: `docs/update-guidelines`
2. Make your changes
3. Submit a PR with clear explanation
4. Get team approval

## 💡 Tips

### For Better Code

- Read code before writing code
- Refactor as you go
- Write tests first (TDD)
- Keep it simple (KISS)
- Don't repeat yourself (DRY)

### For Better Collaboration

- Communicate early and often
- Ask questions when unclear
- Share knowledge with team
- Review others' code thoughtfully
- Accept feedback gracefully

### For Better Productivity

- Use keyboard shortcuts
- Learn Git commands
- Automate repetitive tasks
- Take breaks
- Stay organized

## 📞 Getting Help

**Questions about:**

- **Code standards:** Check [Coding Guidelines](./CODING_GUIDELINES.md)
- **API design:** Check [API Design Guidelines](./API_DESIGN.md)
- **Git workflow:** Check [Git Workflow Guidelines](./GIT_WORKFLOW.md)
- **Setup issues:** Check [Main README](../README.md)
- **Deployment:** Check [Deployment Guide](../backend/DEPLOYMENT.md)

**Still stuck?**

- Ask in team chat
- Create a GitHub issue
- Pair program with a teammate
- Schedule a code review session

---

**Remember:** These guidelines are here to help, not hinder. If something doesn't make sense or could be improved, let's discuss it as a team!
