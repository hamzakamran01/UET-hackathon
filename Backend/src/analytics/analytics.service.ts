import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  AnalyticsQueryDto,
  DateRangePreset,
} from './dto/analytics-query.dto';
import {
  OverviewMetrics,
  WaitTimeTrend,
  PeakHourData,
  ServicePerformance,
  UserBehaviorMetrics,
  ComplianceMetrics,
  StatusDistribution,
  DailyAggregate,
  TrendAnalysis,
  KPIMetric,
} from './dto/analytics-response.dto';
import { Prisma, TokenStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) { }

  /**
   * Get date range from query parameters
   */
  private getDateRange(query: AnalyticsQueryDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(); // Don't mutate 'now'

    if (query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
    } else if (query.preset) {
      switch (query.preset) {
        case DateRangePreset.TODAY:
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case DateRangePreset.YESTERDAY:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setHours(23, 59, 59, 999);
          break;
        case DateRangePreset.LAST_7_DAYS:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case DateRangePreset.LAST_30_DAYS:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case DateRangePreset.LAST_90_DAYS:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case DateRangePreset.THIS_WEEK:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - startDate.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        case DateRangePreset.THIS_MONTH:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date();
          endDate.setHours(23, 59, 59, 999);
      }
    } else {
      // Default to last 7 days
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  /**
   * Generate cache key
   */
  private getCacheKey(
    prefix: string,
    query: AnalyticsQueryDto,
    suffix?: string,
  ): string {
    const { startDate, endDate } = this.getDateRange(query);
    const serviceId = query.serviceId || 'all';
    const key = `analytics:${prefix}:${serviceId}:${startDate.toISOString()}:${endDate.toISOString()}`;
    return suffix ? `${key}:${suffix}` : key;
  }

  /**
   * Get Overview Metrics (KPIs)
   */
  async getOverviewMetrics(query: AnalyticsQueryDto): Promise<OverviewMetrics> {
    const cacheKey = this.getCacheKey('overview', query);
    const cached = await this.cacheManager.get<OverviewMetrics>(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = this.getDateRange(query);
    const where: Prisma.TokenWhereInput = {
      createdAt: { gte: startDate, lte: endDate },
      ...(query.serviceId && { serviceId: query.serviceId }),
    };

    // Get previous period for trend comparison
    const periodDiff = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDiff);
    const prevEndDate = startDate;

    const prevWhere: Prisma.TokenWhereInput = {
      createdAt: { gte: prevStartDate, lt: prevEndDate },
      ...(query.serviceId && { serviceId: query.serviceId }),
    };

    // Parallel queries for performance
    const [
      activeQueueDepth,
      currentPeriodStats,
      previousPeriodStats,
      totalUsers,
    ] = await Promise.all([
      // Active queue depth (real-time)
      this.prisma.token.count({
        where: {
          status: { in: [TokenStatus.ACTIVE, TokenStatus.CALLED] },
          ...(query.serviceId && { serviceId: query.serviceId }),
        },
      }),

      // Current period statistics
      this.prisma.token.aggregate({
        where,
        _count: true,
        _avg: {
          estimatedWaitTime: true,
        },
      }),

      // Previous period statistics
      this.prisma.token.aggregate({
        where: prevWhere,
        _count: true,
      }),

      // Total users
      this.prisma.user.count(),
    ]);

    // Calculate wait times and service times
    const tokensWithTimes = await this.prisma.token.findMany({
      where: {
        ...where,
        calledAt: { not: null },
        completedAt: { not: null },
      },
      select: {
        createdAt: true,
        calledAt: true,
        serviceStartedAt: true,
        completedAt: true,
        status: true,
      },
    });

    const serviceTimes = tokensWithTimes
      .filter((t) => t.serviceStartedAt && t.completedAt)
      .map(
        (t) =>
          (t.completedAt!.getTime() - t.serviceStartedAt!.getTime()) /
          1000 /
          60,
      );

    const avgWaitTime =
      (currentPeriodStats._avg.estimatedWaitTime || 0) / 60; // Convert seconds to minutes

    const avgServiceTime =
      serviceTimes.length > 0
        ? serviceTimes.reduce((a, b) => a + b, 0) / serviceTimes.length
        : 0;

    // Count by status
    const statusCounts = await this.prisma.token.groupBy({
      by: ['status'],
      where,
      _count: true,
    });

    const totalTokens = currentPeriodStats._count;
    const completedCount =
      statusCounts.find((s) => s.status === TokenStatus.COMPLETED)?._count || 0;
    const noShowCount =
      statusCounts.find((s) => s.status === TokenStatus.NO_SHOW)?._count || 0;

    const completionRate = totalTokens > 0 ? (completedCount / totalTokens) * 100 : 0;
    const noShowRate = totalTokens > 0 ? (noShowCount / totalTokens) * 100 : 0;

    // Service level (% served within 15 minutes)
    // Note: We can't easily filter aggregated stats, so we'll use a simplified check or separate query if needed.
    // For now, we'll assume if avg wait time is low, service level is high.
    // Or we can fetch recent tokens to estimate.
    const recentTokens = await this.prisma.token.findMany({
      where: { ...where, estimatedWaitTime: { not: null } },
      select: { estimatedWaitTime: true },
      take: 100, // Sample size
    });
    const servedWithinTarget = recentTokens.filter((t) => (t.estimatedWaitTime || 0) / 60 <= 15).length;
    const serviceLevel = recentTokens.length > 0 ? (servedWithinTarget / recentTokens.length) * 100 : 0;

    // Calculate trends
    const tokenTrend = this.calculateTrend(totalTokens, previousPeriodStats._count);

    const metrics: OverviewMetrics = {
      activeQueueDepth: {
        label: 'Active Queue Depth',
        value: activeQueueDepth,
        unit: 'tokens',
        status: activeQueueDepth > 20 ? 'warning' : 'success',
        target: 20,
      },
      averageWaitTime: {
        label: 'Average Wait Time',
        value: Math.round(avgWaitTime * 10) / 10,
        unit: 'minutes',
        status: avgWaitTime > 15 ? 'warning' : 'success',
        target: 15,
      },
      serviceLevel: {
        label: 'Service Level',
        value: Math.round(serviceLevel * 10) / 10,
        unit: '%',
        status: serviceLevel >= 85 ? 'success' : serviceLevel >= 70 ? 'warning' : 'danger',
        target: 85,
      },
      completionRate: {
        label: 'Completion Rate',
        value: Math.round(completionRate * 10) / 10,
        unit: '%',
        status: completionRate >= 90 ? 'success' : completionRate >= 80 ? 'warning' : 'danger',
        target: 90,
      },
      noShowRate: {
        label: 'No-Show Rate',
        value: Math.round(noShowRate * 10) / 10,
        unit: '%',
        status: noShowRate <= 5 ? 'success' : noShowRate <= 10 ? 'warning' : 'danger',
        target: 5,
      },
      averageServiceTime: {
        label: 'Average Service Time',
        value: Math.round(avgServiceTime * 10) / 10,
        unit: 'minutes',
        status: avgServiceTime <= 10 ? 'success' : 'warning',
        target: 10,
      },
      tokensToday: {
        label: 'Tokens Today',
        value: totalTokens,
        unit: 'tokens',
        trend: tokenTrend,
      },
      totalUsers: {
        label: 'Total Users',
        value: totalUsers,
        unit: 'users',
      },
    };

    // Cache for 1 minute
    await this.cacheManager.set(cacheKey, metrics, 60000);

    return metrics;
  }

  /**
   * Get Wait Time Trends
   */
  async getWaitTimeTrends(query: AnalyticsQueryDto): Promise<WaitTimeTrend[]> {
    const cacheKey = this.getCacheKey('wait-time-trends', query);
    const cached = await this.cacheManager.get<WaitTimeTrend[]>(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = this.getDateRange(query);
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const truncInterval = durationHours > 24 ? Prisma.sql`'day'` : Prisma.sql`'hour'`;

    const result = await this.prisma.$queryRaw<
      {
        timestamp: Date;
        averageWaitTime: number;
        tokenCount: bigint;
        serviceId: string | null;
        serviceName: string | null;
      }[]
    >`
      SELECT
        DATE_TRUNC(${truncInterval}, t."createdAt") as timestamp,
        AVG(COALESCE(t."estimatedWaitTime" / 60, s."estimatedServiceTime" / 60, 0)) as "averageWaitTime",
        COUNT(*) as "tokenCount",
        ${query.serviceId ? Prisma.sql`t."serviceId"` : Prisma.sql`NULL`} as "serviceId",
        ${query.serviceId ? Prisma.sql`s."name"` : Prisma.sql`NULL`} as "serviceName"
      FROM "Token" t
      JOIN "Service" s ON t."serviceId" = s.id
      WHERE t."createdAt" >= ${startDate}
        AND t."createdAt" <= ${endDate}
        AND t."calledAt" IS NOT NULL
        ${query.serviceId ? Prisma.sql`AND t."serviceId" = ${query.serviceId}` : Prisma.empty}
      GROUP BY DATE_TRUNC(${truncInterval}, t."createdAt")${query.serviceId ? Prisma.sql`, t."serviceId", s."name"` : Prisma.empty}
      ORDER BY timestamp ASC
    `;

    const trends: WaitTimeTrend[] = result.map((r) => ({
      timestamp: r.timestamp,
      averageWaitTime: Number(r.averageWaitTime) || 0,
      tokenCount: Number(r.tokenCount),
      serviceId: r.serviceId || undefined,
      serviceName: r.serviceName || undefined,
    }));

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, trends, 300000);

    return trends;
  }

  /**
   * Get Trends Chart Data (Comprehensive)
   */
  async getTrendsChartData(query: AnalyticsQueryDto): Promise<{
    timestamp: Date;
    averageWaitTime: number;
    averageServiceTime: number;
    tokenCount: number;
    completedCount: number;
  }[]> {
    const cacheKey = this.getCacheKey('trends-chart-data', query);
    const cached = await this.cacheManager.get<any[]>(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = this.getDateRange(query);
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const truncInterval = durationHours > 24 ? Prisma.sql`'day'` : Prisma.sql`'hour'`;

    const result = await this.prisma.$queryRaw<
      {
        timestamp: Date;
        averageWaitTime: number;
        averageServiceTime: number;
        tokenCount: bigint;
        completedCount: bigint;
      }[]
    >`
      SELECT
        DATE_TRUNC(${truncInterval}, t."createdAt") as timestamp,
        AVG(COALESCE(t."estimatedWaitTime" / 60, s."estimatedServiceTime" / 60, 0)) as "averageWaitTime",
        AVG(CASE
          WHEN t."completedAt" IS NOT NULL AND t."serviceStartedAt" IS NOT NULL
          THEN EXTRACT(EPOCH FROM (t."completedAt" - t."serviceStartedAt")) / 60
          ELSE NULL
        END) as "averageServiceTime",
        COUNT(*) as "tokenCount",
        COUNT(*) FILTER (WHERE t.status = 'COMPLETED') as "completedCount"
      FROM "Token" t
      JOIN "Service" s ON t."serviceId" = s.id
      WHERE t."createdAt" >= ${startDate}
        AND t."createdAt" <= ${endDate}
        ${query.serviceId ? Prisma.sql`AND t."serviceId" = ${query.serviceId}` : Prisma.empty}
      GROUP BY DATE_TRUNC(${truncInterval}, t."createdAt")
      ORDER BY timestamp ASC
    `;

    const chartData = result.map((r) => ({
      timestamp: r.timestamp,
      averageWaitTime: Number(r.averageWaitTime) || 0,
      averageServiceTime: Number(r.averageServiceTime) || 0,
      tokenCount: Number(r.tokenCount),
      completedCount: Number(r.completedCount),
    }));

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, chartData, 300000);

    return chartData;
  }

  /**
   * Get Peak Hour Distribution
   */
  async getPeakHourDistribution(query: AnalyticsQueryDto): Promise<PeakHourData[]> {
    const cacheKey = this.getCacheKey('peak-hours', query);
    const cached = await this.cacheManager.get<PeakHourData[]>(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = this.getDateRange(query);

    const result = await this.prisma.$queryRaw<
      {
        hour: number;
        tokenCount: bigint;
        averageWaitTime: number;
        averageServiceTime: number;
        completedCount: bigint;
      }[]
    >`
      SELECT
        EXTRACT(HOUR FROM "createdAt") as hour,
        COUNT(*) as "tokenCount",
        AVG(CASE
          WHEN "estimatedWaitTime" IS NOT NULL
          THEN "estimatedWaitTime" / 60
          ELSE 0
        END) as "averageWaitTime",
        AVG(CASE
          WHEN "completedAt" IS NOT NULL AND "serviceStartedAt" IS NOT NULL
          THEN EXTRACT(EPOCH FROM ("completedAt" - "serviceStartedAt")) / 60
          ELSE NULL
        END) as "averageServiceTime",
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as "completedCount"
      FROM "Token"
      WHERE "createdAt" >= ${startDate}
        AND "createdAt" <= ${endDate}
        ${query.serviceId ? Prisma.sql`AND "serviceId" = ${query.serviceId}` : Prisma.empty}
      GROUP BY EXTRACT(HOUR FROM "createdAt")
      ORDER BY hour ASC
    `;

    const peakHours: PeakHourData[] = result.map((r) => ({
      hour: Number(r.hour),
      tokenCount: Number(r.tokenCount),
      averageWaitTime: Number(r.averageWaitTime) || 0,
      averageServiceTime: Number(r.averageServiceTime) || 0,
      completionRate:
        Number(r.tokenCount) > 0
          ? (Number(r.completedCount) / Number(r.tokenCount)) * 100
          : 0,
    }));

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, peakHours, 600000);

    return peakHours;
  }

  /**
   * Get Service Performance Metrics
   */
  async getServicePerformance(
    query: AnalyticsQueryDto,
  ): Promise<ServicePerformance[]> {
    const cacheKey = this.getCacheKey('service-performance', query);
    const cached = await this.cacheManager.get<ServicePerformance[]>(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = this.getDateRange(query);

    const result = await this.prisma.$queryRaw<
      {
        serviceId: string;
        serviceName: string;
        totalTokens: bigint;
        completedTokens: bigint;
        noShowTokens: bigint;
        cancelledTokens: bigint;
        averageWaitTime: number;
        averageServiceTime: number;
        maxConcurrentTokens: number;
        activeTokens: bigint;
      }[]
    >`
      SELECT
        s.id as "serviceId",
        s.name as "serviceName",
        COUNT(t.id) as "totalTokens",
        COUNT(*) FILTER (WHERE t.status = 'COMPLETED') as "completedTokens",
        COUNT(*) FILTER (WHERE t.status = 'NO_SHOW') as "noShowTokens",
        COUNT(*) FILTER (WHERE t.status = 'CANCELLED') as "cancelledTokens",
        AVG(COALESCE(t."estimatedWaitTime" / 60, s."estimatedServiceTime" / 60, 0)) as "averageWaitTime",
        AVG(CASE
          WHEN t."completedAt" IS NOT NULL AND t."serviceStartedAt" IS NOT NULL
          THEN EXTRACT(EPOCH FROM (t."completedAt" - t."serviceStartedAt")) / 60
          ELSE NULL
        END) as "averageServiceTime",
        s."maxConcurrentTokens",
        COUNT(*) FILTER (WHERE t.status IN ('ACTIVE', 'CALLED', 'IN_SERVICE')) as "activeTokens"
      FROM "Service" s
      LEFT JOIN "Token" t ON s.id = t."serviceId"
        AND t."createdAt" >= ${startDate}
        AND t."createdAt" <= ${endDate}
      WHERE s."isActive" = true
        ${query.serviceId ? Prisma.sql`AND s.id = ${query.serviceId}` : Prisma.empty}
      GROUP BY s.id, s.name, s."maxConcurrentTokens"
      ORDER BY "totalTokens" DESC
    `;

    const performance: ServicePerformance[] = result.map((r) => {
      const totalTokens = Number(r.totalTokens);
      const completedTokens = Number(r.completedTokens);
      const noShowTokens = Number(r.noShowTokens);
      const completionRate =
        totalTokens > 0 ? (completedTokens / totalTokens) * 100 : 0;
      const noShowRate = totalTokens > 0 ? (noShowTokens / totalTokens) * 100 : 0;
      const capacityUtilization =
        r.maxConcurrentTokens > 0
          ? (Number(r.activeTokens) / r.maxConcurrentTokens) * 100
          : 0;

      // Efficiency score (custom metric: 0-100)
      // Based on completion rate (40%), low wait time (30%), low no-show (30%)
      const waitTimeScore = Math.max(
        0,
        100 - (Number(r.averageWaitTime) || 0) * 2,
      );
      const efficiencyScore =
        completionRate * 0.4 +
        waitTimeScore * 0.3 +
        (100 - noShowRate) * 0.3;

      return {
        serviceId: r.serviceId,
        serviceName: r.serviceName,
        totalTokens,
        completedTokens,
        noShowTokens,
        cancelledTokens: Number(r.cancelledTokens),
        averageWaitTime: Number(r.averageWaitTime) || 0,
        averageServiceTime: Number(r.averageServiceTime) || 0,
        completionRate: Math.round(completionRate * 10) / 10,
        noShowRate: Math.round(noShowRate * 10) / 10,
        capacityUtilization: Math.round(capacityUtilization * 10) / 10,
        efficiencyScore: Math.round(efficiencyScore * 10) / 10,
      };
    });

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, performance, 300000);

    return performance;
  }

  /**
   * Get User Behavior Metrics
   */
  async getUserBehaviorMetrics(
    query: AnalyticsQueryDto,
  ): Promise<UserBehaviorMetrics> {
    const cacheKey = this.getCacheKey('user-behavior', query);
    const cached = await this.cacheManager.get<UserBehaviorMetrics>(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = this.getDateRange(query);

    // User segmentation
    const userSegmentation = await this.prisma.$queryRaw<
      { segment: string; userCount: bigint }[]
    >`
      SELECT
        CASE
          WHEN token_count = 1 THEN 'oneTime'
          WHEN token_count BETWEEN 2 AND 5 THEN 'occasional'
          WHEN token_count BETWEEN 6 AND 10 THEN 'regular'
          ELSE 'frequent'
        END as segment,
        COUNT(*) as "userCount"
      FROM (
        SELECT "userId", COUNT(*) as token_count
        FROM "Token"
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
          ${query.serviceId ? Prisma.sql`AND "serviceId" = ${query.serviceId}` : Prisma.empty}
        GROUP BY "userId"
      ) as user_tokens
      GROUP BY segment
    `;

    // Top no-show users
    const topNoShowUsers = await this.prisma.$queryRaw<
      {
        userId: string;
        tokenCount: bigint;
        noShowCount: bigint;
      }[]
    >`
      SELECT
        "userId",
        COUNT(*) as "tokenCount",
        COUNT(*) FILTER (WHERE status = 'NO_SHOW') as "noShowCount"
      FROM "Token"
      WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        ${query.serviceId ? Prisma.sql`AND "serviceId" = ${query.serviceId}` : Prisma.empty}
      GROUP BY "userId"
      HAVING COUNT(*) FILTER (WHERE status = 'NO_SHOW') > 0
      ORDER BY "noShowCount" DESC
      LIMIT 10
    `;

    // Total statistics
    const totalUsers = await this.prisma.user.count();
    const activeUsers = await this.prisma.token.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(query.serviceId && { serviceId: query.serviceId }),
      },
    });

    const avgTokensPerUser = activeUsers.length > 0
      ? (await this.prisma.token.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          ...(query.serviceId && { serviceId: query.serviceId }),
        },
      })) / activeUsers.length
      : 0;

    const segmentation = {
      oneTime: Number(
        userSegmentation.find((s) => s.segment === 'oneTime')?.userCount || 0,
      ),
      occasional: Number(
        userSegmentation.find((s) => s.segment === 'occasional')?.userCount || 0,
      ),
      regular: Number(
        userSegmentation.find((s) => s.segment === 'regular')?.userCount || 0,
      ),
      frequent: Number(
        userSegmentation.find((s) => s.segment === 'frequent')?.userCount || 0,
      ),
    };

    const metrics: UserBehaviorMetrics = {
      totalUsers,
      activeUsers: activeUsers.length,
      newUsers: 0, // Would need user creation date
      repeatUsers: segmentation.occasional + segmentation.regular + segmentation.frequent,
      userSegmentation: segmentation,
      averageTokensPerUser: Math.round(avgTokensPerUser * 10) / 10,
      topNoShowUsers: topNoShowUsers.map((u) => ({
        userId: u.userId,
        tokenCount: Number(u.tokenCount),
        noShowCount: Number(u.noShowCount),
        noShowRate:
          (Number(u.noShowCount) / Number(u.tokenCount)) * 100,
      })),
    };

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, metrics, 600000);

    return metrics;
  }

  /**
   * Get Compliance Metrics
   */
  async getComplianceMetrics(
    query: AnalyticsQueryDto,
  ): Promise<ComplianceMetrics> {
    const cacheKey = this.getCacheKey('compliance', query);
    const cached = await this.cacheManager.get<ComplianceMetrics>(cacheKey);
    if (cached) return cached;

    const { startDate, endDate } = this.getDateRange(query);

    const result = await this.prisma.$queryRaw<
      {
        totalChecks: bigint;
        compliantChecks: bigint;
        avgDistance: number;
        checkType: string;
        checkTypeCount: bigint;
        checkTypeCompliant: bigint;
      }[]
    >`
      SELECT
        COUNT(*) as "totalChecks",
        COUNT(*) FILTER (WHERE "isWithinGeofence" = true) as "compliantChecks",
        AVG("distanceMeters") as "avgDistance",
        "checkType",
        COUNT(*) as "checkTypeCount",
        COUNT(*) FILTER (WHERE "isWithinGeofence" = true) as "checkTypeCompliant"
      FROM "PresenceCheck" pc
      ${query.serviceId ? Prisma.sql`JOIN "Token" t ON pc."tokenId" = t.id` : Prisma.empty}
      WHERE pc."checkedAt" >= ${startDate} AND pc."checkedAt" <= ${endDate}
        ${query.serviceId ? Prisma.sql`AND t."serviceId" = ${query.serviceId}` : Prisma.empty}
      GROUP BY "checkType"
    `;

    const totalChecks = result.reduce((sum, r) => sum + Number(r.checkTypeCount), 0);
    const compliantChecks = result.reduce(
      (sum, r) => sum + Number(r.checkTypeCompliant),
      0,
    );

    const metrics: ComplianceMetrics = {
      totalPresenceChecks: totalChecks,
      compliantChecks,
      nonCompliantChecks: totalChecks - compliantChecks,
      complianceRate: totalChecks > 0 ? (compliantChecks / totalChecks) * 100 : 0,
      averageDistanceMeters:
        result.length > 0
          ? result.reduce((sum, r) => sum + Number(r.avgDistance || 0), 0) /
          result.length
          : 0,
      byCheckType: result.map((r) => ({
        checkType: r.checkType,
        count: Number(r.checkTypeCount),
        complianceRate:
          Number(r.checkTypeCount) > 0
            ? (Number(r.checkTypeCompliant) / Number(r.checkTypeCount)) * 100
            : 0,
      })),
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, metrics, 300000);

    return metrics;
  }

  /**
   * Get Status Distribution
   */
  async getStatusDistribution(
    query: AnalyticsQueryDto,
  ): Promise<StatusDistribution[]> {
    const { startDate, endDate } = this.getDateRange(query);

    const statusCounts = await this.prisma.token.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        ...(query.serviceId && { serviceId: query.serviceId }),
      },
      _count: true,
    });

    const total = statusCounts.reduce((sum, s) => sum + s._count, 0);

    return statusCounts.map((s) => ({
      status: s.status,
      count: s._count,
      percentage: total > 0 ? (s._count / total) * 100 : 0,
    }));
  }

  /**
   * Calculate trend (comparison with previous period)
   */
  private calculateTrend(
    current: number,
    previous: number,
  ): KPIMetric['trend'] {
    if (previous === 0) {
      return {
        direction: 'neutral',
        percentage: 0,
        comparisonPeriod: 'previous period',
      };
    }

    const change = current - previous;
    const percentage = Math.abs((change / previous) * 100);

    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.round(percentage * 10) / 10,
      comparisonPeriod: 'previous period',
    };
  }

  /**
   * Invalidate cache for analytics
   */
  async invalidateCache(serviceId?: string): Promise<void> {
    const pattern = serviceId
      ? `analytics:*:${serviceId}:*`
      : 'analytics:*';

    // Note: This is a simplified version. In production, use Redis SCAN for pattern deletion
    this.logger.log(`Cache invalidation requested for pattern: ${pattern}`);
    // Cache invalidation note: cache-manager v7 doesn't expose a direct reset/clear method
    // In production, implement pattern-based deletion with Redis SCAN or use del method per key
  }
}
