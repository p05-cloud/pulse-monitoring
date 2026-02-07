import { Request, Response, NextFunction } from 'express';
import { teamService } from './team.service';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const InviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'DEVELOPER', 'VIEWER']).default('VIEWER'),
});

const UpdateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'DEVELOPER', 'VIEWER']),
});

const AcceptInvitationSchema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export class TeamController {
  // GET /api/v1/team/members
  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const members = await teamService.getMembers();
      res.json({ success: true, data: members });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/team/members/:id
  async getMember(req: Request, res: Response, next: NextFunction) {
    try {
      const member = await teamService.getMemberById(req.params.id);
      if (!member) {
        return res.status(404).json({ success: false, error: 'Member not found' });
      }
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/team/members/:id/role
  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = UpdateRoleSchema.parse(req.body);

      // Prevent changing own role
      if (req.params.id === (req as any).user?.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot change your own role'
        });
      }

      const member = await teamService.updateMemberRole(
        req.params.id,
        validated.role as UserRole
      );
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/team/members/:id/toggle-status
  async toggleMemberStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.body;

      // Prevent deactivating self
      if (req.params.id === (req as any).user?.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot deactivate yourself'
        });
      }

      const member = await teamService.toggleMemberStatus(req.params.id, isActive);
      res.json({ success: true, data: member });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/team/members/:id
  async deleteMember(req: Request, res: Response, next: NextFunction) {
    try {
      // Prevent deleting self
      if (req.params.id === (req as any).user?.id) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete yourself'
        });
      }

      await teamService.deleteMember(req.params.id);
      res.json({ success: true, message: 'Member deleted' });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/team/invitations
  async getInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const invitations = await teamService.getPendingInvitations();
      res.json({ success: true, data: invitations });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/team/invitations
  async createInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = InviteSchema.parse(req.body);
      const invitation = await teamService.createInvitation(
        validated.email,
        validated.role as UserRole,
        (req as any).user.id
      );
      res.status(201).json({ success: true, data: invitation });
    } catch (error: any) {
      if (error.message?.includes('already')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  // POST /api/v1/team/invitations/accept (public route)
  async acceptInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = AcceptInvitationSchema.parse(req.body);
      const user = await teamService.acceptInvitation(
        validated.token,
        validated.name,
        validated.password
      );
      res.json({
        success: true,
        message: 'Invitation accepted. You can now log in.',
        data: { email: user.email }
      });
    } catch (error: any) {
      if (error.message?.includes('Invalid') ||
          error.message?.includes('expired') ||
          error.message?.includes('already')) {
        return res.status(400).json({ success: false, error: error.message });
      }
      next(error);
    }
  }

  // DELETE /api/v1/team/invitations/:id
  async revokeInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      await teamService.revokeInvitation(req.params.id);
      res.json({ success: true, message: 'Invitation revoked' });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/team/invitations/:id/resend
  async resendInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const invitation = await teamService.resendInvitation(req.params.id);
      res.json({ success: true, data: invitation });
    } catch (error) {
      next(error);
    }
  }
}

export const teamController = new TeamController();
