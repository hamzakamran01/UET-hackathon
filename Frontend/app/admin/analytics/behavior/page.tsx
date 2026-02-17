'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, UserX, AlertCircle, UserCheck, Activity, PieChart as PieChartIcon, Ban, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import PieChart from '@/components/analytics/PieChart';
import BarChart from '@/components/analytics/BarChart';
import LineChart from '@/components/analytics/LineChart';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import analyticsService from '@/lib/api/analytics';
import {
  UserBehaviorResponse,
  DateRangePreset,
  AnalyticsQuery,
} from '@/types/analytics';

export default function UserBehaviorPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserBehaviorResponse | null>(null);
  const [query, setQuery] = useState<AnalyticsQuery>({
    preset: DateRangePreset.LAST_30_DAYS,
  });

  useEffect(() => {
    fetchBehavior();
  }, [query]);

  const fetchBehavior = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getUserBehavior(query);
      setData(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatSegmentationData = () => {
    if (!data?.metrics.userSegmentation) return [];

    const { userSegmentation } = data.metrics;
    return [
      { name: 'One-time Users', value: userSegmentation.oneTime, fill: '#3b82f6' },
      { name: 'Occasional Users', value: userSegmentation.occasional, fill: '#10b981' },
      { name: 'Regular Users', value: userSegmentation.regular, fill: '#f59e0b' },
      { name: 'Frequent Users', value: userSegmentation.frequent, fill: '#8b5cf6' },
    ];
  };

  const formatNoShowTrend = () => {
    if (!data?.noShowTrend) return [];

    return data.noShowTrend.map((trend) => ({
      date: new Date(trend.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      'No-Shows': trend.noShowCount,
      'Rate (%)': Math.round(trend.noShowRate * 10) / 10,
    }));
  };

  const formatCancellationReasons = () => {
    if (!data?.cancellationReasons) return [];

    return data.cancellationReasons.map((reason) => ({
      reason: reason.reason,
      count: reason.count,
    }));
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
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
            <Users className="w-6 h-6 text-amber-500" />
            User Behavior Analytics
          </h1>
          <p className="text-slate-400 mt-1 ml-8">Understand user patterns and engagement metrics</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker value={query} onChange={setQuery} />
        </div>
      </div>

      {/* User Metrics Summary */}
      {data?.metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/50 transition-colors"
          >
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Users className="w-24 h-24 text-blue-400" />
            </div>
            <div className="relative z-10">
              <div className="p-2 bg-blue-500/10 rounded-lg w-fit mb-3">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <p className="text-sm text-slate-400 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-white">
                {data.metrics.totalUsers}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-emerald-500/50 transition-colors"
          >
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserCheck className="w-24 h-24 text-emerald-400" />
            </div>
            <div className="relative z-10">
              <div className="p-2 bg-emerald-500/10 rounded-lg w-fit mb-3">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-400 mb-1">Active Users</p>
              <p className="text-3xl font-bold text-white">
                {data.metrics.activeUsers}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-colors"
          >
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Activity className="w-24 h-24 text-purple-400" />
            </div>
            <div className="relative z-10">
              <div className="p-2 bg-purple-500/10 rounded-lg w-fit mb-3">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-sm text-slate-400 mb-1">Repeat Users</p>
              <p className="text-3xl font-bold text-white">
                {data.metrics.repeatUsers}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-amber-500/50 transition-colors"
          >
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <UserX className="w-24 h-24 text-amber-400" />
            </div>
            <div className="relative z-10">
              <div className="p-2 bg-amber-500/10 rounded-lg w-fit mb-3">
                <UserX className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm text-slate-400 mb-1">Avg Tokens/User</p>
              <p className="text-3xl font-bold text-white">
                {data.metrics.averageTokensPerUser}
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Segmentation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-blue-500" />
            User Segmentation
          </h2>
          <PieChart
            data={formatSegmentationData()}
            dataKey="value"
            nameKey="name"
            colors={formatSegmentationData().map((d) => d.fill)}
            height={350}
            innerRadius={70}
          />
          <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            {formatSegmentationData().map((segment) => (
              <div key={segment.name} className="flex items-center gap-2 p-2 bg-slate-950/50 rounded-lg border border-slate-800/50">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: segment.fill }}
                />
                <span className="text-slate-300 font-medium">
                  {segment.name}: {segment.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cancellation Reasons */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <UserX className="w-5 h-5 text-rose-500" />
            Top Cancellation Reasons
          </h2>
          <BarChart
            data={formatCancellationReasons()}
            xKey="reason"
            yKeys={[
              { key: 'count', color: '#ef4444', name: 'Cancellations' },
            ]}
            height={350}
            layout="horizontal"
          />
        </motion.div>

        {/* No-Show Trend */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 lg:col-span-2"
        >
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            No-Show Trend Analysis
          </h2>
          <LineChart
            data={formatNoShowTrend()}
            xKey="date"
            yKeys={[
              { key: 'No-Shows', color: '#ef4444', name: 'No-Show Count' },
              { key: 'Rate (%)', color: '#f59e0b', name: 'No-Show Rate (%)' },
            ]}
            height={350}
          />
        </motion.div>
      </div>

      {/* Top No-Show Users */}
      {data?.metrics.topNoShowUsers && data.metrics.topNoShowUsers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-white">
              Users with High No-Show Rates
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    User ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total Tokens
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    No-Shows
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    No-Show Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.metrics.topNoShowUsers.map((user, index) => (
                  <tr key={index} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-mono text-white">
                      {user.userId.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {user.tokenCount}
                    </td>
                    <td className="px-6 py-4 text-sm text-rose-400 font-bold">
                      {user.noShowCount}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${user.noShowRate <= 10
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : user.noShowRate <= 25
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                      >
                        {Math.round(user.noShowRate * 10) / 10}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase flex items-center w-fit gap-1.5 ${user.noShowRate > 50
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                      >
                        {user.noShowRate > 50 ? <ShieldAlert className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {user.noShowRate > 50 ? 'Critical' : 'Monitor'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Abuse Events */}
      {data?.abuseEvents && data.abuseEvents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Ban className="w-5 h-5 text-rose-500" />
            Recent Abuse Events
          </h2>
          <div className="space-y-3">
            {data.abuseEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-3 h-3 rounded-full ${event.severity >= 7
                      ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                      : event.severity >= 4
                        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                      }`}
                  />
                  <div>
                    <p className="font-semibold text-white capitalize">
                      {event.eventType.replace('_', ' ').toLowerCase()}
                    </p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-slate-400">
                    Count: <span className="font-bold text-white">{event.count}</span>
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase border ${event.severity >= 7
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : event.severity >= 4
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}
                  >
                    Severity: {event.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5" />
        <div className="relative z-10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Actionable Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2" />
                <span className="text-slate-400 text-sm">Users with high no-show rates may benefit from reminder notifications or deposit requirements.</span>
              </div>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
                <span className="text-slate-400 text-sm">Track detailed cancellation reasons to identify service gaps and improve overall quality.</span>
              </div>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/50">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2" />
                <span className="text-slate-400 text-sm">Engage one-time users with targeted loyalty incentives to increase retention and repeat visits.</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
