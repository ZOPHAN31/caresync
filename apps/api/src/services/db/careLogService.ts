import { prisma } from '../../lib/prisma';
import { LogEntryType, Prisma } from '@prisma/client';

export const careLogService = {
  async findByRecipient(
    recipientId: string,
    options?: {
      type?: LogEntryType;
      from?: Date;
      to?: Date;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: Prisma.CareLogWhereInput = { recipientId };
    if (options?.type) where.type = options.type;
    if (options?.from || options?.to) {
      where.occurredAt = {};
      if (options.from) where.occurredAt.gte = options.from;
      if (options.to) where.occurredAt.lte = options.to;
    }
    return prisma.careLog.findMany({
      where,
      include: { loggedByUser: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { occurredAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  },

  async create(data: Prisma.CareLogCreateInput) {
    return prisma.careLog.create({
      data,
      include: { loggedByUser: { select: { id: true, firstName: true, lastName: true } } },
    });
  },

  async getTodaySummary(recipientId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.careLog.findMany({
      where: { recipientId, occurredAt: { gte: today, lt: tomorrow } },
      orderBy: { occurredAt: 'asc' },
    });
  },
};
