import { z } from 'zod';
import { prisma } from '../config/database';
import { authService } from '../auth/auth.service';
import { NotFoundError, ConflictError } from '../utils/errors';
import { UserRole } from '@prisma/client';

// Validation schemas
export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  name: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

export class UserService {
  /**
   * Get all users with pagination
   */
  async findAll(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.user.count(),
    ]);

    return { users, total };
  }

  /**
   * Get user by ID
   */
  async findById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', id);
    }

    return user;
  }

  /**
   * Create new user
   */
  async create(data: z.infer<typeof CreateUserSchema>) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('Email already in use');
    }

    // Hash password
    const passwordHash = await authService.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role || UserRole.USER,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Update user
   */
  async update(id: string, data: z.infer<typeof UpdateUserSchema>) {
    // Check if user exists
    await this.findById(id);

    // If email is being updated, check if it's already in use
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictError('Email already in use');
      }
    }

    // Hash password if provided
    let passwordHash: string | undefined;
    if (data.password) {
      passwordHash = await authService.hashPassword(data.password);
    }

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Delete user
   */
  async delete(id: string) {
    // Check if user exists
    await this.findById(id);

    // Delete user (this will cascade delete related records)
    await prisma.user.delete({
      where: { id },
    });

    return { success: true };
  }
}

export const userService = new UserService();
