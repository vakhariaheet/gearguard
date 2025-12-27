# Odoo Xadani

Production-grade serverless application with authentication, admin dashboard, and real-time features.

[![CI](https://github.com/your-org/odooxadani/workflows/CI/badge.svg)](https://github.com/your-org/odooxadani/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ (see `.nvmrc`)
- AWS Account with credentials configured
- Clerk account (free tier works)
- jq (for deployment script)

### Automated Setup

Run the setup script to configure everything automatically:

```bash
chmod +x setup.sh
./setup.sh
```

This will:

- Install all dependencies
- Set up Git hooks (Husky)
- Create environment files
- Configure the project

### Manual Setup

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment variables:**

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your credentials

# Client
cd ../client
cp .env.example .env.local
# Edit .env.local with your credentials
```

3. **Deploy backend to your dev stage:**

```bash
cd backend
./deploy.sh heet  # or dhruv, tirth, pooja
```

4. **Run frontend:**

```bash
cd client
npm run dev
```

## 📦 What's Included

### ✅ Ready to Use

- **Authentication**: Clerk with JWT, role-based access (user/admin)
- **Admin Dashboard**: User management, invitations, ban/unban, role changes
- **WebSocket**: Real-time bidirectional communication
- **Deployment**: Serverless Framework with custom domains + Cloudflare DNS
- **UI Components**: shadcn/ui with Tailwind CSS
- **Type Safety**: Full TypeScript coverage

### 🔧 Ready to Integrate

- **SES Client**: Email sending wrapper (not connected yet)
- **SQS Client**: Queue processing wrapper (not connected yet)

### 📋 See Full Feature List

Check `FEATURES.md` for complete list of implemented and missing features.

## 🏗️ Project Structure

```
├── backend/
│   ├── src/
│   │   ├── modules/          # Feature modules
│   │   │   ├── users/        # User management
│   │   │   ├── websocket/    # WebSocket handlers
│   │   │   └── demo/         # RBAC testing
│   │   └── shared/           # Shared utilities
│   │       ├── auth/         # RBAC middleware
│   │       └── clients/      # AWS service clients
│   ├── deploy.sh             # Deployment script
│   └── serverless.yml        # Infrastructure config
│
└── client/
    ├── src/
    │   ├── components/       # React components
    │   ├── pages/            # Route pages
    │   ├── hooks/            # Custom hooks
    │   └── services/         # API clients
    └── vite.config.ts
```

## 🔑 Key Features

### Backend API

- `GET /api/admin/users` - List users
- `POST /api/admin/users/invite` - Invite user
- `PUT /api/admin/users/{id}/role` - Change role
- `POST /api/admin/users/{id}/ban` - Ban user
- `DELETE /api/admin/users/{id}` - Delete user
- WebSocket at `wss://your-domain/dev`

### Frontend Routes

- `/` - Landing page
- `/sign-in` - Sign in
- `/sign-up` - Sign up
- `/dashboard` - User dashboard
- `/admin` - Admin panel (admin only)

## 🛠️ Tech Stack

**Backend:** AWS Lambda, API Gateway, DynamoDB, Clerk, TypeScript  
**Frontend:** React 19, TypeScript, Vite, TanStack Query, Tailwind CSS  
**DevOps:** Serverless Framework, CloudFormation, Cloudflare DNS

## 📚 Documentation

### Project Documentation

- `backend/README.md` - Backend setup and API docs
- `client/CLERK_SETUP.md` - Clerk authentication setup
- `FEATURES.md` - Complete feature list
- `hackathon-guide.md` - Hackathon-specific guide

### Coding Guidelines

- [`guidelines/QUICK_REFERENCE.md`](guidelines/QUICK_REFERENCE.md) - Quick reference card for daily development
- [`guidelines/CODING_GUIDELINES.md`](guidelines/CODING_GUIDELINES.md) - Comprehensive coding standards
- [`guidelines/API_DESIGN.md`](guidelines/API_DESIGN.md) - REST API design best practices
- [`guidelines/GIT_WORKFLOW.md`](guidelines/GIT_WORKFLOW.md) - Git workflow and collaboration
- [`guidelines/INFRASTRUCTURE.md`](guidelines/INFRASTRUCTURE.md) - AWS and serverless patterns

## 🔄 Development Workflow

### Multi-Stage Deployment

We use a multi-stage deployment strategy:

```
dev-dhruv, dev-tirth, dev-pooja, dev-heet → test → prod
```

**Deploy to your dev stage:**

```bash
./deploy.sh heet  # Short form
./deploy.sh dev-heet  # Full stage name
```

**View deployment info:**

```bash
npx serverless info --stage dev-heet
```

See `backend/DEPLOYMENT.md` for complete deployment guide.

### Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat(users): add user invitation system
fix(websocket): resolve connection timeout
docs(deploy): update deployment guide
```

**Commit types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

**Scopes:**

- `backend`, `client`, `api`, `auth`, `users`, `websocket`, `deploy`, etc.

### Git Hooks

Automated checks on commit:

- **pre-commit**: Linting and formatting
- **commit-msg**: Commit message validation

### Pull Request Process

1. Create feature branch: `feat/your-feature`
2. Make changes and commit with conventional commits
3. Deploy and test in your dev stage
4. Create PR to `test` branch
5. After QA approval, merge to `main` for production

See `CONTRIBUTING.md` for detailed guidelines.

## 📋 Available Scripts

### Root

```bash
npm run backend      # Start backend dev server
npm run client       # Start client dev server
npm test            # Run all tests
npm run lint        # Lint all workspaces
npm run typecheck   # Type check all workspaces
npm run format      # Format code with Prettier
```

### Backend

```bash
npm run dev         # Start offline development
npm test           # Run tests
npm run lint       # Lint code
npm run typecheck  # Type check
./deploy.sh heet   # Deploy to dev stage
```

### Client

```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm test          # Run tests
npm run lint      # Lint code
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Client tests
cd client
npm test

# All tests
npm test
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of Conduct
- Development workflow
- Commit guidelines
- Pull request process
- Coding standards

## 📄 License

MIT - see [LICENSE](LICENSE) file for details

## 👥 Team

- Dhruv - `dev-dhruv`
- Tirth - `dev-tirth`
- Pooja - `dev-pooja`
- Heet - `dev-heet`

## 🔗 Links

### Getting Started

- [Quick Start Guide](backend/QUICK-START.md)
- [Deployment Guide](backend/DEPLOYMENT.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Feature List](FEATURES.md)

### Guidelines

- [Quick Reference](guidelines/QUICK_REFERENCE.md) - Essential commands and patterns
- [Coding Guidelines](guidelines/CODING_GUIDELINES.md) - Code standards and best practices
- [API Design](guidelines/API_DESIGN.md) - REST API design patterns
- [Git Workflow](guidelines/GIT_WORKFLOW.md) - Version control and collaboration
- [Infrastructure](guidelines/INFRASTRUCTURE.md) - AWS and serverless architecture
