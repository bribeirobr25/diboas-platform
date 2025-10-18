/**
 * Environment Configuration
 * Configuration Management: Centralized environment variable management
 * Security Standards: Secure handling of environment variables with validation
 * Semantic Naming: Clear, purpose-driven variable names
 */

interface EnvironmentConfig {
  // Application URLs
  readonly APP_URL: string;
  readonly BUSINESS_URL: string;
  readonly LEARN_URL: string;
  readonly CDN_URL: string;
  readonly MONITORING_ENDPOINT: string;
  
  // Application Settings
  readonly NODE_ENV: 'development' | 'production' | 'test';
  readonly IS_DEVELOPMENT: boolean;
  readonly IS_PRODUCTION: boolean;
  
  // Feature Flags
  readonly ANALYTICS_ENABLED: boolean;
  readonly MONITORING_ENABLED: boolean;
  readonly DEBUG_MODE: boolean;
  
  // API Configuration
  readonly API_BASE_URL: string;
  readonly API_TIMEOUT: number;
  
  // Performance Settings
  readonly CACHE_TTL: number;
  readonly RETRY_ATTEMPTS: number;
}

/**
 * Validate and sanitize environment variable
 */
function getEnvVar(
  key: string, 
  defaultValue: string = '', 
  required: boolean = false
): string {
  const value = process.env[key];
  
  if (required && !value) {
    throw new Error(`Required environment variable ${key} is not set`);
  }
  
  return value || defaultValue;
}

/**
 * Parse boolean environment variable with fallback
 */
function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  
  if (!value) return defaultValue;
  
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse integer environment variable with validation
 */
function getEnvNumber(
  key: string, 
  defaultValue: number, 
  min?: number, 
  max?: number
): number {
  const value = process.env[key];
  
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    console.warn(`Invalid number for environment variable ${key}: ${value}`);
    return defaultValue;
  }
  
  if (min !== undefined && parsed < min) {
    console.warn(`Environment variable ${key} below minimum (${min}): ${parsed}`);
    return defaultValue;
  }
  
  if (max !== undefined && parsed > max) {
    console.warn(`Environment variable ${key} above maximum (${max}): ${parsed}`);
    return defaultValue;
  }
  
  return parsed;
}

/**
 * Get default URLs based on environment
 */
function getDefaultUrls(): { app: string; business: string; learn: string } {
  const nodeEnv = process.env.NODE_ENV || 'development';

  if (nodeEnv === 'production') {
    return {
      app: 'https://app.diboas.com',
      business: 'https://business.diboas.com',
      learn: 'https://learn.diboas.com'
    };
  }

  // Check for staging environment variable since NODE_ENV might not include it
  if (process.env.APP_ENV === 'staging') {
    return {
      app: 'https://app-staging.diboas.com',
      business: 'https://business-staging.diboas.com',
      learn: 'https://learn-staging.diboas.com'
    };
  }

  // Development defaults
  return {
    app: 'http://localhost:3001',
    business: 'http://localhost:3002',
    learn: 'http://localhost:3003'
  };
}

/**
 * Create and validate environment configuration
 */
function createEnvironmentConfig(): EnvironmentConfig {
  const nodeEnv = (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test';
  const defaultUrls = getDefaultUrls();
  
  const config: EnvironmentConfig = {
    // Application URLs
    APP_URL: getEnvVar('NEXT_PUBLIC_APP_URL', defaultUrls.app),
    BUSINESS_URL: getEnvVar('NEXT_PUBLIC_BUSINESS_URL', defaultUrls.business),
    LEARN_URL: getEnvVar('NEXT_PUBLIC_LEARN_URL', defaultUrls.learn),
    CDN_URL: getEnvVar('NEXT_PUBLIC_CDN_URL', ''),
    MONITORING_ENDPOINT: getEnvVar('NEXT_PUBLIC_MONITORING_ENDPOINT', ''),
    
    // Application Settings
    NODE_ENV: nodeEnv,
    IS_DEVELOPMENT: nodeEnv === 'development',
    IS_PRODUCTION: nodeEnv === 'production',
    
    // Feature Flags
    ANALYTICS_ENABLED: getEnvBoolean('NEXT_PUBLIC_ANALYTICS_ENABLED', nodeEnv === 'production'),
    MONITORING_ENABLED: getEnvBoolean('NEXT_PUBLIC_MONITORING_ENABLED', nodeEnv === 'production'),
    DEBUG_MODE: getEnvBoolean('NEXT_PUBLIC_DEBUG_MODE', nodeEnv === 'development'),
    
    // API Configuration
    API_BASE_URL: getEnvVar('NEXT_PUBLIC_API_BASE_URL', '/api'),
    API_TIMEOUT: getEnvNumber('NEXT_PUBLIC_API_TIMEOUT', 10000, 1000, 60000),
    
    // Performance Settings
    CACHE_TTL: getEnvNumber('CACHE_TTL', 300, 60, 3600), // 5 minutes default
    RETRY_ATTEMPTS: getEnvNumber('RETRY_ATTEMPTS', 3, 1, 10)
  };
  
  // Validate required production settings
  if (config.IS_PRODUCTION) {
    if (!process.env.NEXT_PUBLIC_APP_URL) {
      console.warn('Environment Warning: NEXT_PUBLIC_APP_URL should be set in production');
    }
    if (!process.env.NEXT_PUBLIC_BUSINESS_URL) {
      console.warn('Environment Warning: NEXT_PUBLIC_BUSINESS_URL should be set in production');
    }
  }
  
  return config;
}

// Create and export singleton configuration
export const ENV_CONFIG = createEnvironmentConfig();

// Export individual values for convenience
export const {
  APP_URL,
  BUSINESS_URL,
  LEARN_URL,
  CDN_URL,
  MONITORING_ENDPOINT,
  NODE_ENV,
  IS_DEVELOPMENT,
  IS_PRODUCTION,
  ANALYTICS_ENABLED,
  MONITORING_ENABLED,
  DEBUG_MODE,
  API_BASE_URL,
  API_TIMEOUT,
  CACHE_TTL,
  RETRY_ATTEMPTS
} = ENV_CONFIG;

// Export type for external usage
export type { EnvironmentConfig };