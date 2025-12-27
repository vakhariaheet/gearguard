#!/usr/bin/env node

/**
 * Toggle Mock Data Mode
 *
 * Simple script to enable/disable mock data mode for development
 */

const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, '.env.local.example');

function toggleMockData() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'on' || command === 'enable') {
    // Enable mock data
    if (!fs.existsSync(envLocalPath)) {
      if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envLocalPath);
        console.log('✅ Mock data mode enabled! (.env.local created from example)');
        console.log('🎭 Restart your dev server to use mock data');
      } else {
        // Create basic .env.local
        const content = `# Local Development Environment Variables
VITE_USE_MOCK_DATA=true
VITE_CLERK_PUBLISHABLE_KEY=pk_test_a2Vlbi1ha2l0YS0xNy5jbGVyay5hY2NvdW50cy5kZXYk
`;
        fs.writeFileSync(envLocalPath, content);
        console.log('✅ Mock data mode enabled! (.env.local created)');
        console.log('🎭 Restart your dev server to use mock data');
      }
    } else {
      // Update existing .env.local
      let content = fs.readFileSync(envLocalPath, 'utf8');
      if (content.includes('VITE_USE_MOCK_DATA=')) {
        content = content.replace(/VITE_USE_MOCK_DATA=.*/g, 'VITE_USE_MOCK_DATA=true');
      } else {
        content += '\nVITE_USE_MOCK_DATA=true\n';
      }
      fs.writeFileSync(envLocalPath, content);
      console.log('✅ Mock data mode enabled! (.env.local updated)');
      console.log('🎭 Restart your dev server to use mock data');
    }
  } else if (command === 'off' || command === 'disable') {
    // Disable mock data
    if (fs.existsSync(envLocalPath)) {
      let content = fs.readFileSync(envLocalPath, 'utf8');
      content = content.replace(/VITE_USE_MOCK_DATA=.*/g, 'VITE_USE_MOCK_DATA=false');
      fs.writeFileSync(envLocalPath, content);
      console.log('❌ Mock data mode disabled! (.env.local updated)');
      console.log('🌐 Restart your dev server to use real API');
    } else {
      console.log('ℹ️  Mock data mode is already disabled (no .env.local file)');
    }
  } else if (command === 'status') {
    // Check status
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, 'utf8');
      const mockDataEnabled = content.includes('VITE_USE_MOCK_DATA=true');
      console.log(`📊 Mock data mode: ${mockDataEnabled ? '🎭 ENABLED' : '🌐 DISABLED'}`);
    } else {
      console.log('📊 Mock data mode: 🌐 DISABLED (no .env.local file)');
    }
  } else {
    // Show help
    console.log(`
🎭 Mock Data Toggle Script

Usage:
  node toggle-mock-data.js <command>

Commands:
  on, enable    Enable mock data mode
  off, disable  Disable mock data mode  
  status        Check current status
  help          Show this help

Examples:
  node toggle-mock-data.js on      # Enable mock data
  node toggle-mock-data.js off     # Disable mock data
  node toggle-mock-data.js status  # Check status

Note: You need to restart your dev server after toggling.
`);
  }
}

toggleMockData();
