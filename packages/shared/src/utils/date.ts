/**
 * Format duration in seconds to human-readable format
 * @param seconds Duration in seconds
 * @returns Formatted string (e.g., "5m 32s", "2h 15m")
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Calculate duration between two dates in seconds
 * @param start Start date
 * @param end End date
 * @returns Duration in seconds
 */
export function calculateDuration(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / 1000);
}

/**
 * Format date to ISO string
 * @param date Date to format
 * @returns ISO string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parse ISO string to Date
 * @param isoString ISO string
 * @returns Date object
 */
export function fromISOString(isoString: string): Date {
  return new Date(isoString);
}

/**
 * Get current timestamp
 * @returns Current date
 */
export function now(): Date {
  return new Date();
}
