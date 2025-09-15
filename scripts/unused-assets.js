#!/usr/bin/env node

/**
 * Unused Assets Analyzer
 * Finds assets that exist but are never imported/referenced in the codebase
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ASSETS_DIR = './apps/web/public/assets';
const SRC_DIR = './apps/web/src';
const EXTENSIONS = ['.tsx', '.ts', '.js', '.jsx', '.css', '.scss'];

// Get all asset files
function getAllAssets(dir, baseDir = dir) {
  const assets = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      assets.push(...getAllAssets(fullPath, baseDir));
    } else {
      // Convert to web path
      const webPath = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/');
      assets.push({
        file: item,
        path: webPath,
        fullPath: fullPath,
        size: stats.size
      });
    }
  }
  
  return assets;
}

// Get all source files content
function getAllSourceContent(dir) {
  let content = '';
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      content += getAllSourceContent(fullPath);
    } else if (EXTENSIONS.some(ext => item.endsWith(ext))) {
      try {
        content += fs.readFileSync(fullPath, 'utf8') + '\n';
      } catch (err) {
        console.warn(`Warning: Could not read ${fullPath}`);
      }
    }
  }
  
  return content;
}

// Main analysis
function analyzeAssets() {
  console.log('🔍 Analyzing asset usage...\n');
  
  const assets = getAllAssets(ASSETS_DIR);
  const sourceContent = getAllSourceContent(SRC_DIR);
  
  const unused = [];
  const used = [];
  const missing = [];
  
  // Check each asset
  for (const asset of assets) {
    const isReferenced = sourceContent.includes(asset.path) || 
                        sourceContent.includes(asset.file) ||
                        sourceContent.includes(asset.path.replace('/assets/', ''));
    
    if (isReferenced) {
      used.push(asset);
    } else {
      unused.push(asset);
    }
  }
  
  // Find missing references
  const assetReferences = sourceContent.match(/['"`]\/assets\/[^'"`]+['"`]/g) || [];
  for (const ref of assetReferences) {
    const cleanRef = ref.slice(1, -1); // Remove quotes
    const found = assets.some(asset => asset.path === cleanRef);
    if (!found) {
      missing.push(cleanRef);
    }
  }
  
  // Report results
  console.log(`📊 Analysis Results:`);
  console.log(`   Total assets: ${assets.length}`);
  console.log(`   ✅ Used: ${used.length}`);
  console.log(`   ❌ Unused: ${unused.length}`);
  console.log(`   ⚠️  Missing: ${missing.length}`);
  
  // Show unused assets
  if (unused.length > 0) {
    console.log('\n🗑️  UNUSED ASSETS:');
    
    // Group by directory
    const byDir = {};
    for (const asset of unused) {
      const dir = path.dirname(asset.path);
      if (!byDir[dir]) byDir[dir] = [];
      byDir[dir].push(asset);
    }
    
    for (const [dir, assets] of Object.entries(byDir)) {
      const totalSize = assets.reduce((sum, a) => sum + a.size, 0);
      const sizeStr = (totalSize / 1024 / 1024).toFixed(2);
      console.log(`   ${dir}/ (${assets.length} files, ${sizeStr}MB)`);
      
      if (assets.length <= 10) {
        assets.forEach(a => console.log(`     - ${a.file}`));
      } else {
        assets.slice(0, 5).forEach(a => console.log(`     - ${a.file}`));
        console.log(`     ... and ${assets.length - 5} more`);
      }
    }
  }
  
  // Show missing assets
  if (missing.length > 0) {
    console.log('\n⚠️  MISSING ASSETS:');
    missing.forEach(ref => console.log(`   - ${ref}`));
  }
  
  // Show used assets
  console.log('\n✅ USED ASSETS:');
  used.forEach(asset => console.log(`   - ${asset.path}`));
  
  // Cleanup suggestions
  console.log('\n💡 CLEANUP SUGGESTIONS:');
  
  const inspirationAssets = unused.filter(a => a.path.includes('/inspiration/'));
  if (inspirationAssets.length > 0) {
    const size = (inspirationAssets.reduce((s, a) => s + a.size, 0) / 1024 / 1024).toFixed(2);
    console.log(`   🎨 Remove /inspiration/ folder: ${inspirationAssets.length} files, ${size}MB`);
  }
  
  const socialAssets = unused.filter(a => a.path.includes('/socials/'));
  if (socialAssets.length > 0) {
    const size = (socialAssets.reduce((s, a) => s + a.size, 0) / 1024 / 1024).toFixed(2);
    console.log(`   📱 Clean up /socials/ folder: ${socialAssets.length} unused files, ${size}MB`);
  }
}

// Run analysis
analyzeAssets();