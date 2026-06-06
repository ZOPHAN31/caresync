import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { MedicationFrequency } from '@prisma/client';
import { medicationService } from '../services/db/medicationService';

const router = Router();

async function verifyRecipientAccess(recipientId: string, userId: string) {
  const recipient = await prisma.careRecipient.findUnique({
    where: { id: recipientId },
    include: { careTeam: { include: { members: true } } },
  });
  if (!recipient) throw ApiError.notFound('Recipient not found', 'NOT_FOUND');
  if (!recipient.careTeam.members.some((m) => m.userId === userId))
    throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
  return recipient;
}

const medicationSchema = z.object({
  name: z.string().min(1),
  genericName: z.string().optional().nullable(),
  dosage: z.string().min(1),
  unit: z.string().min(1),
  frequency: z.nativeEnum(MedicationFrequency),
  customFrequency: z.string().optional().nullable(),
  instructions: z.string().optional().nullable(),
  prescribedBy: z.string().optional().nullable(),
  pharmacy: z.string().optional().nullable(),
  pharmacyPhone: z.string().optional().nullable(),
  rxNumber: z.string().optional().nullable(),
  refillDate: z.string().datetime().optional().nullable(),
  pillsRemaining: z.number().int().optional().nullable(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional().nullable(),
  isPRN: z.boolean().optional(),
  prnReason: z.string().optional().nullable(),
  sideEffects: z.array(z.string()).optional(),
  purpose: z.string().optional().nullable(),
  scheduleTimes: z
    .array(z.object({ scheduledTime: z.string(), label: z.string().optional() }))
    .optional(),
});

// GET /api/v1/medications?recipientId=
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientId, activeOnly } = req.query;
    if (!recipientId) throw ApiError.badRequest('recipientId is required', 'MISSING_RECIPIENT');
    await verifyRecipientAccess(recipientId as string, req.user!.id);
    const meds = await medicationService.findByRecipient(
      recipientId as string,
      activeOnly !== 'false'
    );
    res.json({ success: true, data: meds });
  })
);

// GET /api/v1/medications/due-today?recipientId=
router.get(
  '/due-today',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientId } = req.query;
    if (!recipientId) throw ApiError.badRequest('recipientId is required', 'MISSING_RECIPIENT');
    await verifyRecipientAccess(recipientId as string, req.user!.id);
    const meds = await medicationService.getDueToday(recipientId as string);
    res.json({ success: true, data: meds });
  })
);

// POST /api/v1/medications — create medication
router.post(
  '/',
  requireAuth,
  validate(z.object({ body: medicationSchema.extend({ recipientId: z.string().uuid() }) })),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await verifyRecipientAccess(req.body.recipientId, req.user!.id);
    const { scheduleTimes, ...medData } = req.body;
    const medication = await prisma.medication.create({
      data: {
        ...medData,
        scheduleTimes: scheduleTimes ? { create: scheduleTimes } : undefined,
      },
      include: { scheduleTimes: true },
    });
    res.status(201).json({ success: true, data: medication });
  })
);

// PATCH /api/v1/medications/:id
router.patch(
  '/:id',
  requireAuth,
  validate(
    z.object({ params: z.object({ id: z.string().uuid() }), body: medicationSchema.partial() })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const med = await prisma.medication.findUnique({
      where: { id: req.params.id },
      include: { recipient: { include: { careTeam: { include: { members: true } } } } },
    });
    if (!med) throw ApiError.notFound('Medication not found', 'NOT_FOUND');
    if (!med.recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
    const { scheduleTimes: _scheduleTimes, ...updates } = req.body;
    const updated = await prisma.medication.update({
      where: { id: req.params.id },
      data: updates,
      include: { scheduleTimes: true },
    });
    res.json({ success: true, data: updated });
  })
);

// POST /api/v1/medications/:id/log — log medication administration
router.post(
  '/:id/log',
  requireAuth,
  validate(
    z.object({
      params: z.object({ id: z.string().uuid() }),
      body: z.object({
        given: z.boolean(),
        dosageGiven: z.string().optional(),
        reason: z.string().optional(),
        notes: z.string().optional(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const med = await prisma.medication.findUnique({
      where: { id: req.params.id },
      include: { recipient: { include: { careTeam: { include: { members: true } } } } },
    });
    if (!med) throw ApiError.notFound('Medication not found', 'NOT_FOUND');
    if (!med.recipient.careTeam.members.some((m) => m.userId === req.user!.id))
      throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
    const log = await medicationService.logAdministration(
      req.params.id,
      req.user!.id,
      req.body.given,
      req.body.notes
    );
    res.status(201).json({ success: true, data: log });
  })
);

export default router;
