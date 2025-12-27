# Admin Dashboard Components

This directory contains the refactored admin dashboard components, broken down from the original monolithic `AdminDashboard.tsx` file.

## Component Structure

### Core Components
- **`AdminStats.tsx`** - Statistics cards display component
- **`TabNavigation.tsx`** - Tab switching between Users and Invitations
- **`SearchInput.tsx`** - Reusable search input component

### Table Components
- **`UsersTable.tsx`** - Complete users table with pagination
- **`InvitationsTable.tsx`** - Complete invitations table with pagination
- **`UserRow.tsx`** - Individual user row with actions
- **`InvitationRow.tsx`** - Individual invitation row with actions

### UI Components
- **`StatsCard.tsx`** - Individual statistics card
- **`Pagination.tsx`** - Reusable pagination component
- **`InviteModal.tsx`** - Modal for inviting new users
- **`LoadingComponents.tsx`** - Loading spinners, skeletons, and button states
- **`icons.tsx`** - SVG icon components

### Utilities
- **`index.ts`** - Barrel export for all admin components

## Benefits of Refactoring

1. **Modularity** - Each component has a single responsibility
2. **Reusability** - Components can be reused across different parts of the app
3. **Maintainability** - Easier to find, update, and test individual components
4. **Performance** - Smaller bundle sizes and better tree-shaking
5. **Developer Experience** - Cleaner imports and better code organization

## Usage

```tsx
import {
  AdminStats,
  UsersTable,
  InvitationsTable,
  InviteModal,
} from './admin';
```

## Original File Size
- **Before**: ~1,200+ lines in a single file
- **After**: ~200 lines in main component + modular sub-components

This refactoring maintains all original functionality while significantly improving code organization and maintainability.