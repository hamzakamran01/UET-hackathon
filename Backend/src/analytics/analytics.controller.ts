import {
  Controller,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import { Roles } from '../admin/guards/roles.decorator';
import { RolesGuard } from '../admin/guards/roles.guard';
import { AdminRole } from '@prisma/client';
import { AnalyticsQueryDto, DateRangePreset } from './dto/analytics-query.dto';
import {
  OverviewResponseDto,
  TrendsResponseDto,
  PeakHoursResponseDto,
  ServicePerformanceResponseDto,
  UserBehaviorResponseDto,
  ComplianceResponseDto,
} from './dto/analytics-response.dto';

@Controller('analytics')
@UseGuards(AdminJwtGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)

export class AnalyticsController {
  private readonly logger = new Logger(AnalyticsController.name);

  constructor(private readonly analyticsService: AnalyticsService) { }

  /**
   * GET /analytics/overview
   * Returns high-level KPIs and summary metrics
   */
  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getOverview(
    @Query() query: AnalyticsQueryDto,
  ): Promise<OverviewResponseDto> {
    this.logger.log(`Fetching overview analytics with query: ${JSON.stringify(query)}`);

    const [metrics, statusDistribution, recentTrends, topServices] =
      await Promise.all([
        this.analyticsService.getOverviewMetrics(query),
        this.analyticsService.getStatusDistribution(query),
        this.analyticsService.getWaitTimeTrends({
          ...query,
          preset: DateRangePreset.LAST_7_DAYS,
        }),
        this.analyticsService.getServicePerformance(query),
      ]);

    return {
      metrics,
      statusDistribution,
      recentTrends: recentTrends.slice(0, 24), // Last 24 hours
      topServices: topServices.slice(0, 5), // Top 5 services
      timestamp: new Date(),
    };
  }

  /**
   * GET /analytics/trends
   * Returns wait time, queue depth, and service time trends
   */
  @Get('trends')
  @HttpCode(HttpStatus.OK)
  async getTrends(
    @Query() query: AnalyticsQueryDto,
  ): Promise<TrendsResponseDto> {
    this.logger.log(`Fetching trend analytics with query: ${JSON.stringify(query)}`);

    const trendsData = await this.analyticsService.getTrendsChartData(query);

    const waitTimeTrends = trendsData.map((t) => ({
      timestamp: t.timestamp,
      averageWaitTime: t.averageWaitTime,
      tokenCount: t.tokenCount,
    }));

    // Derive Queue Depth using Little's Law: L = λW
    // Arrival Rate (λ) = tokenCount / Interval (1 hour or 24 hours)
    // Wait Time (W) = averageWaitTime (in hours)
    // But here, activeTokens is a snapshot.
    // A better approximation for "Active Tokens" trend is simply the token count for that period,
    // or we can use the "activeQueueDepth" metric if we had historical snapshots.
    // For now, we'll estimate it as: tokens that arrived * (wait time / duration of bucket)
    // If bucket is 1 hour (60 min) and wait time is 10 min, then roughly 10/60 of tokens are active at any point.
    const queueDepthTrends = trendsData.map((t) => ({
      timestamp: t.timestamp,
      activeTokens: Math.round(t.tokenCount * (t.averageWaitTime / 60)), // Simple Little's Law application
    }));

    const serviceTimeTrends = trendsData.map((t) => ({
      timestamp: t.timestamp,
      averageServiceTime: t.averageServiceTime,
      tokenCount: t.tokenCount,
    }));

    const completionRateTrends = trendsData.map((t) => ({
      date: t.timestamp,
      completionRate: t.tokenCount > 0 ? (t.completedCount / t.tokenCount) * 100 : 0,
      totalTokens: t.tokenCount,
    }));

    // Calculate Analysis
    const currentWaitTime = trendsData[trendsData.length - 1]?.averageWaitTime || 0;
    const previousWaitTime = trendsData[0]?.averageWaitTime || 0;

    const currentQueueDepth = queueDepthTrends[queueDepthTrends.length - 1]?.activeTokens || 0;
    const previousQueueDepth = queueDepthTrends[0]?.activeTokens || 0;

    const currentServiceTime = trendsData[trendsData.length - 1]?.averageServiceTime || 0;
    const previousServiceTime = trendsData[0]?.averageServiceTime || 0;

    return {
      waitTimeTrends,
      queueDepthTrends,
      serviceTimeTrends,
      completionRateTrends,
      analysis: [
        {
          metric: 'Average Wait Time',
          currentValue: currentWaitTime,
          previousValue: previousWaitTime,
          change: currentWaitTime - previousWaitTime,
          changePercentage: previousWaitTime > 0 ? ((currentWaitTime - previousWaitTime) / previousWaitTime) * 100 : 0,
          trend: currentWaitTime > previousWaitTime ? 'up' : currentWaitTime < previousWaitTime ? 'down' : 'neutral',
        },
        {
          metric: 'Queue Depth',
          currentValue: currentQueueDepth,
          previousValue: previousQueueDepth,
          change: currentQueueDepth - previousQueueDepth,
          changePercentage: previousQueueDepth > 0 ? ((currentQueueDepth - previousQueueDepth) / previousQueueDepth) * 100 : 0,
          trend: currentQueueDepth > previousQueueDepth ? 'up' : currentQueueDepth < previousQueueDepth ? 'down' : 'neutral',
        },
        {
          metric: 'Avg Service Time',
          currentValue: currentServiceTime,
          previousValue: previousServiceTime,
          change: currentServiceTime - previousServiceTime,
          changePercentage: previousServiceTime > 0 ? ((currentServiceTime - previousServiceTime) / previousServiceTime) * 100 : 0,
          trend: currentServiceTime > previousServiceTime ? 'up' : currentServiceTime < previousServiceTime ? 'down' : 'neutral',
        },
      ],
    };
  }

  /**
   * GET /analytics/peak-hours
   * Returns peak hour distribution and patterns
   */
  @Get('peak-hours')
  @HttpCode(HttpStatus.OK)
  async getPeakHours(
    @Query() query: AnalyticsQueryDto,
  ): Promise<PeakHoursResponseDto> {
    this.logger.log(`Fetching peak hours analytics with query: ${JSON.stringify(query)}`);

    const hourlyDistribution =
      await this.analyticsService.getPeakHourDistribution(query);

    // Find peak hour
    const peakHour = hourlyDistribution.reduce(
      (max, curr) => (curr.tokenCount > max.tokenCount ? curr : max),
      hourlyDistribution[0] || { hour: 12, tokenCount: 0, averageWaitTime: 0, averageServiceTime: 0, completionRate: 0 },
    );

    // Day of week distribution (placeholder - would need actual implementation)
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dailyDistribution = dayNames.map((name, index) => ({
      dayOfWeek: index,
      dayName: name,
      tokenCount: Math.floor(Math.random() * 100) + 50, // Placeholder
      averageWaitTime: 10 + Math.random() * 10, // Placeholder
    }));

    const recommendations: string[] = [];
    if (peakHour.tokenCount > 50) {
      recommendations.push(
        `Consider increasing staff during hour ${peakHour.hour}:00-${peakHour.hour + 1}:00 (peak volume: ${peakHour.tokenCount} tokens)`,
      );
    }
    if (peakHour.averageWaitTime > 20) {
      recommendations.push(
        `Average wait time of ${Math.round(peakHour.averageWaitTime)} minutes during peak hour exceeds target of 15 minutes`,
      );
    }

    return {
      hourlyDistribution,
      dailyDistribution,
      peakHour: peakHour.hour,
      peakDay: dailyDistribution.reduce((max, curr) =>
        curr.tokenCount > max.tokenCount ? curr : max,
      ).dayOfWeek,
      recommendations,
    };
  }

  /**
   * GET /analytics/service-performance
   * Returns service-level performance metrics
   */
  @Get('service-performance')
  @HttpCode(HttpStatus.OK)
  async getServicePerformance(
    @Query() query: AnalyticsQueryDto,
  ): Promise<ServicePerformanceResponseDto> {
    this.logger.log(
      `Fetching service performance analytics with query: ${JSON.stringify(query)}`,
    );

    const services = await this.analyticsService.getServicePerformance(query);

    if (services.length === 0) {
      return {
        services: [],
        comparison: {
          bestPerforming: null as any,
          worstPerforming: null as any,
        },
        averages: {
          averageWaitTime: 0,
          averageServiceTime: 0,
          averageCompletionRate: 0,
        },
      };
    }

    const bestPerforming = services.reduce((best, curr) =>
      curr.efficiencyScore > best.efficiencyScore ? curr : best,
    );

    const worstPerforming = services.reduce((worst, curr) =>
      curr.efficiencyScore < worst.efficiencyScore ? curr : worst,
    );

    const averages = {
      averageWaitTime:
        services.reduce((sum, s) => sum + s.averageWaitTime, 0) /
        services.length,
      averageServiceTime:
        services.reduce((sum, s) => sum + s.averageServiceTime, 0) /
        services.length,
      averageCompletionRate:
        services.reduce((sum, s) => sum + s.completionRate, 0) /
        services.length,
    };

    return {
      services,
      comparison: {
        bestPerforming,
        worstPerforming,
      },
      averages,
    };
  }

  /**
   * GET /analytics/user-behavior
   * Returns user behavior and engagement metrics
   */
  @Get('user-behavior')
  @HttpCode(HttpStatus.OK)
  async getUserBehavior(
    @Query() query: AnalyticsQueryDto,
  ): Promise<UserBehaviorResponseDto> {
    this.logger.log(
      `Fetching user behavior analytics with query: ${JSON.stringify(query)}`,
    );

    const metrics =
      await this.analyticsService.getUserBehaviorMetrics(query);

    // Placeholder for no-show trend (would need dedicated query)
    const noShowTrend = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      noShowCount: Math.floor(Math.random() * 10),
      noShowRate: Math.random() * 10,
    })).reverse();

    // Placeholder for cancellation reasons
    const cancellationReasons = [
      { reason: 'Long wait time', count: 45, percentage: 35 },
      { reason: 'Emergency', count: 30, percentage: 23 },
      { reason: 'Scheduling conflict', count: 25, percentage: 19 },
      { reason: 'Service unavailable', count: 20, percentage: 15 },
      { reason: 'Other', count: 10, percentage: 8 },
    ];

    // Placeholder for abuse events
    const abuseEvents = [
      {
        date: new Date(),
        eventType: 'NO_SHOW',
        count: 15,
        severity: 5,
      },
      {
        date: new Date(Date.now() - 24 * 60 * 60 * 1000),
        eventType: 'RAPID_CANCELLATION',
        count: 8,
        severity: 7,
      },
    ];

    return {
      metrics,
      noShowTrend,
      cancellationReasons,
      abuseEvents,
    };
  }

  /**
   * GET /analytics/compliance
   * Returns geofence compliance metrics
   */
  @Get('compliance')
  @HttpCode(HttpStatus.OK)
  async getCompliance(
    @Query() query: AnalyticsQueryDto,
  ): Promise<ComplianceResponseDto> {
    this.logger.log(
      `Fetching compliance analytics with query: ${JSON.stringify(query)}`,
    );

    const metrics = await this.analyticsService.getComplianceMetrics(query);

    // Placeholder for compliance trends
    const trends = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      complianceRate: 85 + Math.random() * 10,
      totalChecks: Math.floor(Math.random() * 100) + 50,
    })).reverse();

    // Distance distribution
    const distanceDistribution = [
      { range: '0-50m', count: 120, percentage: 60 },
      { range: '50-100m', count: 50, percentage: 25 },
      { range: '100-200m', count: 20, percentage: 10 },
      { range: '200m+', count: 10, percentage: 5 },
    ];

    return {
      metrics,
      trends,
      distanceDistribution,
    };
  }

  /**
   * POST /analytics/invalidate-cache
   * Invalidate analytics cache (admin only)
   */
  @Get('invalidate-cache')
  @Roles(AdminRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async invalidateCache(@Query('serviceId') serviceId?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    this.logger.log(`Invalidating analytics cache for serviceId: ${serviceId || 'all'}`);

    await this.analyticsService.invalidateCache(serviceId);

    return {
      success: true,
      message: serviceId
        ? `Cache invalidated for service ${serviceId}`
        : 'All analytics cache invalidated',
    };
  }
}
