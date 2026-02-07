import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleString();
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

export function formatResponseTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'UP':
      return 'text-green-600 bg-green-50';
    case 'DOWN':
      return 'text-red-600 bg-red-50';
    case 'DEGRADED':
      return 'text-yellow-600 bg-yellow-50';
    case 'PAUSED':
      return 'text-gray-600 bg-gray-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getIncidentStatusColor(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'text-red-600 bg-red-50';
    case 'ACKNOWLEDGED':
      return 'text-yellow-600 bg-yellow-50';
    case 'RESOLVED':
      return 'text-green-600 bg-green-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}
