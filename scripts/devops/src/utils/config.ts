import { config } from 'dotenv';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import type { Config } from '../types/index.js';

export class ConfigManager {
  private static instance: ConfigManager;
  private config: Config;

  private constructor() {
    this.loadEnvironmentVariables();
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadEnvironmentVariables(): void {
    const gitRoot = this.findGitRoot();

    // Load environment variables in order of precedence (later overrides earlier)
    const envFiles = [
      join(gitRoot, 'backend/.env'), // Backend .env
      join(gitRoot, 'scripts/devops/.env'), // DevOps .env (highest priority)
    ];

    envFiles.forEach((envFile) => {
      if (existsSync(envFile)) {
        config({ path: envFile, override: false }); // Don't override already set variables
      }
    });
  }

  private findGitRoot(): string {
    let currentDir = process.cwd();
    while (currentDir !== '/') {
      if (existsSync(join(currentDir, '.git'))) {
        return currentDir;
      }
      currentDir = resolve(currentDir, '..');
    }
    throw new Error('Not in a git repository');
  }

  private loadConfig(): Config {
    const gitRoot = this.findGitRoot();

    // Resolve paths relative to git root
    const backendPath = process.env.BACKEND_PATH
      ? resolve(gitRoot, process.env.BACKEND_PATH.replace(/^\.\.\/\.\.\//, ''))
      : join(gitRoot, 'backend');

    const modulesPath = process.env.MODULES_PATH
      ? resolve(gitRoot, process.env.MODULES_PATH.replace(/^\.\.\/\.\.\//, ''))
      : join(gitRoot, 'backend/src/modules');

    return {
      epicBranch: process.env.EPIC_BRANCH || 'main',
      stage: process.env.SERVERLESS_STAGE || 'dev',
      awsProfile: process.env.DEVOPS_AWS_PROFILE || 'default',
      defaultCommitPrefix: process.env.DEFAULT_COMMIT_MESSAGE_PREFIX || 'feat:',
      gitRoot,
      backendPath,
      modulesPath,
    };
  }

  public getConfig(): Config {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<Config>): void {
    this.config = { ...this.config, ...updates };
  }
}
