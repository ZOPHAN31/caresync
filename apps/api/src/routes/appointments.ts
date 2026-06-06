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

const appointmentSchema = z.object({
  recipientId: z.string().uuid(),
  title: z.string().min(1),
  provider: z.string().optional(),
  specialty: z.string().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  scheduledAt: z.string().datetime(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().optional(),
  preparationInstructions: z.string().optional(),
  transportation: z.string().optional(),
  transportedBy: z.string().optional(),
});

// GET /api/v1/appointments?recipientId=&upcoming=true
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientId, upcoming } = req.query;
    if (!recipientId) throw ApiError.badRequest('recipientId is required', 'MISSING_PARAM');
    await verifyAccess(recipientId as string, req.user!.id);

    const where: Record<string, unknown> = { recipientId };
    if (upcoming === 'true') where.scheduledAt = { gte: new Date() };

    const appointments = await prisma.appointment.findMany({
      where,
      orderBy: { scheduledAt: upcoming === 'true' ? 'asc' : 'desc' },
      take: 50,
    });
    res.json({ success: true, data: appointments });
  })
);

// POST /api/v1/appointments
router.post(
  '/',
  requireAuth,
  validate(z.object({ body: appointmentSchema })),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await verifyAccess(req.body.recipientId, req.user!.id);
    const appointment = await prisma.appointment.create({
      data: { ...req.body, scheduledAt: new Date(req.body.scheduledAt) },
    });
    res.status(201).json({ success: true, data: appointment });
  })
);

// PATCH /api/v1/appointments/:id
router.patch(
  '/:id',
  requireAuth,
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: appointmentSchema.partial().omit({ recipientId: true }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const apt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { recipient: { include: { careTeam: { include: { members: true } } } } },
    });
    if (!apt) throw ApiError.notFound('Appointment not found', 'NOT_FOUND');
    if (!apt.recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
    const data = { ...req.body };
    if (data.scheduledAt) data.scheduledAt = new Date(data.scheduledAt);
    const updated = await prisma.appointment.update({ where: { id: req.params.id }, data });
    res.json({ success: true, data: updated });
  })
);

// POST /api/v1/appointments/:id/complete
router.post(
  '/:id/complete',
  requireAuth,
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        outcome: z.string().optional(),
        followUpRequired: z.boolean().optional(),
        followUpNotes: z.string().optional(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const apt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { recipient: { include: { careTeam: { include: { members: true } } } } },
    });
    if (!apt) throw ApiError.notFound('Appointment not found', 'NOT_FOUND');
    if (!apt.recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { isCompleted: true, completedAt: new Date(), ...req.body },
    });
    res.json({ success: true, data: updated });
  })
);

// DELETE /api/v1/appointments/:id
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const apt = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { recipient: { include: { careTeam: { include: { members: true } } } } },
    });
    if (!apt) throw ApiError.notFound('Appointment not found', 'NOT_FOUND');
    if (!apt.recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
    await prisma.appointment.delete({ where: { id: req.params.id } });
    res.json({ success: true, data: { message: 'Appointment deleted' } });
  })
);

export default router;
