# DevOps CLI Tool

A modern, user-friendly CLI tool for streamlined development workflow with proper git management, module creation, and serverless deployment.

## Features

- 🆕 **Module Management**: Create new modules or work on existing ones with documentation integration
- ✅ **Smart Git Workflow**: Proper branch management with rebase and conflict resolution
- � **Pull & Rebase**: Keep your feature branches up-to-date with epic branch
- 🚀 **Serverless Deployment**: Full and function-specific deployments with pre-checks
- 🎨 **Great UX**: Interactive menus, progress indicators, and clean table formatting
- ⚙️ **Configurable**: Environment-based configuration with sensible defaults
- 📖 **Documentation Integration**: Reads module specs from `/docs` directory
- 🛡️ **Safe Operations**: Force-push with lease, conflict detection, and error recovery

## Installation

```bash
cd scripts/devops
npm install
npm run build  # Optional: for faster execution
```

## Usage

### Interactive Mode (Recommended)

```bash
npm run dev
# or after building
npm start
```

### Command Line Interface

#### Module Commands

```bash
# Create new module or work on existing
npm run dev module new
npm run dev m n  # short alias

# Complete module (commit, rebase, push, PR)
npm run dev module complete
npm run dev m c  # short alias

# Pull and rebase current branch
npm run dev module sync
npm run dev m s  # short alias
```

#### Deployment Commands

```bash
# Deploy all functions and resources
npm run dev deploy all
npm run dev d a  # short alias

# Deploy specific function
npm run dev deploy function
npm run dev d f  # short alias
```

#### Configuration

```bash
# Show current configuration
npm run dev config
```

## Configuration

Create a `.env` file in the `scripts/devops` directory:

```bash
cp .env.example .env
```

Edit the `.env` file with your settings:

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

## Key Improvements

### 1. Enhanced Git Workflow

- ✅ Proper pull before rebase to get latest changes
- ✅ Conflict detection and resolution prompts with LLM-ready output
- ✅ Stash management for uncommitted changes
- ✅ Force-push with lease for safety (prevents overwriting others' work)
- ✅ Separate sync command for keeping branches up-to-date

### 2. Better UX & Display

- ✅ Responsive banner that adapts to terminal width
- ✅ Clean table formatting with `cli-table3`
- ✅ Progress indicators with `ora`
- ✅ Colored output with `chalk`
- ✅ Interactive prompts with `inquirer`
- ✅ Path truncation for better readability
- ✅ Emoji icons for better visual appeal

### 3. Module Documentation Integration

- ✅ Reads module specifications from `/docs/module-*.md` files
- ✅ Shows implementation status (📝 planned vs ✅ implemented)
- ✅ Displays estimated time and module details
- ✅ Links to documentation during development

### 4. Robust Architecture

- ✅ TypeScript for type safety
- ✅ Modular command structure with separate utilities
- ✅ Proper environment variable loading with `dotenv`
- ✅ Configuration management with precedence
- ✅ Comprehensive error handling and recovery

### 5. Pre-deployment Checks

- ✅ Serverless Framework installation validation
- ✅ AWS credentials validation for specified profile
- ✅ Environment configuration verification
- ✅ Function discovery across all modules

## Commands Overview

| Command           | Description                                      | Alias |
| ----------------- | ------------------------------------------------ | ----- |
| `module new`      | Create/select module and checkout feature branch | `m n` |
| `module complete` | Commit, rebase, push, and create PR              | `m c` |
| `module sync`     | Pull latest changes and rebase current branch    | `m s` |
| `deploy all`      | Full serverless deployment                       | `d a` |
| `deploy function` | Deploy specific function                         | `d f` |
| `config`          | Show current configuration                       | -     |

## Workflow Examples

### 1. Start New Feature

```bash
npm run dev module new
```

**What happens:**

- Handles uncommitted changes (stash/commit/discard options)
- Pulls latest from epic branch
- Shows available modules from `/docs` directory
- Creates/checks out feature branch with proper naming
- Shows module documentation path and next steps

### 2. Keep Branch Updated

```bash
npm run dev module sync
```

**What happens:**

- Handles uncommitted changes
- Pulls latest from epic branch
- Rebases current branch on top of epic branch
- Handles merge conflicts with LLM-ready prompts
- Optionally pushes rebased branch

### 3. Complete Feature

```bash
npm run dev module complete
```

**What happens:**

- Commits changes with proper message format
- Rebases from epic branch (with latest pull)
- Handles merge conflicts
- Pushes branch with force-with-lease
- Creates Pull Request using GitHub CLI
- Optionally opens PR in browser

### 4. Deploy Changes

```bash
npm run dev deploy function
```

**What happens:**

- Validates Serverless Framework installation
- Checks AWS credentials for configured profile
- Discovers all functions across modules
- Interactive function selection with search
- Deploys to configured stage

## Module Documentation Integration

The CLI now integrates with module documentation in the `/docs` directory:

- **File Pattern**: `module-{ID}-{name}.md` (e.g., `module-F01-proposal-management.md`)
- **Status Display**: Shows if module is planned (📝) or implemented (✅)
- **Time Estimates**: Extracts estimated time from documentation
- **Branch Naming**: Uses module ID for consistent branch names

## Error Handling & Recovery

The tool includes comprehensive error handling:

- **Git Operations**: Graceful handling of merge conflicts, push failures
- **Network Issues**: Retry logic and clear error messages
- **AWS Credentials**: Validation before deployment attempts
- **Merge Conflicts**: LLM-ready conflict resolution prompts
- **Process Interruption**: Graceful cleanup and state recovery

## Troubleshooting

### Git Rebase Getting Stuck with Vim

If you encounter issues where git rebase operations get stuck waiting for vim input, the CLI now includes several fixes:

1. **Environment Variables**: Automatically sets `GIT_EDITOR=true` to prevent vim from opening
2. **Git Configuration**: Sets `core.editor=true` and `sequence.editor=true` in git config
3. **Non-Interactive Flags**: Uses `--no-edit` flags during rebase and commit operations

These changes ensure that git operations run non-interactively without requiring manual input.

### Other Common Issues

- **AWS Credentials**: Ensure your AWS profile is configured correctly
- **GitHub CLI**: Install `gh` CLI for automatic PR creation
- **Serverless Framework**: Install globally with `npm install -g serverless`

## Dependencies

- **commander**: CLI framework for command structure
- **inquirer**: Interactive prompts and menus
- **chalk**: Terminal colors and styling
- **ora**: Progress spinners and loading indicators
- **simple-git**: Git operations with proper error handling
- **execa**: Process execution for external commands
- **dotenv**: Environment variable loading
- **cli-table3**: Clean table formatting for configuration display

## Building & Development

```bash
# Development mode (with TypeScript compilation)
npm run dev

# Build for production
npm run build

# Run built version
npm start
```

## Environment Variables

| Variable                        | Description                 | Default               |
| ------------------------------- | --------------------------- | --------------------- |
| `EPIC_BRANCH`                   | Main branch to rebase from  | `main`                |
| `SERVERLESS_STAGE`              | Deployment stage            | `dev`                 |
| `DEVOPS_AWS_PROFILE`            | AWS profile for deployments | `default`             |
| `DEFAULT_COMMIT_MESSAGE_PREFIX` | Commit message prefix       | `feat:`               |
| `BACKEND_PATH`                  | Path to backend directory   | `backend`             |
| `MODULES_PATH`                  | Path to modules directory   | `backend/src/modules` |

## Safety Features

- **Force-push with lease**: Prevents overwriting others' work
- **Conflict detection**: Identifies merge conflicts before they cause issues
- **Stash management**: Safely handles uncommitted changes
- **Pre-deployment checks**: Validates environment before deployment
- **Error recovery**: Graceful handling of failed operations
- **Branch protection**: Never directly pushes to epic branch

This creates a production-ready DevOps CLI that streamlines the entire development workflow while maintaining safety and providing excellent user experience!
