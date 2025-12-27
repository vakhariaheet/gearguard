#!/usr/bin/env bun

import { execSync, spawn } from 'child_process';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { createInterface } from 'readline';

// Color utilities for better UX
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
};

// Terminal control sequences
const terminal = {
  clearScreen: '\x1b[2J',
  clearLine: '\x1b[2K',
  cursorUp: (n: number) => `\x1b[${n}A`,
  cursorDown: (n: number) => `\x1b[${n}B`,
  cursorHome: '\x1b[H',
  hideCursor: '\x1b[?25l',
  showCursor: '\x1b[?25h',
  saveCursor: '\x1b[s',
  restoreCursor: '\x1b[u',
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
  step: (msg: string) => console.log(`${colors.magenta}→${colors.reset} ${msg}`),
};

interface Config {
  epicBranch: string;
  stage: string;
  awsProfile: string;
  gitRoot: string;
  backendPath: string;
  modulesPath: string;
}

class DevOpsScript {
  private config: Config;
  private rl: any;

  constructor() {
    this.config = this.loadConfig();
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private loadConfig(): Config {
    // Find git root
    const gitRoot = this.findGitRoot();

    // Load environment variables from backend/.env
    const envPath = join(gitRoot, 'backend', '.env');
    if (existsSync(envPath)) {
      try {
        const envContent = readFileSync(envPath, 'utf-8');
        const envVars = this.parseEnvFile(envContent);

        // Merge with existing process.env, giving priority to existing env vars
        Object.entries(envVars).forEach(([key, value]) => {
          if (!process.env[key]) {
            process.env[key] = value;
          }
        });

        log.info(`Loaded environment variables from: ${envPath}`);
      } catch (error) {
        log.warning(`Failed to load .env file: ${(error as Error).message}`);
      }
    } else {
      log.warning(`No .env file found at: ${envPath}`);
    }

    return {
      epicBranch: process.env.EPIC_BRANCH || 'main',
      stage: process.env.SERVERLESS_STAGE || 'dev',
      awsProfile: process.env.AWS_PROFILE || 'default',
      gitRoot,
      backendPath: join(gitRoot, 'backend'),
      modulesPath: join(gitRoot, 'backend', 'src', 'modules'),
    };
  }

  private findGitRoot(): string {
    let currentDir = process.cwd();
    const root = resolve('/'); // This will be 'C:\' on Windows, '/' on Unix

    while (currentDir !== root) {
      if (existsSync(join(currentDir, '.git'))) {
        return currentDir;
      }
      const parentDir = resolve(currentDir, '..');
      // Prevent infinite loop if we can't go up further
      if (parentDir === currentDir) {
        break;
      }
      currentDir = parentDir;
    }
    throw new Error('Not in a git repository');
  }

  private parseEnvFile(content: string): Record<string, string> {
    const env: Record<string, string> = {};
    // Handle both Unix (\n) and Windows (\r\n) line endings
    content.split(/\r?\n/).forEach((line) => {
      // Skip empty lines and comments
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        return;
      }

      const match = trimmedLine.match(/^([^=]+?)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, '');
        env[key] = value;
      }
    });
    return env;
  }

  private async execCommand(command: string, cwd?: string): Promise<string> {
    try {
      const result = execSync(command, {
        cwd: cwd || this.config.gitRoot,
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return result.toString().trim();
    } catch (error: any) {
      throw new Error(`Command failed: ${command}\n${error.message}`);
    }
  }

  private async prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  private async select(question: string, options: string[]): Promise<string> {
    console.log(`\n${colors.bright}${question}${colors.reset}`);
    options.forEach((option, index) => {
      console.log(`  ${colors.cyan}${index + 1}${colors.reset}. ${option}`);
    });

    while (true) {
      const answer = await this.prompt(`\nSelect (1-${options.length}): `);
      const index = parseInt(answer) - 1;
      if (index >= 0 && index < options.length) {
        return options[index];
      }
      log.error('Invalid selection. Please try again.');
    }
  }

  private async autocompleteSelect(question: string, options: string[]): Promise<string> {
    if (options.length === 0) {
      throw new Error('No options available');
    }

    return new Promise((resolve, reject) => {
      let searchTerm = '';
      let selectedIndex = 0;
      let filteredOptions = options;
      const maxDisplayItems = 10;

      // Set up raw mode for real-time input
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(true);
      }
      process.stdin.resume();
      process.stdin.setEncoding('utf8');

      const cleanup = () => {
        if (process.stdin.isTTY) {
          process.stdin.setRawMode(false);
        }
        process.stdin.pause();
        process.stdout.write(terminal.showCursor);
        process.stdin.removeAllListeners('data');
      };

      const updateDisplay = () => {
        // Filter options based on search term
        filteredOptions = options.filter((option) =>
          option.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Reset selected index if out of bounds
        if (selectedIndex >= filteredOptions.length) {
          selectedIndex = Math.max(0, filteredOptions.length - 1);
        }

        // Clear screen and move cursor to top
        process.stdout.write(terminal.clearScreen + terminal.cursorHome);

        // Display header
        console.log(`${colors.bright}${colors.cyan}${question}${colors.reset}`);
        console.log(
          `${colors.dim}Type to search, ↑↓ to navigate, Enter to select, Esc to cancel${colors.reset}\n`
        );

        // Display search box
        console.log(
          `${colors.yellow}Search: ${colors.bright}${searchTerm}${colors.reset}${colors.yellow}█${colors.reset}\n`
        );

        // Display results
        if (filteredOptions.length === 0) {
          console.log(`${colors.red}No matches found${colors.reset}`);
        } else {
          console.log(`${colors.green}${filteredOptions.length} matches:${colors.reset}`);

          const displayOptions = filteredOptions.slice(0, maxDisplayItems);
          displayOptions.forEach((option, index) => {
            const isSelected = index === selectedIndex;
            if (isSelected) {
              console.log(`${colors.bgBlue}${colors.white} ▶ ${option} ${colors.reset}`);
            } else {
              console.log(`   ${option}`);
            }
          });

          if (filteredOptions.length > maxDisplayItems) {
            console.log(
              `${colors.dim}   ... and ${filteredOptions.length - maxDisplayItems} more${colors.reset}`
            );
          }
        }

        // Hide cursor
        process.stdout.write(terminal.hideCursor);
      };

      // Buffer for handling escape sequences
      let inputBuffer = '';

      const processInput = (chunk: string) => {
        inputBuffer += chunk;

        // Process complete sequences
        while (inputBuffer.length > 0) {
          // Check for escape sequences first
          if (inputBuffer.startsWith('\x1b')) {
            // Arrow keys: \x1b[A (up), \x1b[B (down), \x1b[C (right), \x1b[D (left)
            if (inputBuffer.length >= 3 && inputBuffer.startsWith('\x1b[')) {
              const arrowKey = inputBuffer.substring(0, 3);
              inputBuffer = inputBuffer.substring(3);

              switch (arrowKey) {
                case '\x1b[A': // Up arrow
                  if (selectedIndex > 0) {
                    selectedIndex--;
                    updateDisplay();
                  }
                  break;
                case '\x1b[B': // Down arrow
                  if (selectedIndex < Math.min(filteredOptions.length - 1, maxDisplayItems - 1)) {
                    selectedIndex++;
                    updateDisplay();
                  }
                  break;
                case '\x1b[C': // Right arrow - ignore
                case '\x1b[D': // Left arrow - ignore
                  break;
              }
              continue;
            }

            // Other escape sequences - check if we have enough data
            if (inputBuffer.length < 3) {
              break; // Wait for more data
            }

            // If it's just escape key
            if (inputBuffer.length === 1 || inputBuffer[1] !== '[') {
              inputBuffer = inputBuffer.substring(1);
              cleanup();
              reject(new Error('Selection cancelled'));
              return;
            }
          }

          // Process single character
          const char = inputBuffer[0];
          inputBuffer = inputBuffer.substring(1);
          const keyCode = char.charCodeAt(0);

          switch (keyCode) {
            case 3: // Ctrl+C
              cleanup();
              process.exit(0);
              break;

            case 13: // Enter
              cleanup();
              if (filteredOptions.length > 0) {
                resolve(filteredOptions[selectedIndex]);
              } else {
                reject(new Error('No option selected'));
              }
              return;

            case 127: // Backspace
            case 8: // Backspace (alternative)
              if (searchTerm.length > 0) {
                searchTerm = searchTerm.slice(0, -1);
                selectedIndex = 0;
                updateDisplay();
              }
              break;

            default:
              if (keyCode >= 32 && keyCode <= 126) {
                // Printable characters
                searchTerm += char;
                selectedIndex = 0;
                updateDisplay();
              }
              break;
          }
        }
      };

      process.stdin.on('data', (data: Buffer) => {
        processInput(data.toString());
      });

      // Handle process termination
      process.on('SIGINT', () => {
        cleanup();
        process.exit(0);
      });

      // Initial display
      updateDisplay();
    });
  }

  private getExistingModules(): string[] {
    if (!existsSync(this.config.modulesPath)) {
      return [];
    }
    return readdirSync(this.config.modulesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  }

  private getFunctionNames(): string[] {
    const functions: string[] = [];
    const modules = this.getExistingModules();

    modules.forEach((module) => {
      const functionsPath = join(this.config.modulesPath, module, 'functions');
      if (existsSync(functionsPath)) {
        const functionFiles = readdirSync(functionsPath)
          .filter((file) => file.endsWith('.yml'))
          .map((file) => file.replace('.yml', '')); // Just the filename without extension
        functions.push(...functionFiles);
      }
    });

    return functions;
  }

  private async checkGitStatus(): Promise<boolean> {
    try {
      const status = await this.execCommand('git status --porcelain');
      return status.length === 0;
    } catch {
      return false;
    }
  }

  private async handleUncommittedChanges(): Promise<void> {
    const isClean = await this.checkGitStatus();
    if (!isClean) {
      log.warning('You have uncommitted changes.');
      const action = await this.select('What would you like to do?', [
        'Stash changes and continue',
        'Discard all changes',
        'Exit and commit manually',
      ]);

      switch (action) {
        case 'Stash changes and continue':
          await this.execCommand('git stash push -m "Auto-stash before branch operation"');
          log.success('Changes stashed successfully');
          break;
        case 'Discard all changes':
          await this.execCommand('git reset --hard HEAD');
          await this.execCommand('git clean -fd');
          log.success('All changes discarded');
          break;
        case 'Exit and commit manually':
          log.info('Please commit your changes and run the script again.');
          process.exit(0);
      }
    }
  }

  private async createMergeConflictPrompt(conflictFiles: string[]): Promise<void> {
    log.error('Merge conflicts detected in the following files:');
    conflictFiles.forEach((file) => console.log(`  - ${file}`));

    console.log(
      `\n${colors.bright}${colors.yellow}LLM Prompt for Conflict Resolution:${colors.reset}`
    );
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`I have merge conflicts in the following files during a git rebase:`);
    conflictFiles.forEach((file) => console.log(`- ${file}`));
    console.log(`\nPlease help me resolve these conflicts by:`);
    console.log(`1. Analyzing the conflicting changes`);
    console.log(`2. Providing the resolved version of each file`);
    console.log(`3. Explaining the resolution strategy used`);
    console.log(`\nContext: I'm rebasing a feature branch onto ${this.config.epicBranch}`);
    console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

    const action = await this.select('After resolving conflicts, what would you like to do?', [
      'Continue rebase (conflicts resolved)',
      'Abort rebase',
    ]);

    if (action === 'Continue rebase (conflicts resolved)') {
      await this.execCommand('git rebase --continue');
      log.success('Rebase continued successfully');
    } else {
      await this.execCommand('git rebase --abort');
      log.warning('Rebase aborted');
      throw new Error('Rebase was aborted due to conflicts');
    }
  }

  async newModuleCreation(): Promise<void> {
    log.title('🚀 New Module Creation');

    // Navigate to git root
    process.chdir(this.config.gitRoot);
    log.step(`Changed directory to: ${this.config.gitRoot}`);

    // Handle uncommitted changes
    await this.handleUncommittedChanges();

    // Checkout to epic branch and pull
    log.step(`Checking out to ${this.config.epicBranch} branch...`);
    await this.execCommand(`git checkout ${this.config.epicBranch}`);

    log.step('Pulling latest changes...');
    await this.execCommand('git pull origin ' + this.config.epicBranch);
    log.success(`Successfully updated ${this.config.epicBranch} branch`);

    // Module selection
    const existingModules = this.getExistingModules();
    const moduleOptions = [...existingModules, '+ Create new module'];

    const selectedModule = await this.select('Select a module:', moduleOptions);

    let moduleName: string;
    if (selectedModule === '+ Create new module') {
      moduleName = await this.prompt('Enter new module name (kebab-case): ');
      // Validate module name
      if (!/^[a-z][a-z0-9-]*$/.test(moduleName)) {
        throw new Error('Module name must be in kebab-case (lowercase, hyphens only)');
      }
    } else {
      moduleName = selectedModule;
    }

    // Create and checkout new branch
    const branchName = `feat/${moduleName}`;
    log.step(`Creating and checking out branch: ${branchName}`);

    try {
      await this.execCommand(`git checkout -b ${branchName}`);
      log.success(`Successfully created and checked out branch: ${branchName}`);
    } catch (error) {
      // Branch might already exist
      log.warning(`Branch ${branchName} already exists, checking out...`);
      await this.execCommand(`git checkout ${branchName}`);
    }
  }

  async completeModule(): Promise<void> {
    log.title('✅ Complete Module');

    // Navigate to git root
    process.chdir(this.config.gitRoot);
    log.step(`Changed directory to: ${this.config.gitRoot}`);

    // Check if there are changes to commit
    const isClean = await this.checkGitStatus();
    if (isClean) {
      log.warning('No changes to commit');
    } else {
      // Stage and commit all changes
      log.step('Staging all changes...');
      await this.execCommand('git add .');

      const commitMessage = await this.prompt('Enter commit message: ');
      log.step('Committing changes...');
      await this.execCommand(`git commit -m "${commitMessage}"`);
      log.success('Changes committed successfully');
    }

    // Get current branch
    const currentBranch = await this.execCommand('git branch --show-current');

    // Rebase from epic branch
    log.step(`Rebasing from ${this.config.epicBranch}...`);
    try {
      await this.execCommand(`git rebase ${this.config.epicBranch}`);
      log.success('Rebase completed successfully');
    } catch (error) {
      // Check for conflicts
      try {
        const conflictFiles = await this.execCommand('git diff --name-only --diff-filter=U');
        if (conflictFiles) {
          await this.createMergeConflictPrompt(conflictFiles.split('\n').filter((f) => f.trim()));
        }
      } catch {
        throw error;
      }
    }

    // Push branch
    log.step('Pushing branch...');
    try {
      await this.execCommand(`git push origin ${currentBranch}`);
      log.success('Branch pushed successfully');
    } catch (error) {
      // Try force push if needed
      log.warning('Normal push failed, trying force push...');
      await this.execCommand(`git push --force-with-lease origin ${currentBranch}`);
      log.success('Branch force-pushed successfully');
    }

    // Ask about creating PR
    const createPR = await this.select('Would you like to create a Pull Request?', [
      'Yes, create PR to epic branch',
      'No, skip PR creation',
    ]);

    if (createPR === 'Yes, create PR to epic branch') {
      await this.createPullRequest(currentBranch);
    }

    // Ask if want to create new module
    const createNew = await this.select('Would you like to create a new module?', ['Yes', 'No']);

    if (createNew === 'Yes') {
      await this.newModuleCreation();
    }
  }

  private async createPullRequest(currentBranch: string): Promise<void> {
    log.step('Creating Pull Request...');

    try {
      // Check if GitHub CLI is available
      await this.execCommand('gh --version');
      log.info('GitHub CLI found');
    } catch (error) {
      log.error('GitHub CLI not found. Please install it: https://cli.github.com/');
      return;
    }

    try {
      // Get PR title from branch name or user input
      const defaultTitle = currentBranch.replace(/^feat\//, '').replace(/-/g, ' ');
      const prTitle = (await this.prompt(`Enter PR title (${defaultTitle}): `)) || defaultTitle;

      // Get PR description
      const prDescription =
        (await this.prompt('Enter PR description (optional): ')) || `Implements ${prTitle}`;

      // Create PR using GitHub CLI
      const prCommand = [
        'gh',
        'pr',
        'create',
        '--base',
        this.config.epicBranch,
        '--head',
        currentBranch,
        '--title',
        prTitle,
        '--body',
        prDescription,
      ];

      log.step(`Creating PR: ${currentBranch} → ${this.config.epicBranch}`);

      // Create PR using GitHub CLI with proper argument escaping
      const prResult = await this.execCommand(
        `gh pr create --base "${this.config.epicBranch}" --head "${currentBranch}" --title "${prTitle}" --body "${prDescription}"`
      );

      // Extract PR URL from result
      const prUrl = prResult.match(/https:\/\/github\.com\/[^\s]+/)?.[0];

      if (prUrl) {
        log.success(`Pull Request created successfully!`);
        console.log(`${colors.cyan}PR URL: ${prUrl}${colors.reset}`);

        // Ask if want to open PR in browser
        const openPR = await this.select('Would you like to open the PR in your browser?', [
          'Yes, open in browser',
          'No, continue',
        ]);

        if (openPR === 'Yes, open in browser') {
          try {
            await this.execCommand(`gh pr view --web`);
            log.success('PR opened in browser');
          } catch (error) {
            log.warning('Could not open browser automatically');
            console.log(`Please visit: ${prUrl}`);
          }
        }
      } else {
        log.success('Pull Request created successfully!');
      }
    } catch (error) {
      log.error('Failed to create Pull Request: ' + (error as Error).message);
      log.info('You can create the PR manually on GitHub');
    }
  }

  async serverlessFullDeployment(): Promise<void> {
    log.title('🚀 Serverless Full Deployment');

    // Navigate to backend folder
    process.chdir(this.config.backendPath);
    log.step(`Changed directory to: ${this.config.backendPath}`);

    log.step(`Deploying to stage: ${this.config.stage}`);
    log.warning('This will deploy all functions and resources...');

    const confirm = await this.select('Are you sure you want to proceed?', [
      'Yes, deploy everything',
      'No, cancel',
    ]);

    if (confirm === 'No, cancel') {
      log.info('Deployment cancelled');
      return;
    }

    try {
      log.step('Starting full serverless deployment...');

      // Use the custom deploy.sh script instead of direct serverless command
      const deployProcess = spawn('./deploy.sh', [this.config.stage], {
        cwd: this.config.backendPath,
        stdio: 'inherit',
        shell: true,
      });

      await new Promise((resolve, reject) => {
        deployProcess.on('close', (code) => {
          if (code === 0) {
            resolve(code);
          } else {
            reject(new Error(`Deployment failed with exit code ${code}`));
          }
        });
      });

      log.success('Full deployment completed successfully!');
    } catch (error) {
      log.error('Deployment failed: ' + (error as Error).message);
      throw error;
    }
  }

  async serverlessQuickDeployment(): Promise<void> {
    log.title('⚡ Serverless Quick Deployment');

    // Navigate to backend folder
    process.chdir(this.config.backendPath);
    log.step(`Changed directory to: ${this.config.backendPath}`);

    // Get available functions
    const functions = this.getFunctionNames();
    if (functions.length === 0) {
      log.error('No functions found in modules');
      return;
    }

    log.info(`Found ${functions.length} functions across all modules`);
    const selectedFunction = await this.autocompleteSelect('Select function to deploy:', functions);

    log.step(`Deploying function: ${selectedFunction} to stage: ${this.config.stage}`);
    log.step(`Using AWS Profile: ${this.config.awsProfile}`);

    try {
      // Set AWS_PROFILE environment variable for the deployment
      const deployEnv = {
        ...process.env,
        AWS_PROFILE: this.config.awsProfile,
      };

      // Use spawn for real-time output with AWS profile
      const deployProcess = spawn(
        'npx',
        ['serverless', 'deploy', 'function', '-f', selectedFunction, '--stage', this.config.stage],
        {
          cwd: this.config.backendPath,
          stdio: 'inherit',
          env: deployEnv,
        }
      );

      await new Promise((resolve, reject) => {
        deployProcess.on('close', (code) => {
          if (code === 0) {
            resolve(code);
          } else {
            reject(new Error(`Function deployment failed with exit code ${code}`));
          }
        });
      });

      log.success(`Function ${selectedFunction} deployed successfully!`);
    } catch (error) {
      log.error('Function deployment failed: ' + (error as Error).message);
      throw error;
    }
  }

  async showMainMenu(): Promise<void> {
    log.title('🛠️  DevOps Script - Main Menu');

    console.log(`${colors.bright}Configuration:${colors.reset}`);
    console.log(`  Epic Branch: ${colors.cyan}${this.config.epicBranch}${colors.reset}`);
    console.log(`  Stage: ${colors.cyan}${this.config.stage}${colors.reset}`);
    console.log(`  AWS Profile: ${colors.cyan}${this.config.awsProfile}${colors.reset}`);
    console.log(`  Git Root: ${colors.cyan}${this.config.gitRoot}${colors.reset}`);

    // Debug info for troubleshooting
    if (process.env.NODE_ENV === 'development' || process.argv.includes('--debug')) {
      console.log(`\n${colors.dim}Debug Info:${colors.reset}`);
      console.log(`  Platform: ${colors.dim}${process.platform}${colors.reset}`);
      console.log(`  CWD: ${colors.dim}${process.cwd()}${colors.reset}`);
      console.log(
        `  EPIC_BRANCH env: ${colors.dim}${process.env.EPIC_BRANCH || 'not set'}${colors.reset}`
      );
      console.log(
        `  SERVERLESS_STAGE env: ${colors.dim}${process.env.SERVERLESS_STAGE || 'not set'}${colors.reset}`
      );
      console.log(
        `  AWS_PROFILE env: ${colors.dim}${process.env.AWS_PROFILE || 'not set'}${colors.reset}`
      );
    }

    const options = [
      '🆕 New Module Creation',
      '✅ Complete Module',
      '🚀 Serverless Full Deployment',
      '⚡ Serverless Quick Deployment',
      '❌ Exit',
    ];

    const selection = await this.select('What would you like to do?', options);

    try {
      switch (selection) {
        case '🆕 New Module Creation':
          await this.newModuleCreation();
          break;
        case '✅ Complete Module':
          await this.completeModule();
          break;
        case '🚀 Serverless Full Deployment':
          await this.serverlessFullDeployment();
          break;
        case '⚡ Serverless Quick Deployment':
          await this.serverlessQuickDeployment();
          break;
        case '❌ Exit':
          log.info('Goodbye! 👋');
          this.rl.close();
          return;
      }

      // Show menu again after operation
      setTimeout(() => this.showMainMenu(), 1000);
    } catch (error) {
      log.error('Operation failed: ' + (error as Error).message);
      setTimeout(() => this.showMainMenu(), 2000);
    }
  }

  async run(): Promise<void> {
    try {
      await this.showMainMenu();
    } catch (error) {
      log.error('Script failed: ' + (error as Error).message);
      process.exit(1);
    }
  }
}

// Run the script
const script = new DevOpsScript();
script.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
