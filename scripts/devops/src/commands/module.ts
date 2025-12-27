import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from '../utils/config.js';
import { GitManager } from '../utils/git.js';
import { ModuleManager } from '../utils/modules.js';
import type { GitStatus } from '../types/index.js';

export class ModuleCommand {
  private config = ConfigManager.getInstance().getConfig();
  private git = new GitManager(this.config.gitRoot);
  private modules = new ModuleManager(this.config.modulesPath);

  async newModule(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 New Module Creation\n'));

    // Navigate to git root
    process.chdir(this.config.gitRoot);
    console.log(chalk.dim(`Working directory: ${this.config.gitRoot}`));

    // Handle uncommitted changes
    await this.handleUncommittedChanges();

    // Checkout to epic branch and pull latest
    await this.git.checkoutBranch(this.config.epicBranch);
    await this.git.pullLatest(this.config.epicBranch);

    // Module selection
    const existingModules = this.modules.getExistingModules();
    const moduleChoices = [
      ...existingModules.map((m) => ({
        name: `${m.name} (${m.functions.length} functions)`,
        value: m.name,
      })),
      { name: chalk.green('+ Create new module'), value: '__new__' },
    ];

    const { selectedModule } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedModule',
        message: 'Select a module:',
        choices: moduleChoices,
        pageSize: 15,
      },
    ]);

    let moduleName: string;
    let moduleId: string;
    if (selectedModule === '__new__') {
      const { newModuleName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'newModuleName',
          message: 'Enter new module name (kebab-case):',
          validate: (input: string) => {
            if (!input.trim()) return 'Module name is required';
            if (!this.modules.validateModuleName(input)) {
              return 'Module name must be in kebab-case (lowercase, hyphens only)';
            }
            if (this.modules.moduleExists(input)) {
              return 'Module already exists';
            }
            return true;
          },
        },
      ]);
      moduleName = newModuleName;
      moduleId = newModuleName;
    } else {
      moduleName = selectedModule;
      moduleId = this.modules.getModuleId(selectedModule);
    }

    // Create and checkout new branch
    const branchName = `feat/${moduleId}`;
    console.log(chalk.cyan(`\nCreating feature branch: ${branchName}`));

    try {
      await this.git.checkoutBranch(branchName, true);
    } catch (error) {
      // Branch might already exist
      console.log(chalk.yellow(`Branch ${branchName} already exists, checking out...`));
      await this.git.checkoutBranch(branchName);
    }

    console.log(chalk.green(`\n✅ Ready to work on module: ${chalk.bold(moduleName)}`));
    console.log(chalk.dim(`Branch: ${branchName}`));
    console.log(chalk.dim(`Module ID: ${moduleId}`));

    // Show module documentation if available
    const docPath = this.modules.getModuleDocPath(moduleId);
    if (docPath) {
      console.log(chalk.blue(`📖 Documentation: ${docPath}`));
    }

    if (selectedModule === '__new__') {
      console.log(chalk.yellow('\n💡 Next steps:'));
      console.log(
        chalk.dim('1. Create the module structure following the architecture guidelines')
      );
      console.log(chalk.dim('2. Implement handlers, services, and types'));
      console.log(chalk.dim('3. Update permissions.ts if needed'));
      console.log(chalk.dim('4. Run tests and ensure coverage'));
      console.log(chalk.dim('5. Use "devops complete" when ready to merge'));
    } else {
      console.log(chalk.yellow('\n💡 Next steps:'));
      console.log(chalk.dim('1. Review the module documentation'));
      console.log(chalk.dim('2. Follow the implementation guidelines'));
      console.log(chalk.dim('3. Implement according to the module specification'));
      console.log(chalk.dim('4. Use "devops complete" when ready to merge'));
    }
  }

  async completeModule(): Promise<void> {
    console.log(chalk.blue.bold('\n✅ Complete Module\n'));

    // Navigate to git root
    process.chdir(this.config.gitRoot);

    // Check current branch
    const currentBranch = await this.git.getCurrentBranch();
    if (currentBranch === this.config.epicBranch) {
      console.log(
        chalk.red(
          `❌ You're on the ${this.config.epicBranch} branch. Please switch to a feature branch first.`
        )
      );
      return;
    }

    console.log(chalk.dim(`Current branch: ${currentBranch}`));

    // Check if there are changes to commit
    const status = await this.git.getStatus();
    if (!status.isClean) {
      await this.commitChanges(status);
    } else {
      console.log(chalk.yellow('No changes to commit'));
    }

    // Rebase from epic branch with proper pull
    console.log(chalk.cyan('\n🔄 Rebasing from epic branch...'));
    const conflictInfo = await this.git.rebaseFromBranch(this.config.epicBranch);

    if (conflictInfo.hasConflicts) {
      await this.handleMergeConflicts(conflictInfo.files);
    }

    // Push branch
    await this.git.pushBranch(currentBranch);

    // Ask about creating PR
    const { createPR } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createPR',
        message: 'Would you like to create a Pull Request?',
        default: true,
      },
    ]);

    if (createPR) {
      await this.createPullRequest(currentBranch);
    }

    // Ask if want to create new module
    const { createNew } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createNew',
        message: 'Would you like to create a new module?',
        default: false,
      },
    ]);

    if (createNew) {
      await this.newModule();
    }
  }

  async pullRebase(): Promise<void> {
    console.log(chalk.blue.bold('\n🔄 Pull and Rebase\n'));

    // Navigate to git root
    process.chdir(this.config.gitRoot);

    // Check current branch
    const currentBranch = await this.git.getCurrentBranch();
    console.log(chalk.dim(`Current branch: ${currentBranch}`));

    // Handle uncommitted changes if any
    const status = await this.git.getStatus();
    if (!status.isClean) {
      console.log(chalk.yellow('⚠️  You have uncommitted changes.'));

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do with uncommitted changes?',
          choices: [
            { name: 'Stash changes and continue', value: 'stash' },
            { name: 'Commit changes first', value: 'commit' },
            { name: 'Cancel operation', value: 'cancel' },
          ],
        },
      ]);

      switch (action) {
        case 'stash':
          await this.git.stashChanges('Auto-stash before pull/rebase');
          break;
        case 'commit':
          await this.commitChanges(status);
          break;
        case 'cancel':
          console.log(chalk.yellow('Operation cancelled'));
          return;
      }
    }

    // If on epic branch, just pull
    if (currentBranch === this.config.epicBranch) {
      await this.git.pullLatest(this.config.epicBranch);
      console.log(chalk.green(`✅ Successfully updated ${this.config.epicBranch} branch`));
      return;
    }

    // For feature branches, rebase from epic branch
    console.log(chalk.cyan(`🔄 Rebasing ${currentBranch} from ${this.config.epicBranch}...`));
    const conflictInfo = await this.git.rebaseFromBranch(this.config.epicBranch);

    if (conflictInfo.hasConflicts) {
      await this.handleMergeConflicts(conflictInfo.files);
    }

    console.log(chalk.green('✅ Pull and rebase completed successfully!'));

    // Ask if want to push the rebased branch
    const { pushBranch } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'pushBranch',
        message: 'Would you like to push the rebased branch?',
        default: false,
      },
    ]);

    if (pushBranch) {
      await this.git.pushBranch(currentBranch, true); // Force push with lease
    }
  }

  private async handleUncommittedChanges(): Promise<void> {
    const status = await this.git.getStatus();
    if (status.isClean) return;

    console.log(chalk.yellow('⚠️  You have uncommitted changes:'));
    if (status.modified.length > 0) {
      console.log(chalk.dim('Modified:'), status.modified.join(', '));
    }
    if (status.untracked.length > 0) {
      console.log(chalk.dim('Untracked:'), status.untracked.join(', '));
    }

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Stash changes and continue', value: 'stash' },
          { name: 'Discard all changes', value: 'discard' },
          { name: 'Exit and commit manually', value: 'exit' },
        ],
      },
    ]);

    switch (action) {
      case 'stash':
        await this.git.stashChanges('Auto-stash before branch operation');
        break;
      case 'discard':
        const { confirmDiscard } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirmDiscard',
            message: chalk.red(
              'Are you sure you want to discard ALL changes? This cannot be undone.'
            ),
            default: false,
          },
        ]);
        if (confirmDiscard) {
          await this.git.discardChanges();
        } else {
          console.log(chalk.yellow('Operation cancelled'));
          process.exit(0);
        }
        break;
      case 'exit':
        console.log(chalk.blue('Please commit your changes and run the script again.'));
        process.exit(0);
    }
  }

  private async commitChanges(status: GitStatus): Promise<void> {
    console.log(chalk.cyan('\n📝 Committing changes...'));

    // Show what will be committed
    if (status.modified.length > 0) {
      console.log(chalk.dim('Modified files:'), status.modified.join(', '));
    }
    if (status.untracked.length > 0) {
      console.log(chalk.dim('New files:'), status.untracked.join(', '));
    }

    const { commitMessage } = await inquirer.prompt([
      {
        type: 'input',
        name: 'commitMessage',
        message: 'Enter commit message:',
        default: `${this.config.defaultCommitPrefix} implement module changes`,
        validate: (input: string) => input.trim().length > 0 || 'Commit message is required',
      },
    ]);

    await this.git.addAndCommit(commitMessage);
  }

  private async handleMergeConflicts(conflictFiles: string[]): Promise<void> {
    console.log(chalk.red('\n❌ Merge conflicts detected in:'));
    conflictFiles.forEach((file) => console.log(chalk.red(`  - ${file}`)));

    console.log(chalk.yellow('\n🤖 LLM Prompt for Conflict Resolution:'));
    console.log(chalk.cyan('='.repeat(60)));
    console.log('I have merge conflicts in the following files during a git rebase:');
    conflictFiles.forEach((file) => console.log(`- ${file}`));
    console.log('\nPlease help me resolve these conflicts by:');
    console.log('1. Analyzing the conflicting changes');
    console.log('2. Providing the resolved version of each file');
    console.log('3. Explaining the resolution strategy used');
    console.log(`\nContext: I'm rebasing a feature branch onto ${this.config.epicBranch}`);
    console.log(chalk.cyan('='.repeat(60)));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'After resolving conflicts, what would you like to do?',
        choices: [
          { name: 'Continue rebase (conflicts resolved)', value: 'continue' },
          { name: 'Abort rebase', value: 'abort' },
        ],
      },
    ]);

    if (action === 'continue') {
      await this.git.continueRebase();
    } else {
      await this.git.abortRebase();
      throw new Error('Rebase was aborted due to conflicts');
    }
  }

  private async createPullRequest(currentBranch: string): Promise<void> {
    // Get PR details
    const defaultTitle = currentBranch.replace(/^feat\//, '').replace(/-/g, ' ');

    const { prTitle, prDescription } = await inquirer.prompt([
      {
        type: 'input',
        name: 'prTitle',
        message: 'Enter PR title:',
        default: defaultTitle,
        validate: (input: string) => input.trim().length > 0 || 'PR title is required',
      },
      {
        type: 'input',
        name: 'prDescription',
        message: 'Enter PR description (optional):',
        default: `Implements ${defaultTitle}`,
      },
    ]);

    const prUrl = await this.git.createPullRequest(
      currentBranch,
      this.config.epicBranch,
      prTitle,
      prDescription
    );

    if (prUrl) {
      const { openPR } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'openPR',
          message: 'Would you like to open the PR in your browser?',
          default: true,
        },
      ]);

      if (openPR) {
        await this.git.openPRInBrowser();
      }
    }
  }
}
