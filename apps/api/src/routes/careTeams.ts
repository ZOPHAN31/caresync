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

const router = Router();

// GET /api/v1/teams — list all care teams for current user
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const memberships = await prisma.careTeamMember.findMany({
      where: { userId: req.user!.id },
      include: {
        careTeam: {
          include: {
            recipient: {
              select: { id: true, firstName: true, lastName: true, status: true, avatarUrl: true },
            },
            members: {
              include: {
                user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
              },
            },
            subscription: true,
          },
        },
      },
    });
    res.json({ success: true, data: memberships });
  })
);

// GET /api/v1/teams/:teamId — get a specific care team
router.get(
  '/:teamId',
  requireAuth,
  requireCareTeamMember(),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const team = await prisma.careTeam.findUnique({
      where: { id: req.params.teamId },
      include: {
        recipient: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                email: true,
                phone: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        subscription: true,
        invites: { where: { acceptedAt: null, expiresAt: { gt: new Date() } } },
      },
    });
    res.json({ success: true, data: team });
  })
);

// PATCH /api/v1/teams/:teamId — update care team name/description
router.patch(
  '/:teamId',
  requireAuth,
  requireCareTeamMember(),
  requireTeamAdmin,
  validate(
    z.object({
      params: z.object({ teamId: z.string().uuid() }),
      body: z.object({
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const team = await prisma.careTeam.update({ where: { id: req.params.teamId }, data: req.body });
    res.json({ success: true, data: team });
  })
);

// PATCH /api/v1/teams/:teamId/members/:userId — update a member's role
router.patch(
  '/:teamId/members/:userId',
  requireAuth,
  requireCareTeamMember(),
  requireTeamAdmin,
  validate(
    z.object({
      params: z.object({ teamId: z.string().uuid(), userId: z.string().uuid() }),
      body: z.object({ role: z.nativeEnum(UserRole).optional(), isAdmin: z.boolean().optional() }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.params.userId === req.user!.id)
      throw ApiError.badRequest('You cannot change your own role', 'CANNOT_CHANGE_OWN_ROLE');
    const updated = await prisma.careTeamMember.update({
      where: { careTeamId_userId: { careTeamId: req.params.teamId, userId: req.params.userId } },
      data: req.body,
    });
    res.json({ success: true, data: updated });
  })
);

// DELETE /api/v1/teams/:teamId/members/:userId — remove a member
router.delete(
  '/:teamId/members/:userId',
  requireAuth,
  requireCareTeamMember(),
  requireTeamAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (req.params.userId === req.user!.id)
      throw ApiError.badRequest('You cannot remove yourself', 'CANNOT_REMOVE_SELF');
    await prisma.careTeamMember.delete({
      where: { careTeamId_userId: { careTeamId: req.params.teamId, userId: req.params.userId } },
    });
    res.json({ success: true, data: { message: 'Member removed' } });
  })
);

export default router;
