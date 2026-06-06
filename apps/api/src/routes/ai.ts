import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { prisma } from '../lib/prisma';
import {
  generateCarePlan,
  mediateDisagreement,
  generateDailySummary,
  assessBurnoutRisk,
  answerCareQuestion,
} from '../services/aiService';

const router = Router();

// All AI routes require auth and are rate-limited
router.use(requireAuth, aiLimiter);

// Helper to verify recipient access and get context
async function getRecipientContext(recipientId: string, userId: string) {
  const recipient = await prisma.careRecipient.findUnique({
    where: { id: recipientId },
    include: {
      careTeam: {
        include: {
          members: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        },
      },
      medications: { where: { isActive: true }, include: { scheduleTimes: true } },
    },
  });
  if (!recipient) throw ApiError.notFound('Recipient not found', 'NOT_FOUND');
  if (!recipient.careTeam.members.some((m) => m.userId === userId))
    throw ApiError.forbidden('Not a member', 'NOT_MEMBER');
  return recipient;
}

// POST /api/v1/ai/care-plan
router.post(
  '/care-plan',
  validate(
    z.object({
      body: z.object({
        recipientId: z.string().uuid(),
        caregiverSchedules: z.string().min(1, 'Caregiver schedules are required'),
        specificChallenges: z.string().min(1, 'Please describe the specific challenges you face'),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const recipient = await getRecipientContext(req.body.recipientId, req.user!.id);
    const result = await generateCarePlan({
      recipient: {
        firstName: recipient.firstName,
        lastName: recipient.lastName,
        primaryDiagnosis: recipient.primaryDiagnosis,
        secondaryDiagnoses: recipient.secondaryDiagnoses,
        mobilityStatus: recipient.mobilityStatus,
        dietaryRestrictions: recipient.dietaryRestrictions,
        notes: recipient.notes,
      },
      medications: recipient.medications.map((m) => ({
        name: m.name,
        frequency: m.frequency,
        isPRN: m.isPRN,
      })),
      teamMembers: recipient.careTeam.members.map((m) => ({
        firstName: m.user.firstName,
        role: m.role,
      })),
      caregiverSchedules: req.body.caregiverSchedules,
      specificChallenges: req.body.specificChallenges,
    });
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'AI_CARE_PLAN',
        resource: 'ai',
        resourceId: req.body.recipientId,
      },
    });
    res.json({ success: true, data: result });
  })
);

// POST /api/v1/ai/mediate
router.post(
  '/mediate',
  validate(
    z.object({
      body: z.object({
        recipientId: z.string().uuid(),
        situation: z.string().min(10, 'Please describe the situation in more detail'),
        context: z.string().optional(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const recipient = await getRecipientContext(req.body.recipientId, req.user!.id);
    const result = await mediateDisagreement({
      situation: req.body.situation,
      context: req.body.context,
      recipientName: `${recipient.firstName} ${recipient.lastName}`,
      teamMembers: recipient.careTeam.members.map((m) => ({
        firstName: m.user.firstName,
        role: m.role,
      })),
    });
    await prisma.auditLog.create({
      data: {
        userId: req.user!.id,
        action: 'AI_MEDIATION',
        resource: 'ai',
        resourceId: req.body.recipientId,
      },
    });
    res.json({ success: true, data: result });
  })
);

// POST /api/v1/ai/daily-summary
router.post(
  '/daily-summary',
  validate(z.object({ body: z.object({ recipientId: z.string().uuid() }) })),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const recipient = await getRecipientContext(req.body.recipientId, req.user!.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [careLogs, medicationLogs, vitalSigns] = await Promise.all([
      prisma.careLog.findMany({
        where: { recipientId: req.body.recipientId, occurredAt: { gte: today, lt: tomorrow } },
        include: { loggedByUser: { select: { firstName: true } } },
        orderBy: { occurredAt: 'asc' },
      }),
      prisma.medicationLog.findMany({
        where: {
          medication: { recipientId: req.body.recipientId },
          administeredAt: { gte: today, lt: tomorrow },
        },
        include: { medication: { select: { name: true } } },
        orderBy: { administeredAt: 'asc' },
      }),
      prisma.vitalSign.findMany({
        where: { recipientId: req.body.recipientId, recordedAt: { gte: today, lt: tomorrow } },
        orderBy: { recordedAt: 'asc' },
      }),
    ]);

    if (careLogs.length === 0 && medicationLogs.length === 0) {
      throw ApiError.badRequest(
        'No care data recorded today yet. Add some care log entries first.',
        'NO_DATA'
      );
    }

    // Get the name of who administered medications
    const medLogsWithNames = await Promise.all(
      medicationLogs.map(async (log) => {
        const user = await prisma.user.findUnique({
          where: { id: log.administeredBy },
          select: { firstName: true },
        });
        return {
          medicationName: log.medication.name,
          given: log.given,
          administeredAt: log.administeredAt.toISOString(),
          administeredByName: user?.firstName ?? 'Unknown',
        };
      })
    );

    const result = await generateDailySummary({
      recipientName: `${recipient.firstName} ${recipient.lastName}`,
      primaryDiagnosis: recipient.primaryDiagnosis,
      date: today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      careLogs: careLogs.map((log) => ({
        type: log.type,
        occurredAt: log.occurredAt.toISOString(),
        notes: log.notes ?? undefined,
        mealDescription: log.mealDescription ?? undefined,
        mealAmount: log.mealAmount ?? undefined,
        waterOz: log.waterOz ?? undefined,
        moodRating: log.moodRating ?? undefined,
        painLevel: log.painLevel ?? undefined,
        fallLocation: log.fallLocation ?? undefined,
        behaviorDescription: log.behaviorDescription ?? undefined,
        loggedByUser: { firstName: log.loggedByUser.firstName },
      })),
      medicationLogs: medLogsWithNames,
      vitalSigns: vitalSigns.map((v) => ({
        recordedAt: v.recordedAt.toISOString(),
        bloodPressureSystolic: v.bloodPressureSystolic ?? undefined,
        bloodPressureDiastolic: v.bloodPressureDiastolic ?? undefined,
        heartRate: v.heartRate ?? undefined,
        temperatureF: v.temperatureF ?? undefined,
        oxygenSaturation: v.oxygenSaturation ?? undefined,
      })),
    });
    res.json({ success: true, data: result });
  })
);

// POST /api/v1/ai/burnout-check
router.post(
  '/burnout-check',
  validate(
    z.object({
      body: z.object({
        selfReportedStress: z.string().optional(),
        recentChallenges: z.string().optional(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: { careTeamMemberships: true },
    });
    if (!user) throw ApiError.notFound('User not found', 'NOT_FOUND');

    const membership = user.careTeamMemberships[0];

    const [tasksAssigned, tasksCompleted, tasksMissed, careLogsCreated, activeDays] =
      await Promise.all([
        prisma.taskAssignment.count({
          where: { userId: req.user!.id, createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.taskAssignment.count({
          where: { userId: req.user!.id, status: 'COMPLETED', updatedAt: { gte: thirtyDaysAgo } },
        }),
        prisma.taskAssignment.count({
          where: { userId: req.user!.id, status: 'MISSED', updatedAt: { gte: thirtyDaysAgo } },
        }),
        prisma.careLog.count({
          where: { loggedBy: req.user!.id, createdAt: { gte: thirtyDaysAgo } },
        }),
        prisma.careLog
          .findMany({
            where: { loggedBy: req.user!.id, createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true },
          })
          .then((logs) => new Set(logs.map((l) => l.createdAt.toDateString())).size),
      ]);

    const result = await assessBurnoutRisk({
      caregiverName: `${req.user!.firstName} ${req.user!.lastName}`,
      role: membership?.role ?? 'CAREGIVER',
      daysAnalyzed: 30,
      tasksAssigned,
      tasksCompleted,
      tasksMissed,
      careLogsCreated,
      activeDays,
      selfReportedStress: req.body.selfReportedStress,
      recentChallenges: req.body.recentChallenges,
    });
    res.json({ success: true, data: result });
  })
);

// POST /api/v1/ai/ask
router.post(
  '/ask',
  validate(
    z.object({
      body: z.object({
        recipientId: z.string().uuid(),
        question: z.string().min(5, 'Please ask a complete question'),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const recipient = await getRecipientContext(req.body.recipientId, req.user!.id);
    const recentLogs = await prisma.careLog.findMany({
      where: { recipientId: req.body.recipientId },
      orderBy: { occurredAt: 'desc' },
      take: 5,
    });
    const recentNotes = recentLogs
      .filter((l) => l.notes)
      .map((l) => l.notes)
      .join('; ');

    const answer = await answerCareQuestion({
      question: req.body.question,
      recipientContext: {
        firstName: recipient.firstName,
        primaryDiagnosis: recipient.primaryDiagnosis,
        secondaryDiagnoses: recipient.secondaryDiagnoses,
        medications: recipient.medications.map((m) => m.name),
        recentNotes,
      },
    });
    res.json({ success: true, data: { answer } });
  })
);

export default router;
