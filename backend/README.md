# Environment Variables Configuration

## Required Environment Variables

### AWS Configuration
- `AWS_REGION` - AWS region (default: ap-south-1)
- `DYNAMODB_TABLE` - DynamoDB table name (auto-generated: `{service}-{stage}`)

### Clerk Authentication
- `CLERK_SECRET_KEY` - Your Clerk secret key (required)
- `CLERK_PUBLISHABLE_KEY` - Your Clerk publishable key (required)

### JWT Authorizer Configuration
- `CLERK_ISSUER_URL` - Clerk JWT issuer URL (from Clerk Dashboard → JWT Templates)
- `CLERK_AUDIENCE` - Audience claim for JWT validation (usually your frontend URL)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the backend directory:
```bash
# Clerk Configuration (Get from Clerk Dashboard)
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here

# JWT Authorizer (Get from Clerk Dashboard → JWT Templates)
CLERK_ISSUER_URL=https://your-clerk-instance.clerk.accounts.dev
CLERK_AUDIENCE=https://your-frontend-url.com
```

### 3. Configure Clerk JWT Template

In Clerk Dashboard → Configure → JWT Templates, add these custom claims:
```json
{
  "role": "{{user.public_metadata.role}}",
  "email": "{{user.primary_email_address}}",
  "userid": "{{user.id}}"
}
```

Set user roles in Clerk Dashboard → Users → User → Public Metadata:
- For regular users: `{ "role": "user" }`
- For admins: `{ "role": "admin" }`

### 4. Development
```bash
# Start local development server
npm run dev

# TypeScript type checking
npm run typecheck

# Build
npm run build
```

### 5. Deployment
```bash
# Deploy to dev stage
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

## API Endpoints

### Authentication
All endpoints require a valid Clerk JWT token in the Authorization header:
```
Authorization: Bearer <your-clerk-jwt-token>
```

### User Management

#### Get User
- **GET** `/api/users/{userId}`
- Authorization: Users can access their own profile, admins can access any profile

#### Create User
- **POST** `/api/users`
- Body: `CreateUserRequest`
- Authorization: Admins can create users, or users can create within their organization

#### Update User
- **PUT** `/api/users/{userId}`
- Body: `UpdateUserRequest`
- Authorization: Users can update their own profile, admins can update any profile

#### Delete User
- **DELETE** `/api/users/{userId}`
- Authorization: Only admins can delete users (cannot delete themselves)

#### List Users
- **GET** `/api/users`
- Query Parameters:
  - `organizationId` (optional)
  - `role` (optional): admin, manager, member, viewer
  - `status` (optional): active, inactive, suspended, pending
  - `limit` (optional): 1-100, default 20
  - `lastEvaluatedKey` (optional): for pagination
- Authorization: Admins can see all users, others see only their organization

### Demo Endpoints (RBAC Testing)

#### User Demo
- **GET** `/api/demo/user`
- Authorization: Both `user` and `admin` roles

#### Admin Demo
- **GET** `/api/demo/admin`
- Authorization: `admin` role only (returns 403 for `user` role)

#### Who Am I
- **GET** `/api/demo/whoami`
- Returns: Current user's role and permissions

## Architecture Overview

### Clean Architecture Layers

1. **Handlers** (`src/modules/users/handlers/`)
   - Thin entry points
   - Parse HTTP requests
   - Call service layer
   - Return HTTP responses

2. **Services** (`src/modules/users/services/`)
   - Business logic
   - Authorization checks
   - Validation
   - Orchestrate repository calls

3. **Repositories** (`src/modules/users/repositories/`)
   - Data access layer
   - DynamoDB operations
   - Single-table design implementation

### Shared Layer (`src/shared/`)

- **DynamoDB Client** (`dynamo.ts`): Shared DocumentClient instance
- **Table Configuration** (`table-config.ts`): Constants and helpers
- **Response Helpers** (`response.ts`): Standardized API responses
- **RBAC Middleware** (`auth/rbacMiddleware.ts`): Role-based access control
- **Ownership Middleware** (`auth/ownershipMiddleware.ts`): Resource ownership verification
- **Types** (`types.ts`): Shared types and JWT context helpers

### RBAC Configuration (`src/config/permissions.ts`)

Two roles with different permissions:
- **user**: `readOwn`, `updateOwn` on users; `readAny` on demo
- **admin**: Full CRUD (`*Any`) on all modules

### Key Features

- **Single-Table DynamoDB Design**: All entities in one table with GSIs
- **HTTP API v2 JWT Authorizer**: Native JWT validation at API Gateway
- **RBAC with accesscontrol**: Role-based access with Own/Any permissions
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Consistent error responses
- **Pagination**: Cursor-based pagination for list operations
- **Ownership Verification**: Middleware for resource ownership checks
- **Audit Logging**: All RBAC decisions are logged
- **Scalability**: Serverless architecture with clean separation of concerns