export enum DateRangePreset {
  TODAY = 'TODAY',
  YESTERDAY = 'YESTERDAY',
  LAST_7_DAYS = 'LAST_7_DAYS',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  THIS_WEEK = 'THIS_WEEK',
  THIS_MONTH = 'THIS_MONTH',
  CUSTOM = 'CUSTOM',
}

export enum ExportFormat {
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  PDF = 'PDF',
  JSON = 'JSON',
}

export interface AnalyticsQuery {
  serviceId?: string;
  startDate?: string;
  endDate?: string;
  preset?: DateRangePreset;
}

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
  timestamp: Date | string;
  averageWaitTime: number;
  tokenCount: number;
  serviceId?: string;
  serviceName?: string;
}

export interface PeakHourData {
  hour: number;
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
  efficiencyScore: number;
}

export interface UserBehaviorMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  repeatUsers: number;
  userSegmentation: {
    oneTime: number;
    occasional: number;
    regular: number;
    frequent: number;
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

export interface TrendAnalysis {
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number;
  changePercentage: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface OverviewResponse {
  metrics: OverviewMetrics;
  statusDistribution: StatusDistribution[];
  recentTrends: WaitTimeTrend[];
  topServices: ServicePerformance[];
  timestamp: Date | string;
}

export interface TrendsResponse {
  waitTimeTrends: WaitTimeTrend[];
  queueDepthTrends: {
    timestamp: Date | string;
    activeTokens: number;
    serviceId?: string;
  }[];
  serviceTimeTrends: {
    timestamp: Date | string;
    averageServiceTime: number;
    tokenCount: number;
  }[];
  completionRateTrends: {
    date: Date | string;
    completionRate: number;
    totalTokens: number;
  }[];
  analysis: TrendAnalysis[];
}

export interface PeakHoursResponse {
  hourlyDistribution: PeakHourData[];
  dailyDistribution: {
    dayOfWeek: number;
    dayName: string;
    tokenCount: number;
    averageWaitTime: number;
  }[];
  peakHour: number;
  peakDay: number;
  recommendations: string[];
}

export interface ServicePerformanceResponse {
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

export interface UserBehaviorResponse {
  metrics: UserBehaviorMetrics;
  noShowTrend: {
    date: Date | string;
    noShowCount: number;
    noShowRate: number;
  }[];
  cancellationReasons: {
    reason: string;
    count: number;
    percentage: number;
  }[];
  abuseEvents: {
    date: Date | string;
    eventType: string;
    count: number;
    severity: number;
  }[];
}

export interface ComplianceResponse {
  metrics: ComplianceMetrics;
  trends: {
    date: Date | string;
    complianceRate: number;
    totalChecks: number;
  }[];
  distanceDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}
