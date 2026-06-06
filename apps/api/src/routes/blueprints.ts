import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { BlueprintTriggerType } from '@prisma/client';

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

const blueprintSchema = z.object({
  recipientId: z.string().uuid(),
  title: z.string().min(1),
  trigger: z.nativeEnum(BlueprintTriggerType),
  customTrigger: z.string().optional(),
  description: z.string().optional(),
  steps: z.array(
    z.object({
      order: z.number().int(),
      action: z.string(),
      responsible: z.string(),
      notes: z.string().optional(),
    })
  ),
  contacts: z.array(z.object({ name: z.string(), phone: z.string(), role: z.string() })),
  documents: z.array(z.string()).optional(),
});

// GET /api/v1/blueprints?recipientId=
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientId } = req.query;
    if (!recipientId) throw ApiError.badRequest('recipientId is required', 'MISSING_PARAM');
    await verifyAccess(recipientId as string, req.user!.id);
    const blueprints = await prisma.futureBlueprint.findMany({
      where: { recipientId: recipientId as string },
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: blueprints });
  })
);

// GET /api/v1/blueprints/:id
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const blueprint = await prisma.futureBlueprint.findUnique({
      where: { id: req.params.id },
      include: { recipient: { include: { careTeam: { include: { members: true } } } } },
    });
    if (!blueprint) throw ApiError.notFound('Blueprint not found', 'NOT_FOUND');
    if (!blueprint.recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
    res.json({ success: true, data: blueprint });
  })
);

// POST /api/v1/blueprints
router.post(
  '/',
  requireAuth,
  validate(z.object({ body: blueprintSchema })),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await verifyAccess(req.body.recipientId, req.user!.id);
    const blueprint = await prisma.futureBlueprint.create({ data: req.body });
    res.status(201).json({ success: true, data: blueprint });
  })
);

// PATCH /api/v1/blueprints/:id
router.patch(
  '/:id',
  requireAuth,
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: blueprintSchema.partial().omit({ recipientId: true }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const blueprint = await prisma.futureBlueprint.findUnique({
      where: { id: req.params.id },
      include: { recipient: { include: { careTeam: { include: { members: true } } } } },
    });
    if (!blueprint) throw ApiError.notFound('Blueprint not found', 'NOT_FOUND');
    if (!blueprint.recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
    const updated = await prisma.futureBlueprint.update({
      where: { id: req.params.id },
      data: { lastReviewed: new Date(), ...req.body },
    });
    res.json({ success: true, data: updated });
  })
);

export default router;
