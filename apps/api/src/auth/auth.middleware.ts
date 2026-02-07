import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';

/**
 * Middleware to require authentication
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = authService.verifyToken(token);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Attach user to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  if (req.user.role !== UserRole.ADMIN) {
    return next(new ForbiddenError());
  }

  next();
}

/**
 * Middleware to require developer or higher role (ADMIN or DEVELOPER)
 * USER role is treated as DEVELOPER for backward compatibility
 */
export function requireDeveloper(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  const allowedRoles: string[] = ['ADMIN', 'DEVELOPER', 'USER'];
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ForbiddenError('Developer access required'));
  }

  next();
}
