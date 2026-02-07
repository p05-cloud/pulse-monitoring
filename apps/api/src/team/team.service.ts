import { prisma } from '../config/database';
import { UserRole } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class TeamService {
  // Get all team members
  async getMembers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Get single member by ID
  async getMemberById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        twoFactorEnabled: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
  }

  // Update member role
  async updateMemberRole(id: string, role: UserRole) {
    return prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  // Deactivate/activate member
  async toggleMemberStatus(id: string, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive },
    });
  }

  // Delete member
  async deleteMember(id: string) {
    return prisma.user.delete({
      where: { id },
    });
  }

  // Get all pending invitations
  async getPendingInvitations() {
    return prisma.teamInvitation.findMany({
      where: {
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Create invitation
  async createInvitation(email: string, role: UserRole, invitedById: string) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.teamInvitation.findFirst({
      where: {
        email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingInvite) {
      throw new Error('Invitation already pending for this email');
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');

    // Invitation expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.teamInvitation.create({
      data: {
        email,
        role,
        token,
        invitedById,
        expiresAt,
      },
      include: {
        invitedBy: {
          select: { name: true, email: true },
        },
      },
    });
  }

  // Accept invitation
  async acceptInvitation(token: string, name: string, password: string) {
    const invitation = await prisma.teamInvitation.findUnique({
      where: { token },
    });

    if (!invitation) {
      throw new Error('Invalid invitation token');
    }

    if (invitation.acceptedAt) {
      throw new Error('Invitation has already been accepted');
    }

    if (invitation.expiresAt < new Date()) {
      throw new Error('Invitation has expired');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and mark invitation as accepted in a transaction
    const [user] = await prisma.$transaction([
      prisma.user.create({
        data: {
          email: invitation.email,
          name,
          passwordHash,
          role: invitation.role,
        },
      }),
      prisma.teamInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      }),
    ]);

    return user;
  }

  // Revoke/delete invitation
  async revokeInvitation(id: string) {
    return prisma.teamInvitation.delete({
      where: { id },
    });
  }

  // Resend invitation (extends expiry)
  async resendInvitation(id: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return prisma.teamInvitation.update({
      where: { id },
      data: {
        expiresAt,
        token: crypto.randomBytes(32).toString('hex'),
      },
    });
  }
}

export const teamService = new TeamService();
