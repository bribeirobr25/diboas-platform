/**
 * Race Condition Prevention Utilities
 *
 * Concurrency & Race Condition Prevention: Comprehensive race condition prevention
 * Error Handling & System Recovery: Safe async operation handling
 * Performance & SEO Optimization: Efficient timer and animation management
 * Monitoring & Observability: Race condition tracking and debugging
 * Domain-Driven Design: Carousel domain-specific race prevention
 *
 * This file re-exports all utilities from the modular race-condition directory
 * for backwards compatibility.
 */

// Re-export all utilities from modular structure
export {
  // Timer utilities
  SafeTimer,
  SafeInterval,
  SafeAnimationFrame,

  // Function wrappers
  DebouncedFunction,
  ThrottledFunction,

  // Concurrency control
  MutexLock,
  StateMachine,

  // Cleanup management
  CleanupManager,
  useCleanupManager
} from './race-condition';
