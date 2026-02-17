import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AbuseService {
  constructor(private prisma: PrismaService) {}

  async logAbuse(userId: string, eventType: string, severity: number, description?: string) {
    return this.prisma.abuseLog.create({
      data: {
        userId,
        eventType: eventType as any,
        severity,
        description,
      },
    });
  }

  async getUserAbuseLogs(userId: string) {
    return this.prisma.abuseLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async checkUserStatus(userId: string) {
    const recentLogs = await this.prisma.abuseLog.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    const criticalCount = recentLogs.filter(log => log.severity >= 8).length;
    const highCount = recentLogs.filter(log => log.severity >= 5 && log.severity < 8).length;

    return {
      shouldBlock: criticalCount >= 1 || highCount >= 3,
      logs: recentLogs,
    };
  }

  async getAllAbuseLogs() {
    return this.prisma.abuseLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async resolveLog(logId: string) {
    return this.prisma.abuseLog.update({
      where: { id: logId },
      data: {
        resolved: true,
        resolvedAt: new Date(),
      },
    });
  }
}
