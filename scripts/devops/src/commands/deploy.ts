import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigManager } from '../utils/config.js';
import { DeploymentManager } from '../utils/deployment.js';
import { ModuleManager } from '../utils/modules.js';

export class DeployCommand {
  private config = ConfigManager.getInstance().getConfig();
  private deployment = new DeploymentManager(
    this.config.backendPath,
    this.config.stage,
    this.config.awsProfile
  );
  private modules = new ModuleManager(this.config.modulesPath);

  async fullDeploy(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 Serverless Full Deployment\n'));

    // Show configuration
    this.showDeploymentConfig();

    // Pre-deployment checks
    await this.runPreDeploymentChecks();

    // Confirmation
    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.yellow('This will deploy ALL functions and resources. Are you sure?'),
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Deployment cancelled'));
      return;
    }

    // Navigate to backend folder
    process.chdir(this.config.backendPath);
    console.log(chalk.dim(`Working directory: ${this.config.backendPath}`));

    try {
      await this.deployment.deployAll();
      console.log(chalk.green('\n🎉 Full deployment completed successfully!'));
    } catch (error) {
      console.log(chalk.red('\n❌ Deployment failed'));
      console.log(chalk.red((error as Error).message));
      process.exit(1);
    }
  }

  async quickDeploy(): Promise<void> {
    console.log(chalk.blue.bold('\n⚡ Serverless Quick Deployment\n'));

    // Show configuration
    this.showDeploymentConfig();

    // Pre-deployment checks
    await this.runPreDeploymentChecks();

    // Get available functions
    const functions = this.modules.getAllFunctions();
    if (functions.length === 0) {
      console.log(chalk.red('❌ No functions found in modules'));
      return;
    }

    console.log(chalk.green(`Found ${functions.length} functions across all modules`));

    // Function selection with search
    const { selectedFunction } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFunction',
        message: 'Select function to deploy:',
        choices: functions.map((fn) => ({ name: fn, value: fn })),
        pageSize: 15,
        loop: false,
      },
    ]);

    // Navigate to backend folder
    process.chdir(this.config.backendPath);
    console.log(chalk.dim(`Working directory: ${this.config.backendPath}`));

    try {
      await this.deployment.deployFunction(selectedFunction);
      console.log(
        chalk.green(`\n🎉 Function ${chalk.bold(selectedFunction)} deployed successfully!`)
      );
    } catch (error) {
      console.log(chalk.red('\n❌ Function deployment failed'));
      console.log(chalk.red((error as Error).message));
      process.exit(1);
    }
  }

  private showDeploymentConfig(): void {
    console.log(chalk.bold('Deployment Configuration:'));
    console.log(chalk.dim(`  Stage: ${chalk.cyan(this.config.stage)}`));
    console.log(chalk.dim(`  AWS Profile: ${chalk.cyan(this.config.awsProfile)}`));
    console.log(chalk.dim(`  Backend Path: ${chalk.cyan(this.config.backendPath)}`));
    console.log('');
  }

  private async runPreDeploymentChecks(): Promise<void> {
    console.log(chalk.yellow('Running pre-deployment checks...'));

    // Check Serverless installation
    const hasServerless = await this.deployment.checkServerlessInstallation();
    if (!hasServerless) {
      console.log(chalk.red('❌ Serverless Framework not found'));
      console.log(chalk.yellow('Please install it: npm install -g serverless'));
      process.exit(1);
    }
    console.log(chalk.green('✅ Serverless Framework found'));

    // Check AWS credentials
    const hasAWSCredentials = await this.deployment.checkAWSCredentials();
    if (!hasAWSCredentials) {
      console.log(chalk.red(`❌ AWS credentials not found for profile: ${this.config.awsProfile}`));
      console.log(chalk.yellow('Please configure AWS credentials:'));
      console.log(chalk.dim('  aws configure --profile ' + this.config.awsProfile));
      process.exit(1);
    }
    console.log(chalk.green(`✅ AWS credentials found for profile: ${this.config.awsProfile}`));

    console.log('');
  }
}
