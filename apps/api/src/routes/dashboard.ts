import { Router, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { TaskStatus } from '@prisma/client';

const router = Router();

// GET /api/v1/dashboard/:teamId — aggregated dashboard data
router.get(
  '/:teamId',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const membership = await prisma.careTeamMember.findUnique({
      where: { careTeamId_userId: { careTeamId: req.params.teamId, userId: req.user!.id } },
    });
    if (!membership) throw ApiError.forbidden('Not a member of this care team', 'NOT_MEMBER');

    const recipient = await prisma.careRecipient.findUnique({
      where: { careTeamId: req.params.teamId },
    });
    if (!recipient) {
      return res.json({ success: true, data: { hasRecipient: false } });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      todaysLogs,
      medicationsDueToday,
      pendingTasks,
      myTasks,
      upcomingAppointments,
      lowInventory,
      unreadHandoffs,
      teamMembers,
    ] = await Promise.all([
      // Today's care logs
      prisma.careLog.findMany({
        where: { recipientId: recipient.id, occurredAt: { gte: today, lt: tomorrow } },
        include: { loggedByUser: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { occurredAt: 'desc' },
        take: 10,
      }),

      // Medications due today (active, non-PRN)
      prisma.medication.findMany({
        where: { recipientId: recipient.id, isActive: true, isPRN: false },
        include: {
          scheduleTimes: true,
          logs: {
            where: { administeredAt: { gte: today, lt: tomorrow } },
            orderBy: { administeredAt: 'desc' },
          },
        },
      }),

      // Pending tasks for this recipient
      prisma.taskAssignment.count({
        where: { status: TaskStatus.PENDING, task: { recipientId: recipient.id } },
      }),

      // My pending tasks
      prisma.taskAssignment.findMany({
        where: {
          userId: req.user!.id,
          status: TaskStatus.PENDING,
          task: { recipientId: recipient.id },
        },
        include: { task: true },
        orderBy: [{ task: { priority: 'asc' } }],
        take: 5,
      }),

      // Upcoming appointments (next 7 days)
      prisma.appointment.findMany({
        where: {
          recipientId: recipient.id,
          scheduledAt: { gte: today, lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) },
          isCompleted: false,
        },
        orderBy: { scheduledAt: 'asc' },
        take: 3,
      }),

      // Low inventory items
      prisma.inventoryItem
        .findMany({
          where: { recipientId: recipient.id, isActive: true },
          orderBy: { currentStock: 'asc' },
        })
        .then((items) => items.filter((i) => i.currentStock <= i.minimumStock)),

      // Unread shift handoffs for current user
      prisma.shiftHandoff.count({
        where: { recipientId: recipient.id, receiverId: req.user!.id, isRead: false },
      }),

      // Team members
      prisma.careTeamMember.findMany({
        where: { careTeamId: req.params.teamId },
        include: {
          user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        },
      }),
    ]);

    // Calculate medication status
    const medicationStatus = medicationsDueToday.map((med) => {
      const givenToday = med.logs.filter((l) => l.given).length;
      const totalDoses = med.scheduleTimes.length || 1;
      return { ...med, givenToday, totalDoses, allGiven: givenToday >= totalDoses };
    });

    res.json({
      success: true,
      data: {
        hasRecipient: true,
        recipient: {
          id: recipient.id,
          firstName: recipient.firstName,
          lastName: recipient.lastName,
          status: recipient.status,
          primaryDiagnosis: recipient.primaryDiagnosis,
        },
        todaysLogs,
        medications: {
          total: medicationsDueToday.length,
          allGiven: medicationStatus.filter((m) => m.allGiven).length,
          items: medicationStatus,
        },
        tasks: { pending: pendingTasks, myTasks },
        upcomingAppointments,
        lowInventory,
        alerts: {
          unreadHandoffs,
          lowInventoryCount: lowInventory.length,
          missedMedications: medicationStatus.filter((m) => !m.allGiven).length,
        },
        teamMembers,
      },
    });
  })
);

export default router;
