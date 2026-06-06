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

// GET /api/v1/inventory?recipientId=&lowOnly=true
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientId, lowOnly } = req.query;
    if (!recipientId) throw ApiError.badRequest('recipientId is required', 'MISSING_PARAM');
    await verifyAccess(recipientId as string, req.user!.id);
    const items = await prisma.inventoryItem.findMany({
      where: { recipientId: recipientId as string, isActive: true },
      include: { transactions: { orderBy: { recordedAt: 'desc' }, take: 5 } },
      orderBy: { category: 'asc' },
    });
    const result =
      lowOnly === 'true' ? items.filter((i) => i.currentStock <= i.minimumStock) : items;
    res.json({ success: true, data: result });
  })
);

// POST /api/v1/inventory — create item
router.post(
  '/',
  requireAuth,
  validate(
    z.object({
      body: z.object({
        recipientId: z.string().uuid(),
        name: z.string().min(1),
        category: z.string().min(1),
        location: z.string().optional(),
        currentStock: z.number().int().min(0).optional(),
        minimumStock: z.number().int().min(0).optional(),
        unit: z.string().optional(),
        supplierName: z.string().optional(),
        supplierUrl: z.string().url().optional().or(z.literal('')),
        notes: z.string().optional(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await verifyAccess(req.body.recipientId, req.user!.id);
    const item = await prisma.inventoryItem.create({ data: req.body });
    res.status(201).json({ success: true, data: item });
  })
);

// POST /api/v1/inventory/:id/adjust — adjust stock level
router.post(
  '/:id/adjust',
  requireAuth,
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        type: z.enum(['restock', 'use', 'adjustment']),
        quantity: z.number().int(),
        notes: z.string().optional(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: req.params.id },
      include: { recipient: { include: { careTeam: { include: { members: true } } } } },
    });
    if (!item) throw ApiError.notFound('Item not found', 'NOT_FOUND');
    if (!item.recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');

    const { type, quantity, notes } = req.body;
    const delta = type === 'use' ? -Math.abs(quantity) : Math.abs(quantity);
    const newStock = Math.max(0, item.currentStock + delta);

    const [updated] = await prisma.$transaction([
      prisma.inventoryItem.update({
        where: { id: req.params.id },
        data: {
          currentStock: newStock,
          lastRestocked: type === 'restock' ? new Date() : undefined,
        },
      }),
      prisma.inventoryTransaction.create({
        data: { itemId: req.params.id, type, quantity, notes, recordedBy: req.user!.id },
      }),
    ]);
    res.json({ success: true, data: updated });
  })
);

// PATCH /api/v1/inventory/:id
router.patch(
  '/:id',
  requireAuth,
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        name: z.string().optional(),
        location: z.string().optional(),
        minimumStock: z.number().int().min(0).optional(),
        notes: z.string().optional(),
        isActive: z.boolean().optional(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: req.params.id },
      include: { recipient: { include: { careTeam: { include: { members: true } } } } },
    });
    if (!item) throw ApiError.notFound('Item not found', 'NOT_FOUND');
    if (!item.recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
    const updated = await prisma.inventoryItem.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: updated });
  })
);

export default router;
