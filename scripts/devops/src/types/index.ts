export interface Config {
  epicBranch: string;
  stage: string;
  awsProfile: string;
  gitRoot: string;
  backendPath: string;
  modulesPath: string;
  defaultCommitPrefix: string;
}

export interface ModuleInfo {
  name: string;
  path: string;
  functions: string[];
}

export interface GitStatus {
  isClean: boolean;
  staged: string[];
  modified: string[];
  untracked: string[];
}

export interface ConflictInfo {
  files: string[];
  hasConflicts: boolean;
}
