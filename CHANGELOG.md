# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Multi-stage deployment strategy (dev-dhruv, dev-tirth, dev-pooja, dev-heet, test, prod)
- Conventional commits with commitlint
- Git hooks with Husky (pre-commit, commit-msg)
- Automated CI/CD with GitHub Actions
- PR and issue templates
- Contributing guidelines
- EditorConfig for consistent coding styles
- Prettier for code formatting
- Lint-staged for pre-commit checks
- Setup script for automated project configuration

### Changed

- Simplified environment configuration (single .env for all dev stages)
- Improved deployment script with stage name normalization
- Updated documentation with deployment workflow

### Fixed

- N/A

## [1.0.0] - 2024-12-17

### Added

- Initial project setup
- Backend API with AWS Lambda and API Gateway
- Clerk authentication with JWT
- Role-based access control (RBAC)
- User management (list, invite, ban, delete, role change)
- WebSocket support for real-time communication
- Admin dashboard
- React frontend with Vite
- TypeScript throughout
- Jest testing setup
- Serverless Framework deployment
- Custom domain support with Cloudflare DNS

### Security

- JWT-based authentication
- Role-based authorization
- Secure environment variable handling

---

## How to Update This Changelog

When making changes, add them under the `[Unreleased]` section in the appropriate category:

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes

When releasing a new version:

1. Change `[Unreleased]` to the version number and date
2. Create a new `[Unreleased]` section above it
3. Update the version links at the bottom

Example commit:

```bash
feat(users): add user search functionality

- Add search endpoint
- Add search UI component
- Update user list to support filtering
```

Then update CHANGELOG.md:

```markdown
## [Unreleased]

### Added

- User search functionality with filtering
```
