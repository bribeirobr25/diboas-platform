/**
 * Monitoring Module Exports
 * File Decoupling: Clean module interface
 * Performance: Specific exports for better tree-shaking
 */

// Type exports - only export what's actually used
export type { 
  ErrorEvent, 
  PerformanceIssue, 
  SecurityEvent, 
  MonitoringConfig,
  MonitoringService 
} from './types';

// Constant exports - only export what's needed
export { MONITORING_DEFAULTS } from './constants';

// Service export
export { monitoringService } from './service';