'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  Target,
  Award,
  PieChart,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import KPICard from '@/components/analytics/KPICard';
import EnhancedLineChart from '@/components/analytics/EnhancedLineChart';
import EnhancedPieChart from '@/components/analytics/EnhancedPieChart';
import EnhancedBarChart from '@/components/analytics/EnhancedBarChart';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import analyticsService from '@/lib/api/analytics';
import {
  OverviewResponse,
  DateRangePreset,
  AnalyticsQuery,
} from '@/types/analytics';
import Link from 'next/link';

export default function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [query, setQuery] = useState<AnalyticsQuery>({
    preset: DateRangePreset.LAST_7_DAYS,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, [query]);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await analyticsService.getOverview(query);

      setData(response);
    } catch (err: any) {
      let errorMsg = err.response?.data?.message || err.message || 'Failed to load analytics data';

      if (err.code === 'ECONNREFUSED' || err.code === 'ERR_NETWORK') {
        errorMsg = 'Cannot connect to backend server. Please ensure it is running on http://localhost:4000';
      } else if (err.response?.status === 401) {
        errorMsg = 'Authentication failed. Please login again.';
      } else if (err.response?.status === 403) {
        errorMsg = 'Access denied. You do not have permission to view analytics.';
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatChartData = () => {
    if (!data?.recentTrends) return [];

    return data.recentTrends.map((trend) => {
      const date = new Date(trend.timestamp);
      return {
        time: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
        }),
        'Wait Time': Math.round(trend.averageWaitTime * 10) / 10,
        'Tokens': trend.tokenCount,
      };
    });
  };

  const formatStatusDistribution = () => {
    if (!data?.statusDistribution) return [];

    const statusColors: { [key: string]: string } = {
      COMPLETED: '#10b981',
      ACTIVE: '#3b82f6',
      CALLED: '#8b5cf6',
      IN_SERVICE: '#f59e0b',
      CANCELLED: '#ef4444',
      NO_SHOW: '#dc2626',
      EXPIRED: '#6b7280',
    };

    return data.statusDistribution.map((status) => ({
      name: status.status.replace('_', ' '),
      value: status.count,
      percentage: status.percentage,
      fill: statusColors[status.status] || '#6b7280',
    }));
  };

  const formatServiceData = () => {
    if (!data?.topServices) return [];

    return data.topServices.map((service) => ({
      name: service.serviceName.substring(0, 20) + (service.serviceName.length > 20 ? '...' : ''),
      'Tokens': service.totalTokens,
      'Completed': service.completedTokens,
      'No-Shows': service.noShowTokens,
    }));
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading Analytics...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-2xl mx-auto"
        >
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Analytics Unavailable</h3>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => fetchAnalytics()}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-semibold"
          >
            Retry Loading
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <PieChart className="w-8 h-8 text-blue-500" />
            Analytics Dashboard
          </h1>
          <p className="text-slate-400 mt-1 ml-11">Real-time insights and performance metrics</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <DateRangePicker value={query} onChange={setQuery} />

          <div className="flex gap-2">
            <button
              onClick={() => fetchAnalytics(true)}
              disabled={refreshing}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors disabled:opacity-50"
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 font-medium"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: '/admin/analytics/trends', icon: TrendingUp, title: 'Trends', desc: 'Historical analysis', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { href: '/admin/analytics/peak-hours', icon: Clock, title: 'Peak Hours', desc: 'Busy periods', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          { href: '/admin/analytics/performance', icon: Award, title: 'Performance', desc: 'Service metrics', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { href: '/admin/analytics/behavior', icon: Users, title: 'Behavior', desc: 'User patterns', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        ].map((link, index) => (
          <Link key={index} href={link.href}>
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`p-5 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-3 rounded-xl ${link.bg} ${link.border} border`}>
                  <link.icon className={`w-6 h-6 ${link.color}`} />
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 transition-colors -rotate-45 group-hover:rotate-0" />
              </div>
              <h3 className="text-white font-bold text-lg">{link.title}</h3>
              <p className="text-slate-500 text-sm mt-1">{link.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      {data?.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard metric={data.metrics.activeQueueDepth} icon={Activity} colorScheme="blue" />
          <KPICard metric={data.metrics.averageWaitTime} icon={Clock} colorScheme="purple" />
          <KPICard metric={data.metrics.serviceLevel} icon={Target} colorScheme="green" />
          <KPICard metric={data.metrics.completionRate} icon={CheckCircle} colorScheme="green" />
          <KPICard metric={data.metrics.noShowRate} icon={XCircle} colorScheme="red" />
          <KPICard metric={data.metrics.averageServiceTime} icon={Clock} colorScheme="yellow" />
          <KPICard metric={data.metrics.tokensToday} icon={BarChart3} colorScheme="blue" />
          <KPICard metric={data.metrics.totalUsers} icon={Users} colorScheme="purple" />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wait Time Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                Wait Time Analysis
              </h2>
              <p className="text-slate-500 text-sm mt-1">24-hour performance trend</p>
            </div>
          </div>
          <EnhancedLineChart
            data={formatChartData()}
            xKey="time"
            yKeys={[
              { key: 'Wait Time', color: '#3b82f6', name: 'Avg Wait Time (min)', gradient: true },
            ]}
            height={300}
            showGradient={true}
          />
        </motion.div>

        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-purple-400" />
                Token Distribution
              </h2>
              <p className="text-slate-500 text-sm mt-1">Status breakdown</p>
            </div>
          </div>
          <EnhancedPieChart
            data={formatStatusDistribution()}
            dataKey="value"
            nameKey="name"
            colors={formatStatusDistribution().map((d) => d.fill)}
            height={300}
            innerRadius={80}
            animate={true}
          />
        </motion.div>

        {/* Service Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-xl lg:col-span-2"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                Service Performance
              </h2>
              <p className="text-slate-500 text-sm mt-1">Top services by volume and completion</p>
            </div>
          </div>
          <EnhancedBarChart
            data={formatServiceData()}
            xKey="name"
            yKeys={[
              { key: 'Tokens', color: '#3b82f6', name: 'Total Tokens' },
              { key: 'Completed', color: '#10b981', name: 'Completed' },
              { key: 'No-Shows', color: '#ef4444', name: 'No-Shows' },
            ]}
            height={320}
            showValues={false}
            stackedBars={false}
          />
        </motion.div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8 border-t border-slate-800/50">
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span>Last updated: {data?.timestamp ? new Date(data.timestamp).toLocaleString() : 'Just now'}</span>
        </div>
      </div>
    </div>
  );
}
