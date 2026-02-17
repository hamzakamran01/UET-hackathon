'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Award, TrendingDown, Clock, CheckCircle, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import BarChart from '@/components/analytics/BarChart';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import analyticsService from '@/lib/api/analytics';
import {
  ServicePerformanceResponse,
  DateRangePreset,
  AnalyticsQuery,
} from '@/types/analytics';

export default function ServicePerformancePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ServicePerformanceResponse | null>(null);
  const [query, setQuery] = useState<AnalyticsQuery>({
    preset: DateRangePreset.LAST_30_DAYS,
  });

  useEffect(() => {
    fetchPerformance();
  }, [query]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getServicePerformance(query);
      setData(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatComparisonData = () => {
    if (!data?.services) return [];

    return data.services.map((service) => ({
      name: service.serviceName.substring(0, 20),
      'Efficiency Score': service.efficiencyScore,
      'Completion Rate': service.completionRate,
      'Wait Time': Math.round(service.averageWaitTime * 10) / 10,
    }));
  };

  const formatVolumeData = () => {
    if (!data?.services) return [];

    return data.services.map((service) => ({
      name: service.serviceName.substring(0, 20),
      'Total': service.totalTokens,
      'Completed': service.completedTokens,
      'No-Shows': service.noShowTokens,
    }));
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
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
            <Award className="w-6 h-6 text-emerald-500" />
            Service Performance
          </h1>
          <p className="text-slate-400 mt-1 ml-8">Compare and analyze service metrics and efficiency</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker value={query} onChange={setQuery} />
        </div>
      </div>

      {/* Best/Worst Performers */}
      {data?.comparison && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-900/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 p-4 opacity-5">
              <Award className="w-32 h-32 text-emerald-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Award className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Best Performing Service
                </h3>
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-bold text-emerald-400 truncate pr-10">
                  {data.comparison.bestPerforming.serviceName}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm bg-emerald-950/30 p-3 rounded-lg border border-emerald-900/50">
                  <div>
                    <p className="text-emerald-200/60 font-medium text-xs uppercase mb-1">Efficiency Score</p>
                    <p className="text-xl font-bold text-white">
                      {data.comparison.bestPerforming.efficiencyScore}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-emerald-200/60 font-medium text-xs uppercase mb-1">Completion Rate</p>
                    <p className="text-xl font-bold text-white">
                      {data.comparison.bestPerforming.completionRate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-rose-900/10 border border-rose-500/20 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 p-4 opacity-5">
              <TrendingDown className="w-32 h-32 text-rose-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-rose-500/10 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-rose-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Needs Improvement
                </h3>
              </div>
              <div className="space-y-4">
                <h4 className="text-2xl font-bold text-rose-400 truncate pr-10">
                  {data.comparison.worstPerforming.serviceName}
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm bg-rose-950/30 p-3 rounded-lg border border-rose-900/50">
                  <div>
                    <p className="text-rose-200/60 font-medium text-xs uppercase mb-1">Efficiency Score</p>
                    <p className="text-xl font-bold text-white">
                      {data.comparison.worstPerforming.efficiencyScore}/100
                    </p>
                  </div>
                  <div>
                    <p className="text-rose-200/60 font-medium text-xs uppercase mb-1">No-Show Rate</p>
                    <p className="text-xl font-bold text-white">
                      {data.comparison.worstPerforming.noShowRate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Average Metrics */}
      {data?.averages && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-6"
        >
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            System-Wide Averages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 p-2 opacity-10">
                <Clock className="w-16 h-16 text-blue-500" />
              </div>
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Avg Wait Time</p>
              <p className="text-3xl font-bold text-white">
                {Math.round(data.averages.averageWaitTime * 10) / 10}
                <span className="text-lg text-slate-500 ml-1.5 font-medium">min</span>
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 p-2 opacity-10">
                <Clock className="w-16 h-16 text-amber-500" />
              </div>
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Avg Service Time</p>
              <p className="text-3xl font-bold text-white">
                {Math.round(data.averages.averageServiceTime * 10) / 10}
                <span className="text-lg text-slate-500 ml-1.5 font-medium">min</span>
              </p>
            </div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 p-2 opacity-10">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
              </div>
              <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Avg Completion Rate</p>
              <p className="text-3xl font-bold text-white">
                {Math.round(data.averages.averageCompletionRate * 10) / 10}
                <span className="text-lg text-slate-500 ml-1.5 font-medium">%</span>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Charts */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Efficiency Comparison */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800"
          >
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-500" />
              Service Efficiency Comparison
            </h2>
            <BarChart
              data={formatComparisonData()}
              xKey="name"
              yKeys={[
                { key: 'Efficiency Score', color: '#3b82f6', name: 'Efficiency Score' },
              ]}
              height={350}
              layout="horizontal"
              yAxisLabel="Score (0-100)"
            />
          </motion.div>

          {/* Volume Breakdown */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800"
          >
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              Token Volume Breakdown
            </h2>
            <BarChart
              data={formatVolumeData()}
              xKey="name"
              yKeys={[
                { key: 'Total', color: '#3b82f6', name: 'Total Tokens' },
                { key: 'Completed', color: '#10b981', name: 'Completed' },
                { key: 'No-Shows', color: '#ef4444', name: 'No-Shows' },
              ]}
              height={350}
              yAxisLabel="Token Count"
            />
          </motion.div>
        </div>

        {/* Detailed Service Table */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-800 overflow-hidden"
        >
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              Detailed Service Metrics
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-950">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tokens
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Completion
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    No-Show
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Avg Wait
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Efficiency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data?.services.map((service, index) => (
                  <tr key={index} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {service.serviceName}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {service.totalTokens}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${service.completionRate >= 90
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : service.completionRate >= 70
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                      >
                        {service.completionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${service.noShowRate <= 5
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : service.noShowRate <= 10
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}
                      >
                        {service.noShowRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                      {Math.round(service.averageWaitTime * 10) / 10} min
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-slate-800 rounded-full h-1.5 w-24">
                          <div
                            className={`h-1.5 rounded-full ${service.efficiencyScore >= 80 ? 'bg-emerald-500' :
                              service.efficiencyScore >= 60 ? 'bg-blue-500' :
                                'bg-amber-500'
                              }`}
                            style={{ width: `${service.efficiencyScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white">
                          {service.efficiencyScore}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
