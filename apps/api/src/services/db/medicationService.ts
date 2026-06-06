import { prisma } from '../../lib/prisma';
import { Prisma } from '@prisma/client';

export const medicationService = {
  async findByRecipient(recipientId: string, activeOnly = true) {
    return prisma.medication.findMany({
      where: { recipientId, ...(activeOnly ? { isActive: true } : {}) },
      include: { scheduleTimes: true },
      orderBy: { name: 'asc' },
    });
  },

  async create(data: Prisma.MedicationCreateInput) {
    return prisma.medication.create({ data, include: { scheduleTimes: true } });
  },

  async logAdministration(
    medicationId: string,
    administeredBy: string,
    given: boolean,
    notes?: string
  ) {
    return prisma.medicationLog.create({
      data: { medicationId, administeredBy, given, notes, administeredAt: new Date() },
    });
  },

  async getDueToday(recipientId: string) {
    return prisma.medication.findMany({
      where: { recipientId, isActive: true },
      include: {
        scheduleTimes: true,
        logs: {
          where: { administeredAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
          orderBy: { administeredAt: 'desc' },
        },
      },
    });
  },
};
