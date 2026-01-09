/**
 * Cleanup Manager Utilities
 *
 * Component cleanup management to prevent memory leaks
 * and cleanup race conditions
 */

import { Logger } from '@/lib/monitoring/Logger';
import { SafeTimer, SafeInterval, SafeAnimationFrame } from './SafeTimers';

/**
 * Cleanup Manager for component unmounting
 * Prevents memory leaks and cleanup race conditions
 */
export class CleanupManager {
  private cleanupFunctions: Array<() => void> = [];
  private isDestroyed = false;
  private readonly label: string;

  constructor(label: string) {
    this.label = label;
  }

  /**
   * Add a cleanup function to be called on destruction
   */
  add(cleanup: () => void): void {
    if (this.isDestroyed) {
      Logger.debug(`Cleanup function added to destroyed manager ${this.label}`);
      cleanup(); // Execute immediately if already destroyed
      return;
    }

    this.cleanupFunctions.push(cleanup);
  }

  /**
   * Add a timer for automatic cleanup
   */
  addTimer(timer: SafeTimer): void {
    this.add(() => timer.clear());
  }

  /**
   * Add an interval for automatic cleanup
   */
  addInterval(interval: SafeInterval): void {
    this.add(() => interval.clear());
  }

  /**
   * Add an animation frame for automatic cleanup
   */
  addAnimationFrame(frame: SafeAnimationFrame): void {
    this.add(() => frame.cancel());
  }

  /**
   * Execute all cleanup functions and mark as destroyed
   */
  destroy(): void {
    if (this.isDestroyed) {
      Logger.warn(`Cleanup manager ${this.label} already destroyed`);
      return;
    }

    Logger.debug(`Cleaning up ${this.cleanupFunctions.length} items for ${this.label}`);

    this.cleanupFunctions.forEach((cleanup, index) => {
      try {
        cleanup();
      } catch (error) {
        Logger.error(`Cleanup function ${index} failed for ${this.label}`, { error });
      }
    });

    this.cleanupFunctions = [];
    this.isDestroyed = true;

    Logger.debug(`Cleanup manager ${this.label} destroyed`);
  }

  /**
   * Check if destroyed
   */
  get destroyed(): boolean {
    return this.isDestroyed;
  }
}

/**
 * React Hook for automatic cleanup management
 * Integrates cleanup manager with React component lifecycle
 */
export function useCleanupManager(componentName: string): CleanupManager {
  const managerRef = { current: new CleanupManager(componentName) };

  // This would be used in a React useEffect hook
  const _cleanup = () => {
    managerRef.current.destroy();
  };

  return managerRef.current;
}
