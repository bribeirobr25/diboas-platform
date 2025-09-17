/**
 * Ratings Configuration
 * Configuration Management: Centralized platform ratings
 * Business Metrics: Dynamic ratings that can be updated via environment variables
 * Single Source of Truth: All ratings in one configurable location
 */

import { GROWTH_METRICS } from './business-metrics';

interface PlatformRating {
  readonly score: string;
  readonly maxScore: string;
  readonly platform: string;
  readonly displayText: string;
}

/**
 * Get rating from environment or use default
 */
function getRating(envKey: string, defaultValue: string): string {
  return process.env[envKey] || defaultValue;
}

/**
 * Platform ratings configuration
 * These can be overridden via environment variables
 */
export const PLATFORM_RATINGS: Record<string, PlatformRating> = {
  APP_STORE: {
    score: getRating('NEXT_PUBLIC_RATING_APP_STORE', '4.8'),
    maxScore: '5',
    platform: 'App Store',
    get displayText() {
      return `${this.score}/${this.maxScore} stars on ${this.platform}`;
    }
  },
  GOOGLE_PLAY: {
    score: getRating('NEXT_PUBLIC_RATING_GOOGLE_PLAY', '4.7'),
    maxScore: '5',
    platform: 'Google Play',
    get displayText() {
      return `${this.score}/${this.maxScore} stars on ${this.platform}`;
    }
  },
  TRUSTPILOT: {
    score: getRating('NEXT_PUBLIC_RATING_TRUSTPILOT', '4.6'),
    maxScore: '5',
    platform: 'Trustpilot',
    get displayText() {
      return `${this.score}/${this.maxScore} stars on ${this.platform}`;
    }
  }
} as const;

/**
 * Get overall customer satisfaction from business metrics
 */
export function getCustomerSatisfactionScore(): string {
  return GROWTH_METRICS.customerSatisfaction.value;
}

/**
 * Helper to format rating for display
 */
export function formatRating(score: string | number, maxScore: string | number = 5): string {
  return `${score}/${maxScore}`;
}

/**
 * Helper to get star rating percentage (for visual display)
 */
export function getRatingPercentage(score: string | number, maxScore: string | number = 5): number {
  const numScore = typeof score === 'string' ? parseFloat(score) : score;
  const numMaxScore = typeof maxScore === 'string' ? parseFloat(maxScore) : maxScore;
  
  if (isNaN(numScore) || isNaN(numMaxScore) || numMaxScore === 0) {
    return 0;
  }
  
  return Math.round((numScore / numMaxScore) * 100);
}

/**
 * Export all ratings as array for iteration
 */
export const ALL_RATINGS = Object.values(PLATFORM_RATINGS);

// Export type for external usage
export type { PlatformRating };