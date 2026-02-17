export interface KPIMetric {
  label: string;
  value: number | string;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    comparisonPeriod: string;
  };
  status?: 'success' | 'warning' | 'danger' | 'info';
  target?: number;
}

export interface OverviewMetrics {
  activeQueueDepth: KPIMetric;
  averageWaitTime: KPIMetric;
  serviceLevel: KPIMetric;
  completionRate: KPIMetric;
  noShowRate: KPIMetric;
  averageServiceTime: KPIMetric;
  tokensToday: KPIMetric;
  totalUsers: KPIMetric;
}

export interface WaitTimeTrend {
  timestamp: Date;
  averageWaitTime: number; // minutes
  tokenCount: number;
  serviceId?: string;
  serviceName?: string;
}

export interface PeakHourData {
  hour: number; // 0-23
  tokenCount: number;
  averageWaitTime: number;
  averageServiceTime: number;
  completionRate: number;
}

export interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  totalTokens: number;
  completedTokens: number;
  noShowTokens: number;
  cancelledTokens: number;
  averageWaitTime: number;
  averageServiceTime: number;
  completionRate: number;
  noShowRate: number;
  capacityUtilization: number;
  efficiencyScore: number; // Custom calculated metric
}

export interface UserBehaviorMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  repeatUsers: number;
  userSegmentation: {
    oneTime: number;
    occasional: number; // 2-5 tokens
    regular: number; // 6-10 tokens
    frequent: number; // 10+ tokens
  };
  averageTokensPerUser: number;
  topNoShowUsers: {
    userId: string;
    tokenCount: number;
    noShowCount: number;
    noShowRate: number;
  }[];
}

export interface ComplianceMetrics {
  totalPresenceChecks: number;
  compliantChecks: number;
  nonCompliantChecks: number;
  complianceRate: number;
  averageDistanceMeters: number;
  byCheckType: {
    checkType: string;
    count: number;
    complianceRate: number;
  }[];
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface DailyAggregate {
  date: Date;
  serviceId?: string;
  serviceName?: string;
  totalTokensIssued: number;
  totalTokensCompleted: number;
  totalTokensCancelled: number;
  totalNoShows: number;
  averageWaitTime: number;
  averageServiceTime: number;
  peakHourStart: number;
  peakHourTokens: number;
  averageQueueLength: number;
  maxQueueLength: number;
}

export interface TrendAnalysis {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'neutral';
}

export class OverviewResponseDto {
  metrics: OverviewMetrics;
  statusDistribution: StatusDistribution[];
  recentTrends: WaitTimeTrend[];
  topServices: ServicePerformance[];
  timestamp: Date;
}

export class TrendsResponseDto {
  waitTimeTrends: WaitTimeTrend[];
  queueDepthTrends: {
    timestamp: Date;
    activeTokens: number;
    serviceId?: string;
  }[];
  serviceTimeTrends: {
    timestamp: Date;
    averageServiceTime: number;
    tokenCount: number;
  }[];
  completionRateTrends: {
    date: Date;
    completionRate: number;
    totalTokens: number;
  }[];
  analysis: TrendAnalysis[];
}

export class PeakHoursResponseDto {
  hourlyDistribution: PeakHourData[];
  dailyDistribution: {
    dayOfWeek: number; // 0-6 (Sunday-Saturday)
    dayName: string;
    tokenCount: number;
    averageWaitTime: number;
  }[];
  peakHour: number;
  peakDay: number;
  recommendations: string[];
}

export class ServicePerformanceResponseDto {
  services: ServicePerformance[];
  comparison: {
    bestPerforming: ServicePerformance;
    worstPerforming: ServicePerformance;
  };
  averages: {
    averageWaitTime: number;
    averageServiceTime: number;
    averageCompletionRate: number;
  };
}

export class UserBehaviorResponseDto {
  metrics: UserBehaviorMetrics;
  noShowTrend: {
    date: Date;
    noShowCount: number;
    noShowRate: number;
  }[];
  cancellationReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  abuseEvents: {
    date: Date;
    eventType: string;
    count: number;
    severity: number;
  }[];
}

export class ComplianceResponseDto {
  metrics: ComplianceMetrics;
  trends: {
    date: Date;
    complianceRate: number;
    totalChecks: number;
  }[];
  distanceDistribution: {
    range: string; // e.g., "0-50m", "50-100m"
    count: number;
    percentage: number;
  }[];
}

export class ExportResponseDto {
  success: boolean;
  filename: string;
  downloadUrl?: string;
  buffer?: Buffer;
  contentType: string;
}
