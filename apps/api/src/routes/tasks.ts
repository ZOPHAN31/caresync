import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { TaskFrequency, TaskStatus } from '@prisma/client';

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

// GET /api/v1/tasks?recipientId=&status=&assignedTo=
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recipientId, status, assignedTo } = req.query;
    if (!recipientId) throw ApiError.badRequest('recipientId is required', 'MISSING_RECIPIENT');
    await verifyRecipientAccess(recipientId as string, req.user!.id);

    const tasks = await prisma.task.findMany({
      where: {
        recipientId: recipientId as string,
        isActive: true,
        ...(assignedTo ? { assignments: { some: { userId: assignedTo as string } } } : {}),
      },
      include: {
        assignments: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
          },
          where: status ? { status: status as TaskStatus } : undefined,
        },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
    });
    res.json({ success: true, data: tasks });
  })
);

// GET /api/v1/tasks/my-tasks — tasks assigned to current user
router.get(
  '/my-tasks',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const assignments = await prisma.taskAssignment.findMany({
      where: {
        userId: req.user!.id,
        status: TaskStatus.PENDING,
        OR: [{ dueDate: null }, { dueDate: { lte: tomorrow } }],
      },
      include: {
        task: {
          include: {
            recipient: { select: { id: true, firstName: true, lastName: true } },
            creator: { select: { id: true, firstName: true, lastName: true } },
          },
        },
      },
      orderBy: [{ task: { priority: 'asc' } }, { dueDate: 'asc' }],
    });
    res.json({ success: true, data: assignments });
  })
);

// POST /api/v1/tasks — create task
router.post(
  '/',
  requireAuth,
  validate(
    z.object({
      body: z.object({
        recipientId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        frequency: z.nativeEnum(TaskFrequency).optional(),
        dueDate: z.string().datetime().optional().nullable(),
        dueTime: z.string().optional().nullable(),
        priority: z.number().int().min(1).max(3).optional(),
        category: z.string().optional(),
        instructions: z.string().optional(),
        suppliesNeeded: z.array(z.string()).optional(),
        assignToUserIds: z.array(z.string().uuid()).optional(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await verifyRecipientAccess(req.body.recipientId, req.user!.id);
    const { assignToUserIds, ...taskData } = req.body;
    const task = await prisma.task.create({
      data: {
        ...taskData,
        createdBy: req.user!.id,
        dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
        assignments: assignToUserIds
          ? {
              create: assignToUserIds.map((userId: string) => ({
                userId,
                status: TaskStatus.PENDING,
                dueDate: taskData.dueDate ? new Date(taskData.dueDate) : undefined,
              })),
            }
          : undefined,
      },
      include: {
        assignments: {
          include: { user: { select: { id: true, firstName: true, lastName: true } } },
        },
        creator: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    res.status(201).json({ success: true, data: task });
  })
);

// PATCH /api/v1/tasks/assignments/:assignmentId — complete or skip a task
router.patch(
  '/assignments/:assignmentId',
  requireAuth,
  validate(
    z.object({
      params: z.object({ assignmentId: z.string().uuid() }),
      body: z.object({
        status: z.enum(['COMPLETED', 'SKIPPED']),
        notes: z.string().optional(),
        skipReason: z.string().optional(),
      }),
    })
  ),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const assignment = await prisma.taskAssignment.findUnique({
      where: { id: req.params.assignmentId },
    });
    if (!assignment) throw ApiError.notFound('Assignment not found', 'NOT_FOUND');
    if (assignment.userId !== req.user!.id)
      throw ApiError.forbidden('Not your assignment', 'NOT_OWNER');
    const updated = await prisma.taskAssignment.update({
      where: { id: req.params.assignmentId },
      data: {
        status: req.body.status,
        notes: req.body.notes,
        skipReason: req.body.skipReason,
        completedAt: req.body.status === 'COMPLETED' ? new Date() : undefined,
        skippedAt: req.body.status === 'SKIPPED' ? new Date() : undefined,
      },
    });
    res.json({ success: true, data: updated });
  })
);

export default router;
