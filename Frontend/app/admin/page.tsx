'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Server,
  Wifi,
  ExternalLink,
  AlertTriangle
} from 'lucide-react';
import { adminAPI } from '@/lib/api';
import { useSocket } from '@/lib/socket';
import { formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

// Mock data for initial skeleton load or fallback
const defaultStats = {
  totalUsers: 0,
  totalServices: 0,
  activeTokens: 0,
  completedTokens: 0,
  todayTokens: 0,
  averageWaitTime: 0,
  systemHealth: 98,
};

export default function AdminDashboard() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const [stats, setStats] = useState(defaultStats);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const statsRes = await adminAPI.getStats();
      if (statsRes.data) {
        setStats(statsRes.data.stats || defaultStats);
        setRecentActivity(statsRes.data.recentActivity || []);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen for real-time updates
    if (socket) {
      socket.on('dashboard-update', (data: any) => {
        setStats((prev) => ({ ...prev, ...data }));
      });

      socket.on('new-activity', (activity: any) => {
        setRecentActivity((prev) => [activity, ...prev].slice(0, 10));
      });
    }

    return () => {
      if (socket) {
        socket.off('dashboard-update');
        socket.off('new-activity');
      }
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome & System Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-white tracking-tight">Command Center</h2>
          <p className="text-slate-400">Real-time supervision of queue operations and system health.</p>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/50 p-2 rounded-xl border border-slate-800/50 backdrop-blur-sm">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isConnected ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            <Wifi className="w-4 h-4" />
            {isConnected ? 'System Online' : 'Offline'}
          </div>
          <div className="h-4 w-px bg-slate-700"></div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Server className="w-4 h-4" />
            <span>v2.4.0</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500 group-hover:bg-blue-500/20 transition-colors">
              <Users className="w-6 h-6" />
            </div>
            <span className="flex items-center text-emerald-400 text-sm font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12%
            </span>
          </div>
          <h3 className="text-slate-400 font-medium text-sm">Total Users</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalUsers.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-500 group-hover:bg-purple-500/20 transition-colors">
              <Activity className="w-6 h-6" />
            </div>
            <span className="flex items-center text-emerald-400 text-sm font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              +5%
            </span>
          </div>
          <h3 className="text-slate-400 font-medium text-sm">Active Tokens</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.activeTokens.toLocaleString()}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 group-hover:bg-amber-500/20 transition-colors">
              <Clock className="w-6 h-6" />
            </div>
            <span className="flex items-center text-emerald-400 text-sm font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <TrendingDown className="w-3 h-3 mr-1" />
              -2m
            </span>
          </div>
          <h3 className="text-slate-400 font-medium text-sm">Avg. Wait Time</h3>
          <p className="text-3xl font-bold text-white mt-1">{Math.round(stats.averageWaitTime)}m</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="flex items-center text-emerald-400 text-sm font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle className="w-3 h-3 mr-1" />
              Optimal
            </span>
          </div>
          <h3 className="text-slate-400 font-medium text-sm">System Health</h3>
          <p className="text-3xl font-bold text-white mt-1">{stats.systemHealth}%</p>
        </motion.div>
      </div>

      {/* Analytics CTA */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="relative overflow-hidden rounded-2xl shadow-2xl border border-indigo-500/30 group cursor-pointer"
        onClick={() => router.push('/admin/analytics')}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-900 z-0"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 z-0 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wider uppercase">Enterprise</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            </div>

            <h2 className="text-3xl font-bold text-white">
              Advanced Queue Analytics
            </h2>
            <p className="text-indigo-200 text-lg">
              Unlock predictive model insights, staff efficiency heatmaps, and deep customer journey tracking.
            </p>

            <button className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20">
              <span>View Analytics</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="hidden lg:block relative">
            <div className="w-64 h-32 bg-slate-900/50 rounded-lg border border-indigo-400/20 backdrop-blur-md p-4 flex items-end gap-2 shadow-xl transform rotate-3 transition-transform group-hover:rotate-0">
              {[35, 60, 45, 70, 50, 80, 65, 85].map((h, i) => (
                <div key={i} className="flex-1 bg-indigo-500/60 rounded-t-sm hover:bg-indigo-400 transition-colors" style={{ height: `${h}%` }}></div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-1 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Quick Actions
            </h3>
          </div>
          <div className="p-4 space-y-3">
            <button
              onClick={() => router.push('/admin/services')}
              className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="font-medium text-slate-300 group-hover:text-white">Manage Services</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
            </button>

            <button
              onClick={() => router.push('/admin/users')}
              className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-medium text-slate-300 group-hover:text-white">User Database</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
            </button>

            <button
              onClick={() => router.push('/admin/abuse')}
              className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="font-medium text-slate-300 group-hover:text-white">Abuse Reports</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
            </button>

            <button
              onClick={() => router.push('/admin/analytics')}
              className="flex items-center justify-between w-full p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="font-medium text-slate-300 group-hover:text-white">Export Reports</span>
              </div>
              <ExternalLink className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
            </button>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              Live Activity
            </h3>
            <Link href="/admin/abuse" className="text-xs font-medium text-blue-400 hover:text-blue-300">
              View All
            </Link>
          </div>
          <div className="p-0">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No recent activity detected.</div>
            ) : (
              <div className="divide-y divide-slate-800/50 max-h-[320px] overflow-y-auto scrollbar-thin">
                {recentActivity.map((log, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 hover:bg-slate-800/30 transition-colors">
                    <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${log.type === 'ERROR' ? 'bg-red-500 shadow-lg shadow-red-500/50' :
                        log.type === 'WARNING' ? 'bg-amber-500 shadow-lg shadow-amber-500/50' : 'bg-blue-500 shadow-lg shadow-blue-500/50'
                      }`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200">{log.message || log.action || 'Unknown Action'}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        {log.timestamp ? formatDateTime(log.timestamp) : 'Just now'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Today's Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden"
      >
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" />
            Today's Efficiency
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          <div className="p-6 text-center group hover:bg-slate-800/20 transition-colors">
            <p className="text-slate-500 text-sm font-medium mb-2">Tokens Issued</p>
            <p className="text-3xl font-bold text-white group-hover:scale-110 transition-transform duration-300">{stats.todayTokens}</p>
          </div>
          <div className="p-6 text-center group hover:bg-slate-800/20 transition-colors">
            <p className="text-slate-500 text-sm font-medium mb-2">Service Completed</p>
            <p className="text-3xl font-bold text-emerald-400 group-hover:scale-110 transition-transform duration-300">{stats.completedTokens}</p>
          </div>
          <div className="p-6 text-center group hover:bg-slate-800/20 transition-colors">
            <p className="text-slate-500 text-sm font-medium mb-2">Avg Processing</p>
            <p className="text-3xl font-bold text-blue-400 group-hover:scale-110 transition-transform duration-300">{Math.round(stats.averageWaitTime)}m</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
