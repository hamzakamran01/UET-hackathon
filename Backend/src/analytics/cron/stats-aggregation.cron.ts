import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, TokenStatus } from '@prisma/client';

@Injectable()
export class StatsAggregationCron {
  private readonly logger = new Logger(StatsAggregationCron.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs daily at midnight to aggregate previous day's statistics
   * Populates the QueueStatistics table for historical reporting
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async aggregateDailyStatistics() {
    this.logger.log('Starting daily statistics aggregation...');

    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);

      // Get all active services
      const services = await this.prisma.service.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      this.logger.log(`Aggregating statistics for ${services.length} services`);

      for (const service of services) {
        await this.aggregateServiceStatistics(
          service.id,
          yesterday,
          endOfYesterday,
        );
      }

      this.logger.log('Daily statistics aggregation completed successfully');
    } catch (error) {
      this.logger.error('Failed to aggregate daily statistics', error);
      throw error;
    }
  }

  /**
   * Aggregate statistics for a specific service and date
   */
  private async aggregateServiceStatistics(
    serviceId: string,
    startDate: Date,
    endDate: Date,
  ) {
    try {
      // Get token statistics
      const tokens = await this.prisma.token.findMany({
        where: {
          serviceId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          status: true,
          createdAt: true,
          calledAt: true,
          serviceStartedAt: true,
          completedAt: true,
          queuePosition: true,
        },
      });

      if (tokens.length === 0) {
        this.logger.debug(
          `No tokens found for service ${serviceId} on ${startDate.toISOString().split('T')[0]}`,
        );
        return;
      }

      // Calculate totals by status
      const totalTokensIssued = tokens.length;
      const totalTokensCompleted = tokens.filter(
        (t) => t.status === TokenStatus.COMPLETED,
      ).length;
      const totalTokensCancelled = tokens.filter(
        (t) => t.status === TokenStatus.CANCELLED,
      ).length;
      const totalNoShows = tokens.filter(
        (t) => t.status === TokenStatus.NO_SHOW,
      ).length;

      // Calculate average wait time (in seconds)
      const waitTimes = tokens
        .filter((t) => t.calledAt)
        .map(
          (t) =>
            (t.calledAt!.getTime() - t.createdAt.getTime()) / 1000,
        );

      const averageWaitTime =
        waitTimes.length > 0
          ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
          : 0;

      // Calculate average service time (in seconds)
      const serviceTimes = tokens
        .filter((t) => t.serviceStartedAt && t.completedAt)
        .map(
          (t) =>
            (t.completedAt!.getTime() - t.serviceStartedAt!.getTime()) / 1000,
        );

      const averageServiceTime =
        serviceTimes.length > 0
          ? serviceTimes.reduce((sum, time) => sum + time, 0) /
            serviceTimes.length
          : 0;

      // Find peak hour
      const hourlyDistribution = new Map<number, number>();
      tokens.forEach((t) => {
        const hour = t.createdAt.getHours();
        hourlyDistribution.set(hour, (hourlyDistribution.get(hour) || 0) + 1);
      });

      let peakHourStart = 0;
      let peakHourTokens = 0;
      hourlyDistribution.forEach((count, hour) => {
        if (count > peakHourTokens) {
          peakHourTokens = count;
          peakHourStart = hour;
        }
      });

      // Calculate queue length statistics
      // This is a simplified calculation - in production, you'd track this in real-time
      const queueLengths = tokens.map((t) => t.queuePosition || 0);
      const averageQueueLength =
        queueLengths.length > 0
          ? queueLengths.reduce((sum, pos) => sum + pos, 0) /
            queueLengths.length
          : 0;
      const maxQueueLength = Math.max(...queueLengths, 0);

      // Upsert statistics
      await this.prisma.queueStatistics.upsert({
        where: {
          date: startDate,
        },
        create: {
          serviceId,
          date: startDate,
          totalTokensIssued,
          totalTokensCompleted,
          totalTokensCancelled,
          totalNoShows,
          averageWaitTime,
          averageServiceTime,
          peakHourStart,
          peakHourTokens,
          averageQueueLength,
          maxQueueLength,
        },
        update: {
          totalTokensIssued,
          totalTokensCompleted,
          totalTokensCancelled,
          totalNoShows,
          averageWaitTime,
          averageServiceTime,
          peakHourStart,
          peakHourTokens,
          averageQueueLength,
          maxQueueLength,
          updatedAt: new Date(),
        },
      });

      this.logger.debug(
        `Aggregated statistics for service ${serviceId}: ${totalTokensIssued} tokens, peak hour: ${peakHourStart}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to aggregate statistics for service ${serviceId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Manual trigger for statistics aggregation (for backfilling or testing)
   * Can be called via admin API if needed
   */
  async manualAggregate(date: Date, serviceId?: string) {
    this.logger.log(
      `Manual aggregation triggered for date: ${date.toISOString()}, serviceId: ${serviceId || 'all'}`,
    );

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    if (serviceId) {
      await this.aggregateServiceStatistics(serviceId, startDate, endDate);
    } else {
      const services = await this.prisma.service.findMany({
        where: { isActive: true },
        select: { id: true },
      });

      for (const service of services) {
        await this.aggregateServiceStatistics(
          service.id,
          startDate,
          endDate,
        );
      }
    }

    this.logger.log('Manual aggregation completed');
  }

  /**
   * Backfill historical statistics
   * Use with caution - can be resource intensive
   */
  async backfillStatistics(startDate: Date, endDate: Date, serviceId?: string) {
    this.logger.warn(
      `Backfilling statistics from ${startDate.toISOString()} to ${endDate.toISOString()}`,
    );

    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      await this.manualAggregate(new Date(currentDate), serviceId);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    this.logger.log('Backfill completed');
  }
}
