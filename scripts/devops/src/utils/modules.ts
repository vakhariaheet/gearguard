import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import type { ModuleInfo } from '../types/index.js';

export class ModuleManager {
  private modulesPath: string;
  private docsPath: string;

  constructor(modulesPath: string) {
    this.modulesPath = modulesPath;
    // Derive docs path from git root (parent of backend)
    const gitRoot = modulesPath.split('/backend')[0];
    this.docsPath = join(gitRoot, 'docs');
  }

  getExistingModules(): ModuleInfo[] {
    // First get modules from docs directory
    const docModules = this.getModulesFromDocs();

    // Then get actual implemented modules from backend
    const backendModules = this.getImplementedModules();

    // Merge them, prioritizing doc modules but adding implementation status
    const moduleMap = new Map<string, ModuleInfo>();

    // Add doc modules first
    docModules.forEach((module) => {
      moduleMap.set(module.name, module);
    });

    // Update with backend implementation info
    backendModules.forEach((backendModule) => {
      const existing = moduleMap.get(backendModule.name);
      if (existing) {
        // Update with actual functions from backend
        existing.functions = backendModule.functions;
        existing.path = backendModule.path;
      } else {
        // Add backend-only modules (not documented in docs)
        moduleMap.set(backendModule.name, {
          ...backendModule,
          name: `${backendModule.name} (undocumented)`,
        });
      }
    });

    return Array.from(moduleMap.values());
  }

  private getModulesFromDocs(): ModuleInfo[] {
    if (!existsSync(this.docsPath)) {
      return [];
    }

    return readdirSync(this.docsPath)
      .filter((file) => file.startsWith('module-') && file.endsWith('.md'))
      .map((file) => {
        const filePath = join(this.docsPath, file);
        const content = readFileSync(filePath, 'utf-8');

        // Extract module name from filename (e.g., module-F01-proposal-management.md -> F01-proposal-management)
        const moduleId = file.replace('module-', '').replace('.md', '');

        // Try to extract a better name from the markdown content
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const displayName = titleMatch ? titleMatch[1] : moduleId;

        // Extract estimated time if available
        const timeMatch = content.match(/\*\*Estimated Time:\*\*\s*(.+)/);
        const estimatedTime = timeMatch ? timeMatch[1] : 'Unknown';

        // Check if module is implemented in backend
        const backendPath = join(this.modulesPath, moduleId);
        const isImplemented = existsSync(backendPath);
        const functions = isImplemented ? this.getModuleFunctions(backendPath) : [];

        return {
          name: `${displayName} (${estimatedTime})${isImplemented ? ' ✅' : ' 📝'}`,
          path: isImplemented ? backendPath : filePath,
          functions,
        };
      });
  }

  private getImplementedModules(): ModuleInfo[] {
    if (!existsSync(this.modulesPath)) {
      return [];
    }

    return readdirSync(this.modulesPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => {
        const moduleName = dirent.name;
        const modulePath = join(this.modulesPath, moduleName);
        const functions = this.getModuleFunctions(modulePath);

        return {
          name: moduleName,
          path: modulePath,
          functions,
        };
      });
  }

  private getModuleFunctions(modulePath: string): string[] {
    const functionsPath = join(modulePath, 'functions');
    if (!existsSync(functionsPath)) {
      return [];
    }

    return readdirSync(functionsPath)
      .filter((file) => file.endsWith('.yml'))
      .map((file) => file.replace('.yml', ''));
  }

  getAllFunctions(): string[] {
    const modules = this.getExistingModules();
    const functions: string[] = [];

    modules.forEach((module) => {
      functions.push(...module.functions);
    });

    return functions;
  }

  validateModuleName(name: string): boolean {
    return /^[a-z][a-z0-9-]*$/.test(name);
  }

  moduleExists(name: string): boolean {
    return existsSync(join(this.modulesPath, name));
  }

  // Extract module ID from display name for branch naming
  getModuleId(displayName: string): string {
    // If it's a doc module, extract the ID from the display name
    const docModuleMatch = displayName.match(/^(.+?)\s+\(/);
    if (docModuleMatch) {
      // Try to find the corresponding file
      const docFiles = readdirSync(this.docsPath).filter(
        (file) => file.startsWith('module-') && file.endsWith('.md')
      );

      for (const file of docFiles) {
        const content = readFileSync(join(this.docsPath, file), 'utf-8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch && titleMatch[1] === docModuleMatch[1]) {
          return file.replace('module-', '').replace('.md', '');
        }
      }
    }

    // Fallback to cleaning the display name
    return displayName
      .replace(/\s+\(.+\).*$/, '') // Remove everything from first parenthesis
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Get module documentation path
  getModuleDocPath(moduleId: string): string | null {
    const docFile = join(this.docsPath, `module-${moduleId}.md`);
    return existsSync(docFile) ? docFile : null;
  }
}
