/**
 * Error Inference Utilities
 *
 * Functions for classifying and analyzing errors
 */

import {
  ErrorSeverity,
  ErrorCategory,
  type ErrorContext,
  type ErrorReportingConfig,
} from './errorTypes';
import { SENSITIVE_KEYS } from './errorConfig';

/**
 * Map string severity to enum
 */
export function mapSeverity(severity: string): ErrorSeverity {
  switch (severity) {
    case 'critical': return ErrorSeverity.CRITICAL;
    case 'high': return ErrorSeverity.HIGH;
    case 'medium': return ErrorSeverity.MEDIUM;
    case 'low': return ErrorSeverity.LOW;
    default: return ErrorSeverity.MEDIUM;
  }
}

/**
 * Infer error severity from error type
 */
export function inferSeverity(error: Error): ErrorSeverity {
  if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
    return ErrorSeverity.CRITICAL;
  }

  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return ErrorSeverity.HIGH;
  }

  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return ErrorSeverity.MEDIUM;
  }

  return ErrorSeverity.LOW;
}

/**
 * Infer error category from error type
 */
export function inferCategory(error: Error): ErrorCategory {
  if (error.name === 'ChunkLoadError' || error.message.includes('Loading chunk')) {
    return ErrorCategory.NETWORK;
  }

  if (error.name === 'TypeError' || error.name === 'ReferenceError') {
    return ErrorCategory.JAVASCRIPT;
  }

  if (error.message.includes('render') || error.message.includes('React')) {
    return ErrorCategory.RENDERING;
  }

  return ErrorCategory.UNKNOWN;
}

/**
 * Infer if error is recoverable
 */
export function inferRecoverability(error: Error): boolean {
  // Syntax errors are typically not recoverable
  if (error.name === 'SyntaxError') return false;

  // Network errors might be recoverable
  if (error.message.includes('fetch') || error.message.includes('network')) return true;

  // Most other errors are potentially recoverable
  return true;
}

/**
 * Generate error fingerprint for deduplication
 */
export function generateFingerprint(error: Error, context?: Partial<ErrorContext>): string {
  const components = [
    error.name,
    error.message,
    context?.sectionId,
    context?.sectionType
  ].filter(Boolean);

  return btoa(components.join('|')).replace(/[^a-zA-Z0-9]/g, '').substr(0, 16);
}

/**
 * Sanitize context to remove sensitive information
 */
export function sanitizeContext(context: ErrorContext): ErrorContext {
  const sanitized = { ...context };

  // Remove sensitive keys from custom data
  if (sanitized.customData) {
    Object.keys(sanitized.customData).forEach(key => {
      if (SENSITIVE_KEYS.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized.customData![key] = '[REDACTED]';
      }
    });
  }

  return sanitized;
}

/**
 * Build tags array from context
 */
export function buildTags(
  customTags: string[] = [],
  context: ErrorContext,
  config: ErrorReportingConfig
): string[] {
  const tags = [...customTags];

  if (context.sectionType) tags.push(`section:${context.sectionType}`);
  if (context.sectionId) tags.push(`section-id:${context.sectionId}`);
  tags.push(`environment:${config.environment}`);

  return tags;
}

/**
 * Generate unique error ID
 */
export function generateErrorId(): string {
  return `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate unique session ID
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
