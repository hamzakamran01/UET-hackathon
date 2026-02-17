'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Activity, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import LineChart from '@/components/analytics/LineChart';
import AreaChart from '@/components/analytics/AreaChart';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import analyticsService from '@/lib/api/analytics';
import {
  TrendsResponse,
  DateRangePreset,
  AnalyticsQuery,
} from '@/types/analytics';

export default function TrendsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [query, setQuery] = useState<AnalyticsQuery>({
    preset: DateRangePreset.LAST_30_DAYS,
  });

  useEffect(() => {
    fetchTrends();
  }, [query]);

  const fetchTrends = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getTrends(query);
      setData(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatWaitTimeTrends = () => {
    if (!data?.waitTimeTrends) return [];

    return data.waitTimeTrends.map((trend) => ({
      time: new Date(trend.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      'Wait Time': Math.round(trend.averageWaitTime * 10) / 10,
      'Tokens': trend.tokenCount,
    }));
  };

  const formatQueueDepthTrends = () => {
    if (!data?.queueDepthTrends) return [];

    return data.queueDepthTrends.map((trend) => ({
      time: new Date(trend.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      'Active Tokens': trend.activeTokens,
    }));
  };

  const formatServiceTimeTrends = () => {
    if (!data?.serviceTimeTrends) return [];

    return data.serviceTimeTrends.map((trend) => ({
      time: new Date(trend.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      'Service Time': Math.round(trend.averageServiceTime * 10) / 10,
    }));
  };

  const formatCompletionRateTrends = () => {
    if (!data?.completionRateTrends) return [];

    return data.completionRateTrends.map((trend) => ({
      date: new Date(trend.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      'Completion Rate': Math.round(trend.completionRate * 10) / 10,
    }));
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-2 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            Queue Trends Analysis
          </h1>
          <p className="text-slate-400 mt-1 ml-8">Historical performance and pattern analysis</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker value={query} onChange={setQuery} />
        </div>
      </div>

      {/* Trend Analysis Cards */}
      {data?.analysis && data.analysis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.analysis.map((analysis, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <h3 className="text-sm font-medium text-slate-400 mb-2 uppercase tracking-wide">
                {analysis.metric}
              </h3>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-white">
                  {Math.round(analysis.currentValue * 10) / 10}
                </span>
                <div
                  className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded-full ${analysis.trend === 'up'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : analysis.trend === 'down'
                      ? 'text-rose-400 bg-rose-500/10'
                      : 'text-slate-400 bg-slate-500/10'
                    }`}
                >
                  {analysis.trend === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : analysis.trend === 'down' ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : null}
                  <span>
                    {Math.abs(Math.round(analysis.changePercentage * 10) / 10)}%
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 font-mono">
                Previous Period: {Math.round(analysis.previousValue * 10) / 10}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wait Time Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Average Wait Time Trend
          </h2>
          <AreaChart
            data={formatWaitTimeTrends()}
            xKey="time"
            yKeys={[
              { key: 'Wait Time', color: '#3b82f6', name: 'Wait Time (min)' },
            ]}
            height={320}
            yAxisLabel="Minutes"
          />
        </motion.div>

        {/* Queue Depth Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Queue Depth Over Time
          </h2>
          <AreaChart
            data={formatQueueDepthTrends()}
            xKey="time"
            yKeys={[
              { key: 'Active Tokens', color: '#10b981', name: 'Active Tokens' },
            ]}
            height={320}
            yAxisLabel="Tokens"
          />
        </motion.div>

        {/* Service Time Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            Average Service Time Trend
          </h2>
          <LineChart
            data={formatServiceTimeTrends()}
            xKey="time"
            yKeys={[
              { key: 'Service Time', color: '#f59e0b', name: 'Service Time (min)' },
            ]}
            height={320}
            yAxisLabel="Minutes"
          />
        </motion.div>

        {/* Completion Rate Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-500" />
            Completion Rate Trend
          </h2>
          <LineChart
            data={formatCompletionRateTrends()}
            xKey="date"
            yKeys={[
              { key: 'Completion Rate', color: '#8b5cf6', name: 'Completion Rate (%)' },
            ]}
            height={320}
            yAxisLabel="Percentage"
          />
        </motion.div>
      </div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-900/10 border border-blue-500/20 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Key Trend Insights
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3 text-slate-300 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
            <span>Monitor wait time trends to identify patterns and optimize resource allocation during peak periods.</span>
          </li>
          <li className="flex items-start gap-3 text-slate-300 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
            <span>Queue depth fluctuations directly correlate with staff demand; consider adjusting shifts accordingly.</span>
          </li>
          <li className="flex items-start gap-3 text-slate-300 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
            <span>A consistently high completion rate indicates efficient service delivery and low abandonment.</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
