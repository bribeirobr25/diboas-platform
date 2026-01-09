/**
 * Hook Utility Functions
 *
 * Shared utilities for section hooks
 */

const SESSION_KEY = 'diboas_session_id';

/**
 * Get or create session ID for analytics
 */
export function getSessionId(): string {
  if (typeof window === 'undefined') {
    return `server_${Date.now()}`;
  }

  let sessionId = sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

/**
 * Clear session ID (for testing)
 */
export function clearSessionId(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(SESSION_KEY);
  }
}
