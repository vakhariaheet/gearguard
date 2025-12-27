# Odoo Xadani - Complete Project Architecture Documentation

## Project Overview

**Odoo Xadani** is a production-grade serverless application built with a monorepo structure using Bun workspaces. It features authentication via Clerk, role-based access control (RBAC), admin dashboard, real-time WebSocket communication, and multi-stage deployment capabilities.

---

## 1. BACKEND ARCHITECTURE

### 1.1 Technology Stack

- **Runtime**: AWS Lambda (Node.js 20.x)
- **API Gateway**: AWS HTTP API v2 (API Gateway v2) with JWT Authorizer
- **Database**: DynamoDB (single-table design with 2 GSIs)
- **Authentication**: Clerk (JWT-based)
- **Authorization**: AccessControl library (RBAC)
- **Real-time**: WebSocket API (AWS API Gateway WebSocket)
- **Infrastructure**: Serverless Framework v3
- **Language**: TypeScript 5.3
- **Build Tool**: esbuild (via serverless-esbuild)
- **Testing**: Jest with ts-jest
- **Linting**: ESLint with TypeScript support

### 1.2 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── permissions.ts          # RBAC configuration (2 roles: user, admin)
│   ├── modules/
│   │   ├── users/                  # User management module
│   │   │   ├── functions/          # 12 Lambda function definitions (.yml)
│   │   │   ├── handlers/           # HTTP request handlers
│   │   │   ├── services/           # Business logic layer
│   │   │   └── types.ts            # Module-specific types
│   │   ├── demo/                   # RBAC testing module
│   │   │   ├── functions/          # 3 demo endpoints
│   │   │   └── handlers/
│   │   └── websocket/              # Real-time communication
│   │       ├── functions/
│   │       ├── handlers/
│   │       ├── services/
│   │       └── types.ts
│   └── shared/
│       ├── auth/
│       │   ├── clerkAuth.ts        # Clerk authentication utilities
│       │   ├── rbacMiddleware.ts   # Role-based access control
│       │   └── ownershipMiddleware.ts # Resource ownership verification
│       ├── clients/                # AWS service clients
│       │   ├── dynamodb.ts         # DynamoDB DocumentClient
│       │   ├── s3.ts               # S3 client
│       │   ├── ses.ts              # Email sending
│       │   ├── sqs.ts              # Queue processing
│       │   ├── gemini.ts           # Google Gemini AI
│       │   └── index.ts
│       ├── logger.ts               # Logging utilities
│       ├── response.ts             # Standardized API responses
│       └── types.ts                # Shared types and helpers
├── serverless.yml                  # Infrastructure & function definitions
├── resources.yml                   # CloudFormation resources (DynamoDB, outputs)
├── deploy.sh                       # Multi-stage deployment script
├── jest.config.js                  # Test configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Dependencies & scripts
```

### 1.3 Database Design (DynamoDB)

**Single-Table Design** with 3 indexes:

- **Primary Key**: PK (HASH) + SK (RANGE)
- **GSI1**: GSI1PK (HASH) + GSI1SK (RANGE)
- **GSI2**: GSI2PK (HASH) + GSI2SK (RANGE)

**Billing Mode**: PAY_PER_REQUEST (on-demand)

**Key Features**:

- Point-in-time recovery: Disabled
- Deletion policy: Configurable per stage (Delete for dev, Retain for prod)
- Automatic exports for CloudFormation

### 1.4 Authentication & Authorization

**Authentication Flow**:

1. Clerk handles user sign-up/sign-in
2. Clerk issues JWT tokens with custom claims
3. HTTP API v2 JWT Authorizer validates tokens
4. Claims extracted: `userid`, `email`, `role`

**RBAC Configuration** (2 roles):

- **user**:
  - `readOwn`, `updateOwn` on users module
  - `readAny` on demo module
  - `readAny`, `updateAny` on websocket module
- **admin**:
  - Full CRUD (`*Any`) on all modules (users, demo, admin, websocket)

**Authorization Middleware**:

- `rbacMiddleware`: Checks role-based permissions
- `ownershipMiddleware`: Verifies resource ownership
- Both integrated into handler layer

### 1.5 API Endpoints

**Users Module** (Admin Operations):

- `GET /api/admin/users` - List all users
- `GET /api/admin/users/{userId}` - Get user details
- `POST /api/admin/users/invite` - Invite new user
- `PUT /api/admin/users/{userId}/role` - Change user role
- `POST /api/admin/users/{userId}/ban` - Ban user
- `POST /api/admin/users/{userId}/unban` - Unban user
- `DELETE /api/admin/users/{userId}` - Delete user
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/invitations` - List pending invitations
- `DELETE /api/admin/invitations/{invitationId}` - Revoke invitation
- `POST /api/admin/invitations/{invitationId}/resend` - Resend invitation
- `GET /api/admin/permissions` - Get system permissions and roles

**Demo Module** (RBAC Testing):

- `GET /api/demo/whoami` - Get current user info (all authenticated users)
- `GET /api/demo/user` - User-only endpoint
- `GET /api/demo/admin` - Admin-only endpoint

**WebSocket Module**:

- `wss://your-domain/dev` - Real-time bidirectional communication

### 1.6 Clean Architecture Layers

1. **Handlers** (`src/modules/*/handlers/`)
   - Thin entry points for Lambda functions
   - Parse HTTP requests
   - Call service layer
   - Return standardized HTTP responses

2. **Services** (`src/modules/*/services/`)
   - Business logic implementation
   - Authorization checks
   - Input validation
   - Orchestrate repository calls

3. **Repositories** (`src/modules/*/repositories/`)
   - Data access layer
   - DynamoDB operations
   - Single-table design implementation

4. **Shared Layer** (`src/shared/`)
   - DynamoDB client (DocumentClient)
   - AWS service clients (S3, SES, SQS, Gemini)
   - RBAC middleware
   - Ownership verification
   - Shared types and utilities

### 1.7 Configuration & Environment

**Environment Variables**:

- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_ISSUER_URL` - JWT issuer URL
- `CLERK_AUDIENCE` - JWT audience claim
- `AWS_REGION` - AWS region (default: ap-south-1)
- `DYNAMODB_TABLE` - Auto-generated table name
- `STAGE` - Deployment stage
- `NODE_ENV` - Environment (dev/test/prod)

**Multi-Stage Deployment**:

- Individual dev stages: `dev-dhruv`, `dev-tirth`, `dev-pooja`, `dev-heet`
- Test stage: `test`
- Production stage: `prod`
- Each stage has different memory, timeout, and log retention settings

### 1.8 Testing Setup

**Framework**: Jest with ts-jest
**Coverage Thresholds**:

- Global: 70% statements, 60% branches, 70% functions, 70% lines
- Auth modules: 80% statements, 70% branches, 80% functions, 80% lines
- Config modules: 80% across all metrics

**Test Configuration**:

- Test timeout: 10 seconds
- Auto-clear mocks between tests
- Coverage collection from all src files
- Setup file: `tests/setup.ts`

### 1.9 Deployment

**Deployment Script** (`deploy.sh`):

- Supports multi-stage deployment (dev/test/prod)
- AWS credential management (assumes DevRole)
- Serverless Framework integration
- Custom domain setup via serverless-domain-manager
- Cloudflare DNS integration
- Comprehensive logging and error handling
- Deployment info saved to JSON file

**Deployment Process**:

1. Type checking
2. Credential verification
3. Serverless deployment
4. Custom domain creation
5. Cloudflare DNS update
6. Deployment summary

---

## 2. CLIENT ARCHITECTURE

### 2.1 Technology Stack

- **Framework**: React 19.2
- **Language**: TypeScript 5.9
- **Build Tool**: Vite 7.2
- **Routing**: React Router v7
- **State Management**: TanStack Query (React Query) v5
- **Authentication**: Clerk React SDK v5.58
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Styling**: Tailwind CSS v4 with Vite plugin
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **Theme**: next-themes (dark mode support)
- **Linting**: ESLint with TypeScript support
- **Package Manager**: Bun

### 2.2 Project Structure

```
client/
├── src/
│   ├── assets/                     # Static assets
│   ├── components/
│   │   ├── admin/                  # Admin-specific components
│   │   ├── classes/                # Class-related components
│   │   ├── dashboard/              # Dashboard components
│   │   ├── ui/                     # shadcn/ui components
│   │   ├── AdminDashboard.tsx      # Main admin dashboard
│   │   ├── ApiProvider.tsx         # API client provider
│   │   ├── ProtectedRoute.tsx      # Route protection wrapper
│   │   ├── ScrollToTop.tsx         # Auto scroll to top component
│   │   ├── WebSocketDemo.tsx       # WebSocket demo
│   │   ├── WebSocketExample.tsx    # WebSocket example
│   │   └── WebSocketTest.tsx       # WebSocket testing
│   ├── hooks/
│   │   ├── useApi.ts               # API request hook
│   │   ├── useAsync.ts             # Async operation hook
│   │   ├── useConfirmDialog.ts     # Confirmation dialog hook
│   │   ├── useDebounce.ts          # Debounce hook
│   │   ├── useLocalStorage.ts      # Local storage hook
│   │   ├── useScrollToTop.ts       # Auto scroll to top on route change
│   │   ├── useUsers.ts             # User management hook
│   │   ├── useWebSocket.ts         # WebSocket hook
│   │   └── index.ts                # Hook exports
│   ├── lib/
│   │   └── utils.ts                # Utility functions
│   ├── pages/
│   │   ├── classes/                # Class-related pages
│   │   ├── AdminPage.tsx           # Admin panel page
│   │   ├── DashboardPage.tsx       # User dashboard
│   │   ├── LandingPage.tsx         # Landing page
│   │   ├── NotFoundPage.tsx        # 404 page
│   │   ├── SignInPage.tsx          # Sign in page
│   │   ├── SignUpPage.tsx          # Sign up page
│   │   └── WebSocketTestPage.tsx   # WebSocket testing page
│   ├── services/
│   │   ├── apiClient.ts            # HTTP client wrapper
│   │   ├── usersApi.ts             # Users API service
│   │   ├── storage.ts              # Storage service
│   │   └── index.ts                # Service exports
│   ├── types/
│   │   └── user.ts                 # User types and interfaces
│   ├── utils/
│   │   ├── constants.ts            # App constants
│   │   ├── formatters.ts           # Data formatters
│   │   └── index.ts                # Utility exports
│   ├── App.tsx                     # Main app component
│   ├── App.css                     # App styles
│   ├── index.css                   # Global styles
│   └── main.tsx                    # Entry point
├── public/                         # Static files
├── vite.config.ts                  # Vite configuration
├── tsconfig.json                   # TypeScript configuration
├── tsconfig.app.json               # App TypeScript config
├── tsconfig.node.json              # Node TypeScript config
├── eslint.config.js                # ESLint configuration
├── components.json                 # shadcn/ui config
├── index.html                      # HTML template
└── package.json                    # Dependencies & scripts
```

### 2.3 Routing & Navigation

**Routes**:

- `/` - Landing page (redirects to dashboard if signed in)
- `/sign-in/*` - Clerk sign-in page
- `/sign-up/*` - Clerk sign-up page
- `/dashboard` - User dashboard (protected)
- `/admin` - Admin panel (protected, admin-only)
- `/websocket-test` - WebSocket testing (protected)
- `*` - 404 Not Found page

**Route Protection**:

- `ProtectedRoute` component wraps protected routes
- Checks authentication status via Clerk
- Supports role-based access (e.g., admin-only routes)
- Redirects to sign-in if not authenticated
- Shows access denied message if role doesn't match

### 2.4 State Management

**TanStack Query (React Query)**:

- Server state management
- Automatic caching and synchronization
- Background refetching
- Optimistic updates support

**Custom Hooks**:

- `useUsers()` - User management operations
- `useApi()` - Generic API request hook
- `useAsync()` - Async operation handling
- `useWebSocket()` - WebSocket connection management
- `useLocalStorage()` - Persistent client-side storage
- `useDebounce()` - Debounced values
- `useConfirmDialog()` - Confirmation dialogs
- `useScrollToTop()` - Auto scroll to top on route changes

**Clerk Integration**:

- `useAuth()` - Authentication state
- `useUser()` - Current user info
- `UserButton` - User profile dropdown
- `SignedIn`/`SignedOut` - Conditional rendering

### 2.5 API Client Architecture

**ApiClient** (`services/apiClient.ts`):

- Singleton HTTP client wrapper
- Automatic JWT token injection
- Error handling and response parsing
- File upload support
- Methods: `get()`, `post()`, `put()`, `patch()`, `delete()`, `uploadFile()`

**Users API Service** (`services/usersApi.ts`):

- Admin user management operations
- Invitation management
- Statistics and permissions endpoints
- Type-safe API calls

**API Response Types**:

- Standardized success/error responses
- User, Invitation, and Stats types
- Dynamic role support

### 2.6 UI/UX Patterns

**Component Library**: shadcn/ui

- Radix UI primitives
- Tailwind CSS styling
- Accessible by default
- Customizable components

**UI Components**:

- Dialog/Modal
- Dropdown Menu
- Select
- Label
- Custom admin components
- Dashboard components
- Class management components

**Styling**:

- Tailwind CSS v4 with Vite plugin
- Dark mode support via next-themes
- Responsive design
- Custom animations (tw-animate-css)

**Notifications**:

- Sonner toast notifications
- Top-right positioning
- Rich colors support
- Close button
- Auto-dismiss (4 seconds)

**Loading States**:

- Loading spinner component
- Conditional rendering based on auth state
- Async operation indicators

### 2.7 Build & Development

**Vite Configuration**:

- React plugin for JSX/TSX
- Tailwind CSS Vite plugin
- Path alias: `@` → `./src`
- Fast HMR (Hot Module Replacement)

**Development Server**:

- `npm run dev` - Start Vite dev server
- Fast refresh for React components
- TypeScript support

**Production Build**:

- `npm run build` - TypeScript check + Vite build
- Optimized bundle
- Source maps for debugging

**Code Quality**:

- ESLint with React hooks plugin
- TypeScript strict mode
- Prettier formatting

### 2.8 Environment Configuration

**Environment Variables**:

- `VITE_API_URL` - Backend API base URL
- Loaded from `.env.local` (development)
- Clerk configuration via environment

**Build Outputs**:

- Optimized JavaScript bundles
- CSS modules
- Static assets
- Source maps

---

## 3. KEY FEATURES & CAPABILITIES

### 3.1 Authentication & Authorization

✅ Clerk-based authentication (JWT)
✅ Role-based access control (RBAC)
✅ Protected routes with role checking
✅ Ownership-based resource access
✅ Admin dashboard for user management

### 3.2 User Management

✅ User listing and filtering
✅ User invitations
✅ Role assignment and changes
✅ User banning/unbanning
✅ User deletion
✅ Admin statistics

### 3.3 Real-time Features

✅ WebSocket API for bidirectional communication
✅ Connection management
✅ Message routing

### 3.4 Infrastructure & DevOps

✅ Multi-stage deployment (dev/test/prod)
✅ Custom domains with Cloudflare DNS
✅ Serverless Framework integration
✅ CloudFormation resources
✅ Comprehensive logging
✅ Automated deployment script

### 3.5 Code Quality

✅ Full TypeScript coverage
✅ ESLint configuration
✅ Jest testing framework
✅ Code coverage thresholds
✅ Git hooks (Husky)
✅ Conventional commits

---

## 4. INTEGRATION POINTS & READY-TO-USE SERVICES

### 4.1 AWS Services (Configured)

- **Lambda**: Function compute
- **API Gateway v2**: HTTP and WebSocket APIs
- **DynamoDB**: NoSQL database
- **CloudFormation**: Infrastructure as code
- **CloudWatch**: Logging and monitoring

### 4.2 AWS Services (Ready to Integrate)

- **S3**: File storage (client configured)
- **SES**: Email sending (client configured)
- **SQS**: Message queuing (client configured)

### 4.3 Third-party Services

- **Clerk**: Authentication and user management
- **Google Gemini AI**: Latest Gemini 3 models with advanced reasoning, multimodal capabilities, thinking mode, and image generation (client configured)
- **Cloudflare**: DNS management

### 4.4 AWS Client Wrappers (MANDATORY)

**CRITICAL:** NEVER use AWS SDK directly. Always use the pre-configured client wrappers in `backend/src/shared/clients/`.

#### Available Client Wrappers

**DynamoDB Client** (`backend/src/shared/clients/dynamodb.ts`):

```typescript
import { dynamodb } from '../../../shared/clients/dynamodb';

// Basic operations
const item = await dynamodb.get({ PK: 'USER#123', SK: 'PROFILE' });
await dynamodb.put({ PK: 'USER#123', SK: 'PROFILE', name: 'John' });
await dynamodb.update({ PK: 'USER#123', SK: 'PROFILE' }, { name: 'Jane' });
await dynamodb.delete({ PK: 'USER#123', SK: 'PROFILE' });

// Query operations
const result = await dynamodb.query('PK = :pk', { ':pk': 'USER#123' }, { indexName: 'GSI1' });

// Batch operations
const items = await dynamodb.batchGet([
  { PK: 'USER#123', SK: 'PROFILE' },
  { PK: 'USER#456', SK: 'PROFILE' },
]);
```

**S3 Client** (`backend/src/shared/clients/s3.ts`):

```typescript
import { s3 } from '../../../shared/clients/s3';

// File operations
const content = await s3.getString('documents/file.txt');
await s3.putString('documents/file.txt', 'Hello World');
await s3.putJSON('data/config.json', { setting: 'value' });
const data = await s3.getJSON<ConfigType>('data/config.json');

// Presigned URLs
const downloadUrl = await s3.getDownloadUrl('documents/file.pdf', { expiresIn: 3600 });
const uploadUrl = await s3.getUploadUrl('uploads/new-file.jpg', { contentType: 'image/jpeg' });

// File management
const exists = await s3.exists('documents/file.txt');
await s3.copy('source.txt', 'backup/source.txt');
await s3.delete('old-file.txt');
```

**SES Client** (`backend/src/shared/clients/ses.ts`):

```typescript
import { ses } from '../../../shared/clients/ses';

// Simple email
await ses.sendText('user@example.com', 'Welcome!', 'Welcome to our platform');
await ses.sendHtml('user@example.com', 'Newsletter', '<h1>Latest News</h1>');

// Advanced email
await ses.send({
  from: 'noreply@company.com',
  to: ['user1@example.com', 'user2@example.com'],
  cc: 'manager@company.com',
  content: {
    subject: 'Project Update',
    text: 'Text version',
    html: '<p>HTML version</p>',
  },
});

// Templated email
await ses.sendTemplated({
  from: 'noreply@company.com',
  to: 'user@example.com',
  templateName: 'welcome-template',
  templateData: { userName: 'John', activationLink: 'https://...' },
});
```

**SQS Client** (`backend/src/shared/clients/sqs.ts`):

```typescript
import { sqs } from '../../../shared/clients/sqs';

// Send messages
const messageId = await sqs.send({ type: 'user-signup', userId: '123' });
await sqs.sendBatch([
  { id: '1', body: { type: 'email', to: 'user1@example.com' } },
  { id: '2', body: { type: 'email', to: 'user2@example.com' } },
]);

// Receive and process
const messages = await sqs.receive<TaskMessage>({ maxNumberOfMessages: 10 });
for (const message of messages) {
  // Process message
  await processTask(message.body);
  // Delete after successful processing
  await sqs.delete(message.receiptHandle);
}

// Auto-processing with error handling
await sqs.process<TaskMessage>(async (message) => {
  await processTask(message.body);
  // Message automatically deleted on success
});
```

#### Client Wrapper Benefits

1. **Type Safety**: Full TypeScript support with proper types
2. **Error Handling**: Consistent error logging and handling
3. **Simplified API**: Cleaner, more intuitive method names
4. **Auto-Configuration**: Environment variables handled automatically
5. **Best Practices**: Built-in retry logic, connection pooling, etc.
6. **Logging**: Integrated with project logging system
7. **Testing**: Easier to mock for unit tests

#### Environment Configuration

Each client wrapper uses environment variables for configuration:

```env
# DynamoDB
DYNAMODB_TABLE=your-table-name
AWS_REGION=ap-south-1

# S3
S3_BUCKET=your-bucket-name

# SES
SES_DEFAULT_FROM=noreply@yourdomain.com
SES_CONFIGURATION_SET=your-config-set

# SQS
SQS_QUEUE_URL=https://sqs.region.amazonaws.com/account/queue-name
```

#### Usage Rules

**✅ CORRECT - Use Wrappers:**

```typescript
import { dynamodb, s3, ses, sqs } from '../../../shared/clients';

// All operations through wrappers
const user = await dynamodb.get({ PK: 'USER#123', SK: 'PROFILE' });
await s3.putString('files/data.txt', content);
await ses.sendText(email, subject, message);
await sqs.send(taskData);
```

**❌ WRONG - Direct AWS SDK:**

```typescript
// NEVER DO THIS
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import { SQSClient } from '@aws-sdk/client-sqs';
```

#### Creating New Client Wrappers

If you need a new AWS service, create a wrapper following the established pattern:

1. **File Structure**: `backend/src/shared/clients/service-name.ts`
2. **Class Pattern**: Export both class and default instance
3. **Type Safety**: Full TypeScript interfaces
4. **Error Handling**: Use shared logger
5. **Environment Config**: Support environment variables
6. **Export**: Add to `backend/src/shared/clients/index.ts`

### 4.5 Gemini AI Integration

**Available Models (Latest Gemini 3 Series)**:

- `gemini-3-pro-preview`: Most intelligent model with multimodal understanding and agentic capabilities
- `gemini-3-flash-preview`: Frontier intelligence built for speed (default)
- `gemini-3-pro-image-preview`: Image generation and editing with advanced visual reasoning

**Core Capabilities**:

- **Text Generation**: Content creation, summaries, descriptions, recommendations
- **JSON Output**: Structured data generation, form auto-completion, data transformation
- **Chat Sessions**: Interactive AI assistants, customer support, Q&A systems
- **Image Analysis**: Document processing, visual content analysis, OCR-like features
- **Image Generation**: Create and edit images from text prompts with style controls
- **Thinking Mode**: Complex reasoning, problem-solving, step-by-step analysis (Gemini 3 enhanced)
- **Streaming Responses**: Real-time AI responses, live content generation
- **Multimodal Understanding**: Advanced visual and spatial reasoning capabilities
- **Code Execution**: Built-in code execution for dynamic problem solving
- **Agentic Workflows**: Advanced autonomous task completion

**Client Usage Pattern**:

```typescript
import { gemini, createGemini } from '../../../shared/clients/gemini';

// Text generation
const result = await gemini.generate('Generate a product description...');

// JSON output
const data = await gemini.generateJSON<ProductData>('Extract product info...');

// Image generation
const imageResult = await gemini.generateImage('A sunset over mountains', {
  style: 'photographic',
  quality: 'high',
  aspectRatio: '16:9',
});

// Chat session
const chat = gemini.startChat([], {
  systemInstruction: 'You are an expert assistant...',
});
const response = await chat.send('How can I help?');
```

**Environment Setup**:

- `GEMINI_API_KEY` - Google AI API key (configured in backend/.env)
- Client automatically handles authentication and error handling
- Supports all latest Gemini 3 models with fallback to stable versions

---

## 5. DEPLOYMENT ARCHITECTURE

**Multi-Stage Pipeline**:

```
dev-dhruv ─┐
dev-tirth ─┼─→ test ─→ prod
dev-pooja ─┤
dev-heet  ─┘
```

**Stage Configuration**:
| Stage | Memory | Timeout | Log Retention | Deletion Policy |
|-------|--------|---------|---------------|-----------------|
| dev-\* | 256MB | 29s | 3 days | Delete |
| test | 512MB | 29s | 14 days | Delete |
| prod | 512MB | 29s | 30 days | Retain |

**Custom Domains**:

- HTTP API: `api-{stage}.yourdomain.com`
- WebSocket: `ws-{stage}.yourdomain.com`
- Managed via serverless-domain-manager
- DNS via Cloudflare

---

## 6. DEVOPS CLI TOOL

### 6.1 Overview

The project includes a comprehensive DevOps CLI tool (`scripts/devops/`) that streamlines the entire development workflow with proper git management, module creation, and serverless deployment.

### 6.2 Features

- 🆕 **Module Management**: Create new modules or work on existing ones with documentation integration
- ✅ **Smart Git Workflow**: Proper branch management with rebase and conflict resolution
- 🔄 **Pull & Rebase**: Keep your feature branches up-to-date with epic branch
- 🚀 **Serverless Deployment**: Full and function-specific deployments with pre-checks
- 🎨 **Great UX**: Interactive menus, progress indicators, and clean table formatting
- ⚙️ **Configurable**: Environment-based configuration with sensible defaults
- 📖 **Documentation Integration**: Reads module specs from `/docs` directory
- 🛡️ **Safe Operations**: Force-push with lease, conflict detection, and error recovery

### 6.3 CLI Structure

```
scripts/devops/
├── src/
│   ├── commands/
│   │   ├── deploy.ts               # Deployment commands
│   │   └── module.ts               # Module management commands
│   ├── utils/
│   │   ├── config.ts               # Configuration management
│   │   ├── display.ts              # UI/UX utilities
│   │   ├── git.ts                  # Git operations
│   │   └── modules.ts              # Module discovery
│   ├── types/
│   │   └── index.ts                # TypeScript definitions
│   └── index.ts                    # CLI entry point
├── package.json                    # CLI dependencies
├── tsconfig.json                   # TypeScript configuration
├── .env.example                    # Environment template
└── README.md                       # CLI documentation
```

### 6.4 Available Commands

| Command           | Description                                      | Alias |
| ----------------- | ------------------------------------------------ | ----- |
| `module new`      | Create/select module and checkout feature branch | `m n` |
| `module complete` | Commit, rebase, push, and create PR              | `m c` |
| `module sync`     | Pull latest changes and rebase current branch    | `m s` |
| `deploy all`      | Full serverless deployment                       | `d a` |
| `deploy function` | Deploy specific function                         | `d f` |
| `config`          | Show current configuration                       | -     |

### 6.5 Module Documentation Integration

The CLI integrates with module documentation in the `/docs` directory:

- **File Pattern**: `module-{ID}-{name}.md` (e.g., `module-F01-proposal-management.md`)
- **Status Display**: Shows if module is planned (📝) or implemented (✅)
- **Time Estimates**: Extracts estimated time from documentation
- **Branch Naming**: Uses module ID for consistent branch names (e.g., `feat/F01-proposal-management`)

### 6.6 Git Workflow Integration

**Enhanced Git Operations**:

- Proper pull before rebase to get latest changes
- Conflict detection and resolution prompts with LLM-ready output
- Stash management for uncommitted changes
- Force-push with lease for safety (prevents overwriting others' work)
- Separate sync command for keeping branches up-to-date

**Branch Management**:

- Epic branch: Main development branch (configurable via `EPIC_BRANCH`)
- Feature branches: `feat/{module-id}` pattern
- Automatic branch creation and checkout
- Pull Request creation via GitHub CLI

### 6.7 Deployment Integration

**Pre-deployment Checks**:

- Serverless Framework installation validation
- AWS credentials validation for specified profile
- Environment configuration verification
- Function discovery across all modules

**Deployment Options**:

- Full deployment: All functions and resources
- Function-specific deployment: Interactive selection
- Multi-stage support: dev/test/prod environments
- AWS profile management

### 6.8 Configuration

**Environment Variables**:

```env
# Git Configuration
EPIC_BRANCH=main
DEFAULT_COMMIT_MESSAGE_PREFIX=feat:

# Deployment Configuration
SERVERLESS_STAGE=dev
DEVOPS_AWS_PROFILE=default

# Paths (relative to git root)
BACKEND_PATH=backend
MODULES_PATH=backend/src/modules
```

### 6.9 Usage Examples

**Start New Feature**:

```bash
cd scripts/devops
npm run dev module new
```

- Handles uncommitted changes
- Pulls latest from epic branch
- Shows available modules from `/docs` directory
- Creates/checks out feature branch
- Shows module documentation and next steps

**Keep Branch Updated**:

```bash
npm run dev module sync
```

- Handles uncommitted changes
- Pulls latest from epic branch
- Rebases current branch on top of epic branch
- Handles merge conflicts with LLM-ready prompts

**Complete Feature**:

```bash
npm run dev module complete
```

- Commits changes with proper message format
- Rebases from epic branch (with latest pull)
- Pushes branch with force-with-lease
- Creates Pull Request using GitHub CLI

**Deploy Changes**:

```bash
npm run dev deploy function
```

- Validates environment and credentials
- Interactive function selection
- Deploys to configured stage

### 6.10 Safety Features

- **Force-push with lease**: Prevents overwriting others' work
- **Conflict detection**: Identifies merge conflicts before they cause issues
- **Stash management**: Safely handles uncommitted changes
- **Pre-deployment checks**: Validates environment before deployment
- **Error recovery**: Graceful handling of failed operations
- **Branch protection**: Never directly pushes to epic branch

### 6.11 Integration with Project Architecture

The DevOps CLI is designed to work seamlessly with the project's architecture:

- **Module Discovery**: Automatically finds modules in `backend/src/modules/`
- **Function Detection**: Discovers Lambda functions from `.yml` files
- **Documentation Integration**: Reads module specs from `/docs/module-*.md`
- **Deployment Integration**: Works with existing `deploy.sh` and Serverless Framework
- **Git Workflow**: Follows the project's branching strategy and conventions

---

## 7. DEVELOPMENT WORKFLOW (Updated)

**Scripts**:

```bash
# Root level
npm run backend          # Start backend dev server
npm run client           # Start client dev server
npm test               # Run all tests
npm run lint           # Lint all workspaces
npm run typecheck      # Type check all workspaces
npm run format         # Format code with Prettier
npm run devops         # Start DevOps CLI (interactive mode)

# DevOps CLI (scripts/devops/)
npm run dev            # Interactive mode
npm run dev m n        # New module creation
npm run dev m c        # Complete module (commit, rebase, push, PR)
npm run dev m s        # Pull and rebase current branch
npm run dev d a        # Deploy all functions
npm run dev d f        # Deploy specific function
npm run dev config     # Show configuration

# Backend
npm run dev            # Start offline development
npm run deploy:dev     # Deploy to dev stage
npm run deploy:prod    # Deploy to production
npm run logs           # View Lambda logs

# Client
npm run dev            # Start Vite dev server
npm run build          # Build for production
npm run preview        # Preview production build
```

**Enhanced Git Workflow with DevOps CLI**:

1. **Start New Feature**:

   ```bash
   npm run devops        # or cd scripts/devops && npm run dev
   # Select "🆕 New Module Creation"
   ```

   - Automatically handles uncommitted changes
   - Pulls latest from epic branch
   - Shows available modules from documentation
   - Creates feature branch with proper naming

2. **Development Process**:
   - Follow module architecture guidelines
   - Implement handlers, services, and types
   - Update permissions.ts if needed
   - Regular commits with conventional format

3. **Keep Branch Updated**:

   ```bash
   npm run devops
   # Select "🔄 Pull and Rebase"
   ```

   - Pulls latest changes from epic branch
   - Rebases current branch safely
   - Handles merge conflicts with LLM assistance

4. **Complete Feature**:

   ```bash
   npm run devops
   # Select "✅ Complete Module"
   ```

   - Commits final changes
   - Rebases from epic branch
   - Pushes with force-with-lease
   - Creates Pull Request automatically

5. **Deploy Changes**:

   ```bash
   npm run devops
   # Select "🚀 Deploy All Functions" or "⚡ Deploy Single Function"
   ```

   - Pre-deployment validation
   - Interactive function selection
   - Deploys to configured stage

**Traditional Git Workflow** (still supported):

- Conventional commits
- Husky pre-commit hooks
- Lint-staged for staged files
- Commitlint for message validation

---

## 8. TECHNOLOGY SUMMARY

| Layer                  | Technology              | Purpose               |
| ---------------------- | ----------------------- | --------------------- |
| **Backend Runtime**    | AWS Lambda + Node.js 20 | Serverless compute    |
| **Backend API**        | HTTP API v2 + WebSocket | API Gateway           |
| **Backend Auth**       | Clerk + JWT             | Authentication        |
| **Backend Auth**       | AccessControl           | RBAC                  |
| **Backend DB**         | DynamoDB                | NoSQL database        |
| **Backend Build**      | TypeScript + esbuild    | Language & bundling   |
| **Backend Deploy**     | Serverless Framework    | Infrastructure        |
| **Frontend Framework** | React 19                | UI library            |
| **Frontend Routing**   | React Router v7         | Navigation            |
| **Frontend State**     | TanStack Query          | Server state          |
| **Frontend Auth**      | Clerk React SDK         | Authentication UI     |
| **Frontend UI**        | shadcn/ui + Tailwind    | Component library     |
| **Frontend Build**     | Vite                    | Build tool            |
| **Frontend Styling**   | Tailwind CSS v4         | CSS framework         |
| **DevOps CLI**         | TypeScript + Commander  | Development workflow  |
| **DevOps Git**         | simple-git + inquirer   | Git operations        |
| **DevOps Deploy**      | Serverless + AWS CLI    | Deployment automation |

---

## 9. ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                     DEVOPS CLI TOOL                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Commands: module new/complete/sync, deploy all/func │   │
│  │ Features: Git workflow, Module docs, Deployment     │   │
│  │ Integration: GitHub CLI, AWS CLI, Serverless        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Pages: Landing, SignIn, SignUp, Dashboard, Admin    │   │
│  │ Components: UI (shadcn/ui), Admin, Dashboard        │   │
│  │ Hooks: useUsers, useApi, useWebSocket, etc.         │   │
│  │ Services: apiClient, usersApi                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│                    Clerk Auth SDK                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │   HTTP API v2 + JWT Authorizer       │
        │   (API Gateway v2)                   │
        └──────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (Lambda)                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Modules: Users, Demo, WebSocket                      │   │
│  │ ├─ Handlers: HTTP request entry points              │   │
│  │ ├─ Services: Business logic                         │   │
│  │ └─ Repositories: Data access                        │   │
│  │ Shared: Auth (RBAC), Clients (AWS), Types           │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ AWS Services:                                        │   │
│  │ • DynamoDB (Single-table design)                    │   │
│  │ • S3, SES, SQS (Ready to integrate)                 │   │
│  │ • CloudWatch (Logging)                             │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────────────────────────┐
        │   Clerk (Authentication)             │
        │   Cloudflare (DNS)                   │
        │   GitHub (Source Control & CI)       │
        └──────────────────────────────────────┘
```

---

## 10. GETTING STARTED

### Prerequisites

- Node.js 20+
- Bun package manager
- AWS CLI configured
- Clerk account setup
- GitHub CLI (for PR creation)

### Quick Start

1. **Clone and Install**:

   ```bash
   git clone <repository>
   cd odoo-xadani
   bun install
   ```

2. **Environment Setup**:

   ```bash
   # Backend
   cp backend/.env.example backend/.env
   # Edit backend/.env with your Clerk keys

   # Client
   cp client/.env.example client/.env
   # Edit client/.env with API URL
   ```

3. **DevOps CLI Setup**:

   ```bash
   cd scripts/devops
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   npm run build  # Optional: for faster execution
   ```

4. **Development with DevOps CLI**:

   ```bash
   # Start new feature
   npm run devops
   # Select "🆕 New Module Creation"

   # Or use direct commands
   cd scripts/devops
   npm run dev module new
   ```

5. **Traditional Development** (alternative):

   ```bash
   # Start backend (in one terminal)
   npm run backend

   # Start client (in another terminal)
   npm run client
   ```

6. **Deploy with DevOps CLI**:
   ```bash
   npm run devops
   # Select "🚀 Deploy All Functions" or "⚡ Deploy Single Function"
   ```

### DevOps CLI Benefits

The DevOps CLI streamlines the entire development workflow:

- **Automated Git Operations**: Proper branching, rebasing, and conflict resolution
- **Module Documentation Integration**: Reads specs from `/docs` directory
- **Safe Deployment**: Pre-checks and validation before deployment
- **Interactive UX**: Clean menus, progress indicators, and helpful prompts
- **Error Recovery**: Graceful handling of common development issues

This comprehensive architecture provides a solid foundation for a production-grade serverless application with modern development practices, scalability, maintainability, and an enhanced developer experience through the integrated DevOps CLI tool.
