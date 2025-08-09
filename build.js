#!/usr/bin/env node

/**
 * Robust build script for Azure Static Web Apps
 * Handles permission issues with astro binary in CI environments
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting IHARC website build...');

function runCommand(command, description) {
  try {
    console.log(`⚡ ${description}...`);
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

function fixPermissions() {
  try {
    const astroPath = path.join(__dirname, 'node_modules', '.bin', 'astro');
    if (fs.existsSync(astroPath)) {
      console.log('🔧 Attempting to fix astro binary permissions...');
      execSync(`chmod +x "${astroPath}"`, { stdio: 'inherit' });
      console.log('✅ Permissions fixed');
      return true;
    }
  } catch (error) {
    console.log('⚠️ Could not fix permissions (this is normal in some CI environments)');
    return false;
  }
  return false;
}

async function build() {
  // Strategy 1: Fix permissions and use npx
  console.log('\n📦 Build Strategy 1: Fix permissions + npx');
  fixPermissions();
  
  if (runCommand('npx astro check', 'Type checking')) {
    if (runCommand('npx astro build', 'Building with npx')) {
      return true;
    }
  }

  // Strategy 2: Use node directly
  console.log('\n📦 Build Strategy 2: Direct node execution');
  const astroCliPath = path.join(__dirname, 'node_modules', 'astro', 'dist', 'cli', 'index.js');
  
  if (fs.existsSync(astroCliPath)) {
    if (runCommand(`node "${astroCliPath}" check`, 'Type checking with node')) {
      if (runCommand(`node "${astroCliPath}" build`, 'Building with node')) {
        return true;
      }
    }
  }

  // Strategy 3: Try yarn if available
  console.log('\n📦 Build Strategy 3: Yarn fallback');
  try {
    execSync('yarn --version', { stdio: 'ignore' });
    if (runCommand('yarn astro check', 'Type checking with yarn')) {
      if (runCommand('yarn astro build', 'Building with yarn')) {
        return true;
      }
    }
  } catch (error) {
    console.log('⚠️ Yarn not available, skipping');
  }

  // If all strategies fail
  console.error('❌ All build strategies failed');
  process.exit(1);
}

// Check if dist directory exists after successful build
function verifyBuild() {
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');
  
  if (fs.existsSync(distPath) && fs.existsSync(indexPath)) {
    console.log('✅ Build verification passed - dist/index.html exists');
    console.log('🎉 IHARC website build completed successfully!');
    return true;
  } else {
    console.error('❌ Build verification failed - dist/index.html not found');
    process.exit(1);
  }
}

// Main execution
async function main() {
  try {
    await build();
    verifyBuild();
  } catch (error) {
    console.error('💥 Build failed with error:', error);
    process.exit(1);
  }
}

main();