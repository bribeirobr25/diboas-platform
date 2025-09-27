#!/usr/bin/env node

/**
 * Design Tokens Validation Script
 * 
 * Security & Audit Standards: JSON Schema validation for design tokens
 * Error Handling & System Recovery: Comprehensive validation with detailed reporting
 * Monitoring & Observability: Validation metrics and detailed error reporting
 * Domain-Driven Design: Validates design domain structure and constraints
 * Service Agnostic Abstraction: Platform-independent validation
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

/**
 * Load and validate design tokens against JSON schema
 * Security: Prevents malformed or malicious configuration
 * Error Handling: Detailed validation error reporting
 */
function validateDesignTokens() {
  const startTime = Date.now();
  console.log('🔍 Validating design tokens configuration...');
  
  try {
    // File paths
    const tokensPath = path.join(__dirname, '../config/design-tokens.json');
    const schemaPath = path.join(__dirname, '../config/design-tokens.schema.json');
    
    // Check if files exist
    if (!fs.existsSync(tokensPath)) {
      throw new Error(`Design tokens file not found: ${tokensPath}`);
    }
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }
    
    // Load files
    const tokensContent = fs.readFileSync(tokensPath, 'utf8');
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    
    // Parse JSON
    let tokens, schema;
    try {
      tokens = JSON.parse(tokensContent);
    } catch (error) {
      throw new Error(`Invalid JSON in design tokens: ${error.message}`);
    }
    
    try {
      schema = JSON.parse(schemaContent);
    } catch (error) {
      throw new Error(`Invalid JSON in schema: ${error.message}`);
    }
    
    // Initialize AJV validator
    const ajv = new Ajv({ 
      allErrors: true,
      verbose: true,
      strict: true
    });
    
    // Compile schema
    let validate;
    try {
      validate = ajv.compile(schema);
    } catch (error) {
      throw new Error(`Schema compilation failed: ${error.message}`);
    }
    
    // Validate tokens against schema
    const valid = validate(tokens);
    
    if (!valid) {
      console.error('❌ Design tokens validation failed:');
      console.error('');
      
      // Group errors by category for better readability
      const errorsByPath = {};
      validate.errors.forEach(error => {
        const path = error.instancePath || 'root';
        if (!errorsByPath[path]) {
          errorsByPath[path] = [];
        }
        errorsByPath[path].push(error);
      });
      
      // Display errors grouped by path
      Object.entries(errorsByPath).forEach(([path, errors]) => {
        console.error(`  📍 Path: ${path}`);
        errors.forEach(error => {
          console.error(`    • ${error.message}`);
          if (error.data !== undefined) {
            console.error(`      Current value: ${JSON.stringify(error.data)}`);
          }
          if (error.schema !== undefined) {
            console.error(`      Expected: ${JSON.stringify(error.schema)}`);
          }
        });
        console.error('');
      });
      
      throw new Error(`Validation failed with ${validate.errors.length} error(s)`);
    }
    
    // Validation successful
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('✅ Design tokens validation passed');
    console.log(`📊 Version: ${tokens.version}`);
    console.log(`⏱️  Validation completed in ${duration}ms`);
    console.log(`📈 Tokens validated: ${countTokens(tokens)}`);
    
    return {
      success: true,
      version: tokens.version,
      duration,
      tokenCount: countTokens(tokens)
    };
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    
    // Monitoring: Log error context
    console.error('🔍 Error context:', {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd()
    });
    
    process.exit(1);
  }
}

/**
 * Count total number of design tokens for metrics
 * Monitoring & Observability: Token metrics tracking
 */
function countTokens(tokens) {
  let count = 0;
  
  function countRecursive(obj) {
    if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach(item => countRecursive(item));
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          if (typeof value === 'object' && value !== null) {
            countRecursive(value);
          } else if (key !== 'version' && key !== 'lastUpdated' && key !== 'author' && key !== 'description') {
            count++;
          }
        });
      }
    }
  }
  
  countRecursive(tokens);
  return count;
}

/**
 * Validate semantic versioning format
 * Security: Ensures version follows expected format
 */
function validateSemanticVersion(version) {
  const semverRegex = /^\d+\.\d+\.\d+$/;
  return semverRegex.test(version);
}

/**
 * Additional validation checks beyond schema
 * Domain-Driven Design: Business rule validation
 */
function performAdditionalValidation(tokens) {
  const issues = [];
  
  // Check semantic versioning
  if (!validateSemanticVersion(tokens.version)) {
    issues.push(`Invalid semantic version format: ${tokens.version}`);
  }
  
  // Check z-index hierarchy (higher priority should have higher values)
  const zIndexValues = Object.values(tokens.zIndex).sort((a, b) => a - b);
  if (zIndexValues.some((value, index) => index > 0 && value <= zIndexValues[index - 1])) {
    issues.push('Z-index values should follow logical hierarchy');
  }
  
  // Check animation durations are in ascending order
  const durations = tokens.animation.duration;
  const fastMs = parseFloat(durations.fast) * 1000;
  const normalMs = parseFloat(durations.normal) * 1000;
  const slowMs = parseFloat(durations.slow) * 1000;
  
  if (fastMs >= normalMs || normalMs >= slowMs) {
    issues.push('Animation durations should be in ascending order (fast < normal < slow)');
  }
  
  // Check typography scales are logical
  const heroDesktop = tokens.typography.title.hero.desktop;
  const sectionDesktop = tokens.typography.title.section.desktop;
  
  if (heroDesktop <= sectionDesktop) {
    issues.push('Hero title should be larger than section title');
  }
  
  return issues;
}

// Run validation if called directly
if (require.main === module) {
  validateDesignTokens();
}

module.exports = {
  validateDesignTokens,
  countTokens,
  performAdditionalValidation
};