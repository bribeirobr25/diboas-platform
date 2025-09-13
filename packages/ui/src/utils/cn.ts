import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging CSS classes with Tailwind CSS conflict resolution
 * 
 * DRY Principle: Single source of truth for class name merging
 * Performance: Optimized class name concatenation
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}