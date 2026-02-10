import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Parse pagination parameters from request query
 */
export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const MAX_LIMIT = 200;
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

/**
 * Build paginated response
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Parse filter parameters from request query
 */
export function parseFilters(query: any): Record<string, any> {
  const filters: Record<string, any> = {};

  // Remove pagination params
  const { page: _page, limit: _limit, ...rest } = query;

  // Handle array filters (e.g., tags)
  Object.keys(rest).forEach((key) => {
    const value = rest[key];
    if (typeof value === 'string' && value.includes(',')) {
      filters[key] = value.split(',').map((v: string) => v.trim());
    } else {
      filters[key] = value;
    }
  });

  return filters;
}

/**
 * Sanitize user object (remove password hash)
 */
export function sanitizeUser(user: any) {
  const { passwordHash: _passwordHash, ...sanitized } = user;
  return sanitized;
}
