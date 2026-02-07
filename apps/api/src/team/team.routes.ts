import { Router } from 'express';
import { teamController } from './team.controller';
import { requireAuth, requireAdmin } from '../auth/auth.middleware';

const router = Router();

// All team management routes require admin access (except accept invitation)

// Team Members
router.get('/members', requireAuth, requireAdmin, teamController.getMembers.bind(teamController));
router.get('/members/:id', requireAuth, requireAdmin, teamController.getMember.bind(teamController));
router.put('/members/:id/role', requireAuth, requireAdmin, teamController.updateMemberRole.bind(teamController));
router.put('/members/:id/toggle-status', requireAuth, requireAdmin, teamController.toggleMemberStatus.bind(teamController));
router.delete('/members/:id', requireAuth, requireAdmin, teamController.deleteMember.bind(teamController));

// Invitations
router.get('/invitations', requireAuth, requireAdmin, teamController.getInvitations.bind(teamController));
router.post('/invitations', requireAuth, requireAdmin, teamController.createInvitation.bind(teamController));
router.delete('/invitations/:id', requireAuth, requireAdmin, teamController.revokeInvitation.bind(teamController));
router.post('/invitations/:id/resend', requireAuth, requireAdmin, teamController.resendInvitation.bind(teamController));

// Public route - accept invitation (no auth required)
router.post('/invitations/accept', teamController.acceptInvitation.bind(teamController));

export default router;
