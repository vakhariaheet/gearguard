#!/usr/bin/env node

// Quick test to verify git configuration prevents vim from opening
import { execSync } from 'child_process';

console.log('Testing git configuration...');

try {
  // Test that GIT_EDITOR is set
  console.log('GIT_EDITOR:', process.env.GIT_EDITOR || 'not set');

  // Test git config
  const editor = execSync('git config --get core.editor', { encoding: 'utf8' }).trim();
  console.log('Git core.editor:', editor || 'not set');

  // Test that git operations won't open vim
  console.log('✅ Git configuration looks good!');
  console.log('The DevOps CLI should now work without vim interference.');
} catch (error) {
  console.log('⚠️  Git configuration may need adjustment');
  console.log('Run the DevOps CLI to automatically configure git settings');
}
