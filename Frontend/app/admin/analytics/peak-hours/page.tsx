'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, AlertTriangle, Calendar, Sun } from 'lucide-react';
import Link from 'next/link';
import BarChart from '@/components/analytics/BarChart';
import LineChart from '@/components/analytics/LineChart';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import analyticsService from '@/lib/api/analytics';
import {
  PeakHoursResponse,
  DateRangePreset,
  AnalyticsQuery,
} from '@/types/analytics';

export default function PeakHoursPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PeakHoursResponse | null>(null);
  const [query, setQuery] = useState<AnalyticsQuery>({
    preset: DateRangePreset.LAST_30_DAYS,
  });

  useEffect(() => {
    fetchPeakHours();
  }, [query]);

  const fetchPeakHours = async () => {
    try {
      setLoading(true);
      const response = await analyticsService.getPeakHours(query);
      setData(response);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatHourlyData = () => {
    if (!data?.hourlyDistribution) return [];

    return data.hourlyDistribution.map((hour) => ({
      hour: `${hour.hour}:00`,
      'Tokens': hour.tokenCount,
      'Avg Wait (min)': Math.round(hour.averageWaitTime * 10) / 10,
    }));
  };

  const formatDailyData = () => {
    if (!data?.dailyDistribution) return [];

    return data.dailyDistribution.map((day) => ({
      day: day.dayName.substring(0, 3),
      'Tokens': day.tokenCount,
      'Avg Wait (min)': Math.round(day.averageWaitTime * 10) / 10,
    }));
  };

  if (loading && !data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
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
            <Clock className="w-6 h-6 text-purple-500" />
            Peak Hours Analysis
          </h1>
          <p className="text-slate-400 mt-1 ml-8">Identify busy periods and optimize resource allocation</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangePicker value={query} onChange={setQuery} />
        </div>
      </div>

      {/* Peak Hour Summary */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 p-4 opacity-5">
              <Clock className="w-32 h-32 text-purple-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Peak Hour
                </h3>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-purple-400">
                  {data.peakHour}:00
                </span>
                <span className="text-slate-400 font-medium">- {data.peakHour + 1}:00</span>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                Highest token volume during this time window.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-900/50 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 p-4 opacity-5">
              <Calendar className="w-32 h-32 text-blue-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Sun className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white">
                  Busiest Day
                </h3>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-blue-400">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][data.peakDay]}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-2">
                Highest traffic accumulated on this day of the week.
              </p>
            </div>
          </motion.div>
        </div>
      )}

      {/* Recommendations */}
      {data?.recommendations && data.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-900/10 border border-amber-500/20 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-white">
              AI Recommendations
            </h3>
          </div>
          <ul className="space-y-3">
            {data.recommendations.map((recommendation, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-slate-300 text-sm"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5" />
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Charts */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800 lg:col-span-2"
          >
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Hourly Token Distribution (24-Hour View)
            </h2>
            <BarChart
              data={formatHourlyData()}
              xKey="hour"
              yKeys={[
                { key: 'Tokens', color: '#3b82f6', name: 'Token Count' },
              ]}
              height={350}
              xAxisLabel="Hour of Day"
              yAxisLabel="Tokens"
            />
          </motion.div>

          {/* Hourly Wait Times */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800"
          >
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Average Wait Time by Hour
            </h2>
            <LineChart
              data={formatHourlyData()}
              xKey="hour"
              yKeys={[
                { key: 'Avg Wait (min)', color: '#f59e0b', name: 'Avg Wait Time' },
              ]}
              height={350}
              xAxisLabel="Hour of Day"
              yAxisLabel="Minutes"
            />
          </motion.div>

          {/* Daily Distribution */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-800"
          >
            <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              Day of Week Distribution
            </h2>
            <BarChart
              data={formatDailyData()}
              xKey="day"
              yKeys={[
                { key: 'Tokens', color: '#10b981', name: 'Token Count' },
              ]}
              height={350}
              xAxisLabel="Day of Week"
              yAxisLabel="Tokens"
            />
          </motion.div>
        </div>
      </div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-3">
          How to Use This Data
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3 text-slate-400 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5" />
            <span>Schedule more staff during peak hours to reduce wait times and improve satisfaction.</span>
          </li>
          <li className="flex items-start gap-3 text-slate-400 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5" />
            <span>Consider adjusting service hours based on demand patterns to capture more traffic.</span>
          </li>
          <li className="flex items-start gap-3 text-slate-400 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5" />
            <span>Promote off-peak hours through incentives to balance load and reduce congestion.</span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
