import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, requireCareTeamMember, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { CareStatus } from '@prisma/client';

const router = Router();

const recipientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().datetime().optional().nullable(),
  primaryDiagnosis: z.string().optional().nullable(),
  secondaryDiagnoses: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  bloodType: z.string().optional().nullable(),
  weightLbs: z.number().positive().optional().nullable(),
  heightInches: z.number().positive().optional().nullable(),
  preferredHospital: z.string().optional().nullable(),
  preferredPhysician: z.string().optional().nullable(),
  physicianPhone: z.string().optional().nullable(),
  insuranceProvider: z.string().optional().nullable(),
  insurancePolicyNumber: z.string().optional().nullable(),
  medicareNumber: z.string().optional().nullable(),
  dnrStatus: z.boolean().optional(),
  advanceDirective: z.boolean().optional(),
  mobilityStatus: z.string().optional().nullable(),
  dietaryRestrictions: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
  status: z.nativeEnum(CareStatus).optional(),
});

// POST /api/v1/teams/:teamId/recipient — create care recipient
router.post(
  '/teams/:teamId/recipient',
  requireAuth,
  requireCareTeamMember(),
  validate(z.object({ params: z.object({ teamId: z.string().uuid() }), body: recipientSchema })),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const existing = await prisma.careRecipient.findUnique({
      where: { careTeamId: req.params.teamId },
    });
    if (existing)
      throw ApiError.conflict('This care team already has a recipient', 'RECIPIENT_EXISTS');
    const recipient = await prisma.careRecipient.create({
      data: { ...req.body, careTeamId: req.params.teamId },
    });
    res.status(201).json({ success: true, data: recipient });
  })
);

// GET /api/v1/teams/:teamId/recipient — get care recipient
router.get(
  '/teams/:teamId/recipient',
  requireAuth,
  requireCareTeamMember(),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const recipient = await prisma.careRecipient.findUnique({
      where: { careTeamId: req.params.teamId },
      include: { emergencyContacts: { orderBy: { priority: 'asc' } } },
    });
    if (!recipient)
      throw ApiError.notFound('No care recipient set up for this team', 'RECIPIENT_NOT_FOUND');
    res.json({ success: true, data: recipient });
  })
);

// PATCH /api/v1/recipients/:id — update care recipient
router.patch(
  '/:id',
  requireAuth,
  validate(
    z.object({ params: z.object({ id: z.string().uuid() }), body: recipientSchema.partial() })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const recipient = await prisma.careRecipient.findUnique({
      where: { id: req.params.id },
      include: { careTeam: { include: { members: true } } },
    });
    if (!recipient) throw ApiError.notFound('Recipient not found', 'NOT_FOUND');
    const isMember = recipient.careTeam.members.some((m) => m.userId === req.user!.id);
    if (!isMember) throw ApiError.forbidden('Not a member of this care team', 'NOT_MEMBER');
    const updated = await prisma.careRecipient.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json({ success: true, data: updated });
  })
);

export default router;
