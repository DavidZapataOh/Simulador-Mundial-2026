import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function for merging Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to Spanish locale
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('es-LA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Generate a short ID for simulations
 */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Get flag code from team object
 */
export function getTeamFlagCode(team: { flagCode: string } | null | undefined): string {
  return team?.flagCode || 'UN'; // UN = United Nations (placeholder) or generic
}
