import { execa } from 'execa';
import ora from 'ora';
import chalk from 'chalk';

export class DeploymentManager {
  private backendPath: string;
  private stage: string;
  private awsProfile: string;

  constructor(backendPath: string, stage: string, awsProfile: string) {
    this.backendPath = backendPath;
    this.stage = stage;
    this.awsProfile = awsProfile;
  }

  async deployAll(): Promise<void> {
    const spinner = ora(`Deploying all functions to ${this.stage}...`).start();

    try {
      await execa('./deploy.sh', [this.stage], {
        cwd: this.backendPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          AWS_PROFILE: this.awsProfile,
        },
      });

      spinner.succeed('Full deployment completed successfully!');
    } catch (error) {
      spinner.fail('Deployment failed');
      throw error;
    }
  }

  async deployFunction(functionName: string): Promise<void> {
    const spinner = ora(`Deploying function ${functionName} to ${this.stage}...`).start();

    try {
      await execa(
        'npx',
        ['serverless', 'deploy', 'function', '-f', functionName, '--stage', this.stage],
        {
          cwd: this.backendPath,
          stdio: 'inherit',
          env: {
            ...process.env,
            AWS_PROFILE: this.awsProfile,
          },
        }
      );

      spinner.succeed(`Function ${chalk.cyan(functionName)} deployed successfully!`);
    } catch (error) {
      spinner.fail(`Function deployment failed`);
      throw error;
    }
  }

  async checkServerlessInstallation(): Promise<boolean> {
    try {
      await execa('npx', ['serverless', '--version'], {
        cwd: this.backendPath,
        stdio: 'pipe',
      });
      return true;
    } catch {
      return false;
    }
  }

  async checkAWSCredentials(): Promise<boolean> {
    try {
      await execa('aws', ['sts', 'get-caller-identity', '--profile', this.awsProfile], {
        stdio: 'pipe',
      });
      return true;
    } catch {
      return false;
    }
  }
}
