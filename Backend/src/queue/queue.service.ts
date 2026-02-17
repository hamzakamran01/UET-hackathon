import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TokensGateway } from '../tokens/tokens.gateway';

@Injectable()
export class QueueService {
  constructor(
    private prisma: PrismaService,
    private tokensGateway: TokensGateway,
    @InjectQueue('queue-management') private queueManagement: Queue,
  ) {}

  // ==================== CRON Jobs ====================

  @Cron(CronExpression.EVERY_30_SECONDS)
  async checkPresenceCompliance() {
    // Get tokens that are 5 positions or less from their turn
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
    });

    for (const service of services) {
      const activeTokens = await this.prisma.token.findMany({
        where: {
          serviceId: service.id,
          status: 'ACTIVE',
        },
        orderBy: { queuePosition: 'asc' },
        take: 5,
      });

      for (const token of activeTokens) {
        // Request presence check
        this.tokensGateway.notifyPresenceCheckRequired(token.id);
      }
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAutoCancel() {
    // Get all tokens that have been CALLED but not responded
    const calledTokens = await this.prisma.token.findMany({
      where: {
        status: 'CALLED',
        calledAt: {
          lt: new Date(Date.now() - 2 * 60 * 1000), // Called more than 2 minutes ago
        },
      },
      include: { service: true },
    });

    for (const token of calledTokens) {
      // Check if user is within geofence
      const lastPresenceCheck = await this.prisma.presenceCheck.findFirst({
        where: { tokenId: token.id },
        orderBy: { checkedAt: 'desc' },
      });

      if (!lastPresenceCheck || !lastPresenceCheck.isWithinGeofence) {
        // Auto-cancel token
        await this.prisma.token.update({
          where: { id: token.id },
          data: {
            status: 'NO_SHOW',
            cancelledAt: new Date(),
            cancellationReason: 'Auto-cancelled: Did not reach counter',
            autoCancel: true,
          },
        });

        // Log abuse
        await this.prisma.abuseLog.create({
          data: {
            userId: token.userId,
            eventType: 'NO_SHOW',
            severity: 5,
            description: 'Did not reach counter within time limit',
          },
        });

        // Notify user
        this.tokensGateway.notifyTokenCancelled(
          token.id,
          'Auto-cancelled due to no-show',
        );

        // Broadcast queue update
        await this.tokensGateway.broadcastQueueUpdate(token.serviceId);
      }
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async updateQueueEstimates() {
    // Update estimated wait times for all active tokens
    const services = await this.prisma.service.findMany({
      where: { isActive: true },
    });

    for (const service of services) {
      const activeTokens = await this.prisma.token.findMany({
        where: {
          serviceId: service.id,
          status: { in: ['ACTIVE', 'CALLED'] },
        },
        orderBy: { queuePosition: 'asc' },
      });

      for (const token of activeTokens) {
        const estimatedWaitTime = token.queuePosition * service.estimatedServiceTime;

        await this.prisma.token.update({
          where: { id: token.id },
          data: { estimatedWaitTime },
        });
      }

      // Broadcast update if there are changes
      if (activeTokens.length > 0) {
        await this.tokensGateway.broadcastQueueUpdate(service.id);
      }
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async cleanupExpiredTokens() {
    // Mark all uncompleted tokens from previous day as EXPIRED
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await this.prisma.token.updateMany({
      where: {
        status: { in: ['ACTIVE', 'CALLED'] },
        createdAt: { lt: yesterday },
      },
      data: {
        status: 'EXPIRED',
        cancelledAt: new Date(),
        cancellationReason: 'Token expired (end of day)',
      },
    });
  }

  // ==================== Manual Queue Operations ====================

  async callNextInQueue(serviceId: string) {
    const nextToken = await this.prisma.token.findFirst({
      where: {
        serviceId,
        status: 'ACTIVE',
      },
      orderBy: { queuePosition: 'asc' },
    });

    if (!nextToken) {
      return null;
    }

    const updatedToken = await this.prisma.token.update({
      where: { id: nextToken.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
      },
      include: { user: true, service: true },
    });

    // Notify the user
    await this.tokensGateway.notifyTokenCalled(nextToken.id);

    // Broadcast queue update
    await this.tokensGateway.broadcastQueueUpdate(serviceId);

    return updatedToken;
  }

  async completeToken(tokenId: string) {
    const token = await this.prisma.token.update({
      where: { id: tokenId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Broadcast queue update
    await this.tokensGateway.broadcastQueueUpdate(token.serviceId);

    return token;
  }
}
