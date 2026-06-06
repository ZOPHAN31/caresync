import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { LogEntryType } from '@prisma/client';
import { careLogService } from '../services/db/careLogService';

const router = Router();

const createLogSchema = z.object({
  body: z.object({
    recipientId: z.string().uuid(),
    type: z.nativeEnum(LogEntryType),
    occurredAt: z.string().datetime().optional(),
    notes: z.string().optional(),
    // MEAL
    mealDescription: z.string().optional(),
    mealAmount: z.enum(['full', 'half', 'quarter', 'refused', 'supplement']).optional(),
    // WATER
    waterOz: z.number().positive().optional(),
    // BATHROOM
    urination: z.boolean().optional(),
    bowelMovement: z.boolean().optional(),
    bowelDescription: z.string().optional(),
    // SLEEP
    sleepHours: z.number().min(0).max(24).optional(),
    sleepQuality: z.enum(['good', 'restless', 'poor']).optional(),
    // MOOD
    moodRating: z.number().int().min(1).max(5).optional(),
    moodDescription: z.string().optional(),
    // PAIN
    painLevel: z.number().int().min(0).max(10).optional(),
    painLocation: z.string().optional(),
    painDescription: z.string().optional(),
    // FALL
    fallLocation: z.string().optional(),
    fallInjury: z.boolean().optional(),
    fallInjuryDescription: z.string().optional(),
    emergencyContacted: z.boolean().optional(),
    // BEHAVIORAL
    behaviorDescription: z.string().optional(),
    behaviorTrigger: z.string().optional(),
    behaviorIntervention: z.string().optional(),
  }),
});

// Helper to verify recipient membership
async function verifyRecipientAccess(recipientId: string, userId: string) {
  const recipient = await prisma.careRecipient.findUnique({
    where: { id: recipientId },
    include: { careTeam: { include: { members: true } } },
  });
  if (!recipient) throw ApiError.notFound('Recipient not found', 'NOT_FOUND');
  const isMember = recipient.careTeam.members.some((m) => m.userId === userId);
  if (!isMember) throw ApiError.forbidden('Not a member of this care team', 'NOT_MEMBER');
  return recipient;
}

// GET /api/v1/care-logs?recipientId=&type=&from=&to=&limit=&offset=
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientId, type, from, to, limit, offset } = req.query;
    if (!recipientId) throw ApiError.badRequest('recipientId is required', 'MISSING_RECIPIENT');
    await verifyRecipientAccess(recipientId as string, req.user!.id);

    const logs = await careLogService.findByRecipient(recipientId as string, {
      type: type as LogEntryType | undefined,
      from: from ? new Date(from as string) : undefined,
      to: to ? new Date(to as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
      offset: offset ? parseInt(offset as string) : 0,
    });
    res.json({ success: true, data: logs });
  })
);

// GET /api/v1/care-logs/today?recipientId=
router.get(
  '/today',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientId } = req.query;
    if (!recipientId) throw ApiError.badRequest('recipientId is required', 'MISSING_RECIPIENT');
    await verifyRecipientAccess(recipientId as string, req.user!.id);
    const logs = await careLogService.getTodaySummary(recipientId as string);
    res.json({ success: true, data: logs });
  })
);

// POST /api/v1/care-logs — create a care log entry
router.post(
  '/',
  requireAuth,
  validate(createLogSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await verifyRecipientAccess(req.body.recipientId, req.user!.id);
    const log = await prisma.careLog.create({
      data: {
        ...req.body,
        loggedBy: req.user!.id,
        occurredAt: req.body.occurredAt ? new Date(req.body.occurredAt) : new Date(),
      },
      include: { loggedByUser: { select: { id: true, firstName: true, lastName: true } } },
    });
    res.status(201).json({ success: true, data: log });
  })
);

// DELETE /api/v1/care-logs/:id — delete a log entry (own entries only, or admin)
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const log = await prisma.careLog.findUnique({ where: { id: req.params.id } });
    if (!log) throw ApiError.notFound('Log entry not found', 'NOT_FOUND');
    if (log.loggedBy !== req.user!.id)
      throw ApiError.forbidden('You can only delete your own log entries', 'NOT_OWNER');
    await prisma.careLog.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Log entry deleted' } });
  })
);

export default router;
