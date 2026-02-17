import axios from 'axios';
import {
  AnalyticsQuery,
  OverviewResponse,
  TrendsResponse,
  PeakHoursResponse,
  ServicePerformanceResponse,
  UserBehaviorResponse,
  ComplianceResponse,
} from '@/types/analytics';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Create axios instance with auth interceptor
const analyticsApi = axios.create({
  baseURL: `${API_BASE_URL}/analytics`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add token to requests
analyticsApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    // Try multiple possible token keys
    const token = localStorage.getItem('adminAccessToken') ||
      localStorage.getItem('admin_token') ||
      localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for error logging
analyticsApi.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Build query string from analytics query params
 */
const buildQueryString = (query: AnalyticsQuery): string => {
  const params = new URLSearchParams();

  if (query.serviceId) params.append('serviceId', query.serviceId);
  if (query.startDate) params.append('startDate', query.startDate);
  if (query.endDate) params.append('endDate', query.endDate);
  if (query.preset) params.append('preset', query.preset);

  return params.toString();
};

/**
 * Analytics API Client
 */
export const analyticsService = {
  /**
   * Get overview metrics and KPIs
   */
  async getOverview(query: AnalyticsQuery = {}): Promise<OverviewResponse> {
    const queryString = buildQueryString(query);
    const response = await analyticsApi.get<OverviewResponse>(
      `/overview?${queryString}`,
    );
    return response.data;
  },

  /**
   * Get wait time and queue depth trends
   */
  async getTrends(query: AnalyticsQuery = {}): Promise<TrendsResponse> {
    const queryString = buildQueryString(query);
    const response = await analyticsApi.get<TrendsResponse>(
      `/trends?${queryString}`,
    );
    return response.data;
  },

  /**
   * Get peak hour distribution
   */
  async getPeakHours(query: AnalyticsQuery = {}): Promise<PeakHoursResponse> {
    const queryString = buildQueryString(query);
    const response = await analyticsApi.get<PeakHoursResponse>(
      `/peak-hours?${queryString}`,
    );
    return response.data;
  },

  /**
   * Get service performance metrics
   */
  async getServicePerformance(
    query: AnalyticsQuery = {},
  ): Promise<ServicePerformanceResponse> {
    const queryString = buildQueryString(query);
    const response = await analyticsApi.get<ServicePerformanceResponse>(
      `/service-performance?${queryString}`,
    );
    return response.data;
  },

  /**
   * Get user behavior analytics
   */
  async getUserBehavior(
    query: AnalyticsQuery = {},
  ): Promise<UserBehaviorResponse> {
    const queryString = buildQueryString(query);
    const response = await analyticsApi.get<UserBehaviorResponse>(
      `/user-behavior?${queryString}`,
    );
    return response.data;
  },

  /**
   * Get compliance metrics
   */
  async getCompliance(query: AnalyticsQuery = {}): Promise<ComplianceResponse> {
    const queryString = buildQueryString(query);
    const response = await analyticsApi.get<ComplianceResponse>(
      `/compliance?${queryString}`,
    );
    return response.data;
  },

  /**
   * Invalidate analytics cache (Super Admin only)
   */
  async invalidateCache(serviceId?: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const queryString = serviceId ? `?serviceId=${serviceId}` : '';
    const response = await analyticsApi.get(`/invalidate-cache${queryString}`);
    return response.data;
  },
};

export default analyticsService;
