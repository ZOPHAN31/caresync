import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import {
  requireAuth,
  requireCareTeamMember,
  requireTeamAdmin,
  AuthRequest,
} from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { UserRole } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

const createInviteSchema = z.object({
  params: z.object({ teamId: z.string().uuid() }),
  body: z.object({
    email: z.string().email(),
    role: z.nativeEnum(UserRole),
  }),
});

const acceptInviteSchema = z.object({
  params: z.object({ token: z.string() }),
});

// POST /api/v1/teams/:teamId/invites — create an invite
router.post(
  '/teams/:teamId/invites',
  requireAuth,
  requireCareTeamMember('teamId'),
  requireTeamAdmin,
  validate(createInviteSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { teamId } = req.params;
    const { email, role } = req.body;

    // Check if user is already a member
    const existingUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingUser) {
      const existingMember = await prisma.careTeamMember.findUnique({
        where: { careTeamId_userId: { careTeamId: teamId, userId: existingUser.id } },
      });
      if (existingMember)
        throw ApiError.conflict(
          'This person is already a member of the care team',
          'ALREADY_MEMBER'
        );
    }

    // Expire any existing pending invites for this email + team
    await prisma.teamInvite.updateMany({
      where: { careTeamId: teamId, email: email.toLowerCase(), acceptedAt: null },
      data: { expiresAt: new Date() },
    });

    const token = uuidv4();
    const invite = await prisma.teamInvite.create({
      data: {
        careTeamId: teamId,
        email: email.toLowerCase(),
        role,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
      include: { careTeam: true },
    });

    // Development: log invite link
    console.log(`[DEV] Invite link: ${process.env.NEXTAUTH_URL}/invite/${token}`);

    res.status(201).json({
      success: true,
      data: { invite, inviteUrl: `${process.env.NEXTAUTH_URL}/invite/${token}` },
    });
  })
);

// GET /api/v1/invites/:token — get invite details (for accept page)
router.get(
  '/invites/:token',
  validate(acceptInviteSchema),
  asyncHandler(async (req, res) => {
    const invite = await prisma.teamInvite.findUnique({
      where: { token: req.params.token },
      include: { careTeam: true },
    });

    if (!invite || invite.expiresAt < new Date())
      throw ApiError.notFound('This invite link is invalid or has expired', 'INVALID_INVITE');
    if (invite.acceptedAt)
      throw ApiError.conflict('This invite has already been accepted', 'INVITE_USED');

    res.json({
      success: true,
      data: {
        email: invite.email,
        role: invite.role,
        careTeamName: invite.careTeam.name,
        expiresAt: invite.expiresAt,
      },
    });
  })
);

// POST /api/v1/invites/:token/accept — accept an invite
router.post(
  '/invites/:token/accept',
  requireAuth,
  validate(acceptInviteSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const invite = await prisma.teamInvite.findUnique({
      where: { token: req.params.token },
      include: { careTeam: true },
    });

    if (!invite || invite.expiresAt < new Date())
      throw ApiError.notFound('Invalid or expired invite', 'INVALID_INVITE');
    if (invite.acceptedAt) throw ApiError.conflict('Invite already accepted', 'INVITE_USED');
    if (invite.email !== req.user!.email)
      throw ApiError.forbidden(
        'This invite was sent to a different email address',
        'EMAIL_MISMATCH'
      );

    // Add to care team
    await prisma.careTeamMember.create({
      data: { careTeamId: invite.careTeamId, userId: req.user!.id, role: invite.role },
    });

    await prisma.teamInvite.update({
      where: { token: req.params.token },
      data: { acceptedAt: new Date() },
    });

    res.json({
      success: true,
      data: { message: `You have joined ${invite.careTeam.name}`, careTeamId: invite.careTeamId },
    });
  })
);

export default router;
