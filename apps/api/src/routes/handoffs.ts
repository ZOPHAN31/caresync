import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';

const router = Router();

async function verifyAccess(recipientId: string, userId: string) {
  const recipient = await prisma.careRecipient.findUnique({
    where: { id: recipientId },
    include: { careTeam: { include: { members: true } } },
  });
  if (!recipient) throw ApiError.notFound('Recipient not found', 'NOT_FOUND');
  if (!recipient.careTeam.members.some((m) => m.userId === userId))
    throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
  return recipient;
}

// GET /api/v1/handoffs?recipientId=&direction=received|sent
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientId, direction } = req.query;
    if (!recipientId) throw ApiError.badRequest('recipientId is required', 'MISSING_PARAM');
    await verifyAccess(recipientId as string, req.user!.id);

    const where: Record<string, unknown> = { recipientId };
    if (direction === 'received') where.receiverId = req.user!.id;
    if (direction === 'sent') where.giverId = req.user!.id;

    const handoffs = await prisma.shiftHandoff.findMany({
      where,
      include: {
        giver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        receiver: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
      orderBy: { shiftDate: 'desc' },
      take: 20,
    });
    res.json({ success: true, data: handoffs });
  })
);

// POST /api/v1/handoffs — create a shift handoff
router.post(
  '/',
  requireAuth,
  validate(
    z.object({
      body: z.object({
        recipientId: z.string().uuid(),
        receiverId: z.string().uuid().optional(),
        shiftType: z.enum(['morning', 'afternoon', 'night', '24hr']).optional(),
        summary: z.string().min(1, 'Summary is required'),
        mealsGiven: z.string().optional(),
        waterIntake: z.string().optional(),
        medicationsGiven: z.string().optional(),
        medicationsMissed: z.string().optional(),
        bowelMovements: z.string().optional(),
        sleep: z.string().optional(),
        mood: z.string().optional(),
        painLevel: z.number().int().min(0).max(10).optional().nullable(),
        falls: z.string().optional(),
        behavioralNotes: z.string().optional(),
        pendingTasks: z.string().optional(),
        upcomingAppointments: z.string().optional(),
        suppliesLow: z.array(z.string()).optional(),
        urgentItems: z.string().optional(),
        generalNotes: z.string().optional(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const recipient = await prisma.careRecipient.findUnique({
      where: { id: req.body.recipientId },
      include: { careTeam: { include: { members: true } } },
    });
    if (!recipient) throw ApiError.notFound('Recipient not found', 'NOT_FOUND');
    if (!recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');

    const handoff = await prisma.shiftHandoff.create({
      data: { ...req.body, giverId: req.user!.id },
      include: {
        giver: { select: { id: true, firstName: true, lastName: true } },
        receiver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.status(201).json({ success: true, data: handoff });
  })
);

// PATCH /api/v1/handoffs/:id/read — mark handoff as read
router.patch(
  '/:id/read',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const handoff = await prisma.shiftHandoff.findUnique({ where: { id: req.params.id } });
    if (!handoff) throw ApiError.notFound('Handoff not found', 'NOT_FOUND');
    if (handoff.receiverId !== req.user!.id)
      throw ApiError.forbidden('Not your handoff', 'NOT_RECEIVER');
    const updated = await prisma.shiftHandoff.update({
      where: { id: req.params.id },
      data: { isRead: true, readAt: new Date() },
    });
    res.json({ success: true, data: updated });
  })
);

export default router;
