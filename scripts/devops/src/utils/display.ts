import chalk from 'chalk';
import Table from 'cli-table3';

export class DisplayUtils {
  static getBanner(): string {
    // Get terminal width, default to 80 if not available
    const terminalWidth = process.stdout.columns || 80;
    const boxWidth = Math.min(64, terminalWidth - 4); // Leave some margin

    // Calculate padding for centering text
    const titleText = 'DevOps CLI Tool';
    const subtitleText = 'Streamlined development workflow';

    const titlePadding = Math.max(0, Math.floor((boxWidth - titleText.length) / 2));
    const subtitlePadding = Math.max(0, Math.floor((boxWidth - subtitleText.length) / 2));

    // Create the box with proper width
    const topBorder = '╔' + '═'.repeat(boxWidth) + '╗';
    const bottomBorder = '╚' + '═'.repeat(boxWidth) + '╝';
    const emptyLine = '║' + ' '.repeat(boxWidth) + '║';

    const titleLine =
      '║' +
      ' '.repeat(titlePadding) +
      chalk.bold.white(titleText) +
      ' '.repeat(boxWidth - titlePadding - titleText.length) +
      '║';
    const subtitleLine =
      '║' +
      ' '.repeat(subtitlePadding) +
      chalk.dim(subtitleText) +
      ' '.repeat(boxWidth - subtitlePadding - subtitleText.length) +
      '║';

    const banner = `
${chalk.cyan(topBorder)}
${chalk.cyan(emptyLine)}
${chalk.cyan(titleLine)}
${chalk.cyan(subtitleLine)}
${chalk.cyan(emptyLine)}
${chalk.cyan(bottomBorder)}
`;
    return banner;
  }

  static showConfiguration(config: any): void {
    console.log(chalk.bold('\n⚙️  Current Configuration\n'));

    const table = new Table({
      head: [chalk.cyan('Setting'), chalk.cyan('Value')],
      colWidths: [20, 60],
      style: {
        head: [],
        border: ['dim'],
      },
      chars: {
        top: '─',
        'top-mid': '┬',
        'top-left': '┌',
        'top-right': '┐',
        bottom: '─',
        'bottom-mid': '┴',
        'bottom-left': '└',
        'bottom-right': '┘',
        left: '│',
        'left-mid': '├',
        mid: '─',
        'mid-mid': '┼',
        right: '│',
        'right-mid': '┤',
        middle: '│',
      },
    });

    table.push(
      [chalk.yellow('Epic Branch'), chalk.white(config.epicBranch)],
      [chalk.yellow('Stage'), chalk.white(config.stage)],
      [chalk.yellow('AWS Profile'), chalk.white(config.awsProfile)],
      [chalk.yellow('Commit Prefix'), chalk.white(config.defaultCommitPrefix)],
      [chalk.yellow('Git Root'), chalk.dim(this.truncatePath(config.gitRoot, 50))],
      [chalk.yellow('Backend Path'), chalk.dim(this.truncatePath(config.backendPath, 50))],
      [chalk.yellow('Modules Path'), chalk.dim(this.truncatePath(config.modulesPath, 50))]
    );

    console.log(table.toString());
    console.log('');
  }

  static showModuleInfo(
    moduleName: string,
    moduleId: string,
    branchName: string,
    docPath?: string
  ): void {
    console.log(chalk.green(`\n✅ Ready to work on module`));

    const table = new Table({
      colWidths: [15, 65],
      style: {
        head: [],
        border: ['dim'],
      },
      chars: {
        top: '',
        'top-mid': '',
        'top-left': '',
        'top-right': '',
        bottom: '',
        'bottom-mid': '',
        'bottom-left': '',
        'bottom-right': '',
        left: '',
        'left-mid': '',
        mid: '',
        'mid-mid': '',
        right: '',
        'right-mid': '',
        middle: ' ',
      },
    });

    table.push(
      [chalk.dim('Module:'), chalk.bold.white(moduleName)],
      [chalk.dim('Module ID:'), chalk.cyan(moduleId)],
      [chalk.dim('Branch:'), chalk.cyan(branchName)]
    );

    if (docPath) {
      table.push([chalk.dim('Documentation:'), chalk.blue(this.truncatePath(docPath, 50))]);
    }

    console.log(table.toString());
  }

  static showNextSteps(isNewModule: boolean): void {
    console.log(chalk.yellow('\n💡 Next Steps:'));

    if (isNewModule) {
      const steps = [
        'Create the module structure following architecture guidelines',
        'Implement handlers, services, and types',
        'Update permissions.ts if needed',
        'Run tests and ensure coverage',
        'Use "devops complete" when ready to merge',
      ];

      steps.forEach((step, index) => {
        console.log(chalk.dim(`   ${index + 1}. ${step}`));
      });
    } else {
      const steps = [
        'Review the module documentation',
        'Follow the implementation guidelines',
        'Implement according to the module specification',
        'Use "devops complete" when ready to merge',
      ];

      steps.forEach((step, index) => {
        console.log(chalk.dim(`   ${index + 1}. ${step}`));
      });
    }
  }

  static showConflictPrompt(conflictFiles: string[]): void {
    console.log(chalk.red('\n❌ Merge conflicts detected:'));

    const table = new Table({
      head: [chalk.red('Conflicted Files')],
      colWidths: [80],
      style: {
        head: [],
        border: ['red'],
      },
    });

    conflictFiles.forEach((file) => {
      table.push([chalk.white(file)]);
    });

    console.log(table.toString());

    console.log(chalk.yellow('\n🤖 LLM Prompt for Conflict Resolution:'));
    console.log(chalk.cyan('═'.repeat(80)));
    console.log('I have merge conflicts in the following files during a git rebase:');
    conflictFiles.forEach((file) => console.log(`- ${file}`));
    console.log('\nPlease help me resolve these conflicts by:');
    console.log('1. Analyzing the conflicting changes');
    console.log('2. Providing the resolved version of each file');
    console.log('3. Explaining the resolution strategy used');
    console.log("\nContext: I'm rebasing a feature branch onto the epic branch");
    console.log(chalk.cyan('═'.repeat(80)));
  }

  static showDeploymentConfig(config: any): void {
    console.log(chalk.bold('\n🚀 Deployment Configuration\n'));

    const table = new Table({
      head: [chalk.cyan('Setting'), chalk.cyan('Value')],
      colWidths: [20, 40],
      style: {
        head: [],
        border: ['dim'],
      },
    });

    table.push(
      [chalk.yellow('Stage'), chalk.white(config.stage)],
      [chalk.yellow('AWS Profile'), chalk.white(config.awsProfile)],
      [chalk.yellow('Backend Path'), chalk.dim(this.truncatePath(config.backendPath, 35))]
    );

    console.log(table.toString());
    console.log('');
  }

  static showSuccess(message: string): void {
    console.log(chalk.green(`\n✨ ${message}`));
    console.log(chalk.dim('Run the command again to perform another action.\n'));
  }

  static showError(message: string): void {
    console.log(chalk.red(`\n❌ ${message}\n`));
  }

  static showWarning(message: string): void {
    console.log(chalk.yellow(`\n⚠️  ${message}\n`));
  }

  static showInfo(message: string): void {
    console.log(chalk.blue(`\nℹ️  ${message}\n`));
  }

  private static truncatePath(path: string, maxLength: number): string {
    if (path.length <= maxLength) return path;

    const parts = path.split('/');
    if (parts.length <= 2) return path;

    // Show first part and last 2 parts with ellipsis
    const start = parts[0];
    const end = parts.slice(-2).join('/');
    const truncated = `${start}/.../${end}`;

    return truncated.length <= maxLength ? truncated : `.../${end}`;
  }
}
