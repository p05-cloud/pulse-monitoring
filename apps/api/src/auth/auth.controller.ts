import { Request, Response, NextFunction } from 'express';
import { authService, LoginSchema } from './auth.service';
import { prisma } from '../config/database';
import { UnauthorizedError } from '../utils/errors';
import { sanitizeUser } from '../utils/helpers';

export class AuthController {
  /**
   * Login user
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      // Validate input
      const { email, password } = LoginSchema.parse(req.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await authService.comparePassword(
        password,
        user.passwordHash
      );

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      // Generate tokens
      const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const token = authService.generateToken(payload);
      const refreshToken = authService.generateRefreshToken(payload);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          entityType: 'User',
          entityId: user.id,
          ipAddress: req.ip,
        },
      });

      res.json({
        success: true,
        data: {
          user: sanitizeUser(user),
          token,
          refreshToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user (client-side token deletion)
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // Log activity if user is authenticated
      if (req.user) {
        await prisma.activityLog.create({
          data: {
            userId: req.user.userId,
            action: 'USER_LOGOUT',
            entityType: 'User',
            entityId: req.user.userId,
            ipAddress: req.ip,
          },
        });
      }

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/v1/auth/refresh
   */
  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token required');
      }

      // Verify refresh token
      const payload = authService.verifyRefreshToken(refreshToken);

      // Generate new access token
      const newToken = authService.generateToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      });

      res.json({
        success: true,
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });

      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      res.json({
        success: true,
        data: sanitizeUser(user),
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
