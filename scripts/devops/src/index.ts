#!/usr/bin/env node

import { Command } from 'commander';
import { ModuleCommand } from './commands/module.js';
import { DeployCommand } from './commands/deploy.js';
import { ConfigManager } from './utils/config.js';
import { DisplayUtils } from './utils/display.js';
import chalk from 'chalk';
const program = new Command();
const moduleCmd = new ModuleCommand();
const deployCmd = new DeployCommand();

program
  .name('devops')
  .description('DevOps CLI tool for streamlined development workflow')
  .version('1.0.0')
  .hook('preAction', () => {
    console.log(DisplayUtils.getBanner());
  });

// Module commands
const moduleCommand = program
  .command('module')
  .alias('m')
  .description('Module management commands');

moduleCommand
  .command('new')
  .alias('n')
  .description('Create a new module or work on existing one')
  .action(async () => {
    try {
      await moduleCmd.newModule();
    } catch (error) {
      console.log(chalk.red('\n❌ Operation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

moduleCommand
  .command('complete')
  .alias('c')
  .description('Complete module development (commit, rebase, push, PR)')
  .action(async () => {
    try {
      await moduleCmd.completeModule();
    } catch (error) {
      console.log(chalk.red('\n❌ Operation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

moduleCommand
  .command('sync')
  .alias('s')
  .description('Pull latest changes and rebase current branch')
  .action(async () => {
    try {
      await moduleCmd.pullRebase();
    } catch (error) {
      console.log(chalk.red('\n❌ Operation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Deploy commands
const deployCommand = program.command('deploy').alias('d').description('Deployment commands');

deployCommand
  .command('all')
  .alias('a')
  .description('Deploy all functions and resources')
  .action(async () => {
    try {
      await deployCmd.fullDeploy();
    } catch (error) {
      console.log(chalk.red('\n❌ Deployment failed:'), (error as Error).message);
      process.exit(1);
    }
  });

deployCommand
  .command('function')
  .alias('f')
  .description('Deploy a specific function')
  .action(async () => {
    try {
      await deployCmd.quickDeploy();
    } catch (error) {
      console.log(chalk.red('\n❌ Deployment failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Show current configuration')
  .action(() => {
    const config = ConfigManager.getInstance().getConfig();
    DisplayUtils.showConfiguration(config);
  });

// Interactive mode (default when no command is provided)
program
  .command('interactive', { isDefault: true })
  .description('Interactive mode with menu selection')
  .action(async () => {
    const inquirer = (await import('inquirer')).default;

    console.log(chalk.bold('\n🛠️  Main Menu'));
    console.log(chalk.dim('─'.repeat(30)));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🆕 New Module Creation', value: 'module-new' },
          { name: '✅ Complete Module', value: 'module-complete' },
          { name: '🔄 Pull and Rebase', value: 'module-sync' },
          { name: '🚀 Deploy All Functions', value: 'deploy-all' },
          { name: '⚡ Deploy Single Function', value: 'deploy-function' },
          { name: '⚙️  Show Configuration', value: 'config' },
          { name: '❌ Exit', value: 'exit' },
        ],
        pageSize: 10,
      },
    ]);

    try {
      switch (action) {
        case 'module-new':
          await moduleCmd.newModule();
          break;
        case 'module-complete':
          await moduleCmd.completeModule();
          break;
        case 'module-sync':
          await moduleCmd.pullRebase();
          break;
        case 'deploy-all':
          await deployCmd.fullDeploy();
          break;
        case 'deploy-function':
          await deployCmd.quickDeploy();
          break;
        case 'config':
          const config = ConfigManager.getInstance().getConfig();
          DisplayUtils.showConfiguration(config);
          break;
        case 'exit':
          console.log(chalk.green('\n👋 Goodbye!'));
          process.exit(0);
      }

      // After completing an action, show success message and exit
      console.log(chalk.green('\n✨ Operation completed successfully!'));
      console.log(chalk.dim('Run the command again to perform another action.'));
    } catch (error) {
      console.log(chalk.red('\n❌ Operation failed:'), (error as Error).message);
      process.exit(1);
    }
  });

// Error handling
program.exitOverride();

try {
  program.parse();
} catch (error) {
  console.log(chalk.red('\n❌ Command failed:'), (error as Error).message);
  process.exit(1);
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.log(chalk.red('\n❌ Unhandled Promise Rejection:'), reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.log(chalk.red('\n❌ Uncaught Exception:'), error.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n👋 Goodbye!'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n\n👋 Goodbye!'));
  process.exit(0);
});
