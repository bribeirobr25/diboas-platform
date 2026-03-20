/**
 * Occurrence Tracker
 *
 * Tracks error occurrences by fingerprint for deduplication
 * and frequency analysis. Extracted from ErrorReportingService
 * for single-responsibility compliance.
 */

import type { ErrorOccurrence } from './errorTypes';

export class OccurrenceTracker {
  private reportedErrors = new Map<string, ErrorOccurrence>();

  /**
   * Get occurrence data for an error fingerprint.
   * Returns first/last seen timestamps and count.
   */
  getOccurrenceData(fingerprint: string): {
    firstSeen: number;
    lastSeen: number;
    occurrenceCount: number;
  } {
    const existing = this.reportedErrors.get(fingerprint);

    if (existing) {
      return {
        firstSeen: existing.firstSeen,
        lastSeen: Date.now(),
        occurrenceCount: existing.count + 1,
      };
    }

    return {
      firstSeen: Date.now(),
      lastSeen: Date.now(),
      occurrenceCount: 1,
    };
  }

  /**
   * Update occurrence tracking after an error is reported.
   */
  update(fingerprint: string): void {
    const existing = this.reportedErrors.get(fingerprint);

    if (existing) {
      existing.count += 1;
      existing.lastSeen = Date.now();
    } else {
      this.reportedErrors.set(fingerprint, {
        count: 1,
        firstSeen: Date.now(),
        lastSeen: Date.now(),
      });
    }
  }

  /**
   * Get total error count across all fingerprints.
   */
  getTotalCount(): number {
    return Array.from(this.reportedErrors.values()).reduce(
      (sum, data) => sum + data.count,
      0
    );
  }

  /**
   * Get count of unique error fingerprints.
   */
  getUniqueCount(): number {
    return this.reportedErrors.size;
  }

  /**
   * Clear all tracked occurrences.
   */
  clear(): void {
    this.reportedErrors.clear();
  }
}
