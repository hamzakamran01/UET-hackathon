'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { adminAPI } from '@/lib/api'
import { AbuseLog, AbuseEventType } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Clock,
  User,
  Shield,
  Ban,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Activity,
  AlertCircle,
  UserX,
  Download,
  TrendingUp,
  X,
} from 'lucide-react'

export default function AdminAbusePage() {
  const router = useRouter()
  const [abuseLogs, setAbuseLogs] = useState<AbuseLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved'>('all')
  const [selectedLog, setSelectedLog] = useState<AbuseLog | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    const adminToken = localStorage.getItem('adminAccessToken')
    if (!adminToken) {
      router.push('/admin/login')
      return
    }
    fetchAbuseLogs()
  }, [])

  const fetchAbuseLogs = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getAbuseLogs()
      setAbuseLogs(response.data)
    } catch (error: any) {
      toast.error('Failed to load abuse logs')
      if (error.response?.status === 401) {
        router.push('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (logId: string) => {
    try {
      await adminAPI.resolveAbuseLog(logId)
      toast.success('Report resolved')
      fetchAbuseLogs()
    } catch (error: any) {
      toast.error('Failed to resolve report')
    }
  }

  const handleBanUser = async (userId: string, userName: string) => {
    const reason = prompt(`Ban user "${userName}"? Enter reason:`)
    if (!reason) return

    try {
      await adminAPI.banUser(userId, reason)
      toast.success('User banned successfully')
      fetchAbuseLogs()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to ban user')
    }
  }

  const handleViewDetails = (log: AbuseLog) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  const handleExport = () => {
    const csv = [
      ['Date', 'Type', 'User', 'Description', 'Status'].join(','),
      ...filteredLogs.map((log) =>
        [
          formatDateTime(log.createdAt),
          log.eventType,
          log.user?.email || log.user?.phone || 'Unknown',
          log.description?.replace(/,/g, ';') || 'N/A',
          log.resolved ? 'Resolved' : 'Pending',
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `abuse-reports-${Date.now()}.csv`
    a.click()
    toast.success('Reports exported successfully')
  }

  const getEventIcon = (type: AbuseEventType) => {
    switch (type) {
      case AbuseEventType.NO_SHOW:
        return <UserX className="w-5 h-5 text-amber-500" />
      case AbuseEventType.PRESENCE_VIOLATION:
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case AbuseEventType.MULTIPLE_CANCELLATIONS:
        return <XCircle className="w-5 h-5 text-orange-500" />
      case AbuseEventType.SUSPICIOUS_ACTIVITY:
        return <AlertCircle className="w-5 h-5 text-purple-500" />
      case AbuseEventType.RATE_LIMIT_EXCEEDED:
        return <Activity className="w-5 h-5 text-blue-500" />
      default:
        return <Shield className="w-5 h-5 text-slate-500" />
    }
  }

  const getEventBorderColor = (type: AbuseEventType) => {
    switch (type) {
      case AbuseEventType.NO_SHOW:
        return 'border-amber-500/30'
      case AbuseEventType.PRESENCE_VIOLATION:
        return 'border-red-500/30'
      case AbuseEventType.MULTIPLE_CANCELLATIONS:
        return 'border-orange-500/30'
      case AbuseEventType.SUSPICIOUS_ACTIVITY:
        return 'border-purple-500/30'
      case AbuseEventType.RATE_LIMIT_EXCEEDED:
        return 'border-blue-500/30'
      default:
        return 'border-slate-800'
    }
  }

  const getSeverityBadge = (severity: number) => {
    if (severity >= 8) {
      return <span className="px-2 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-bold">Critical</span>
    } else if (severity >= 5) {
      return <span className="px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold">High</span>
    } else if (severity >= 3) {
      return <span className="px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold">Medium</span>
    } else {
      return <span className="px-2 py-1 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold">Low</span>
    }
  }

  const filteredLogs = abuseLogs.filter((log) => {
    const matchesSearch =
      log.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user?.phone?.includes(searchQuery) ||
      log.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === 'all' || log.eventType === typeFilter

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && !log.resolved) ||
      (statusFilter === 'resolved' && log.resolved)

    return matchesSearch && matchesType && matchesStatus
  })

  const totalReports = abuseLogs.length
  const pendingReports = abuseLogs.filter((l) => !l.resolved).length
  const resolvedReports = abuseLogs.filter((l) => l.resolved).length
  const criticalReports = abuseLogs.filter((l) => l.severity >= 8 && !l.resolved).length

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Abuse Reports</h2>
          <p className="text-slate-400">Monitor and manage security incidents and violations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 transition-all font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={fetchAbuseLogs}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Shield className="w-20 h-20 text-blue-500" />
          </div>
          <p className="text-slate-400 font-medium text-sm mb-1">Total Reports</p>
          <h3 className="text-3xl font-bold text-white">{totalReports}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Clock className="w-20 h-20 text-amber-500" />
          </div>
          <p className="text-slate-400 font-medium text-sm mb-1">Pending</p>
          <h3 className="text-3xl font-bold text-amber-400">{pendingReports}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="w-20 h-20 text-emerald-500" />
          </div>
          <p className="text-slate-400 font-medium text-sm mb-1">Resolved</p>
          <h3 className="text-3xl font-bold text-emerald-400">{resolvedReports}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <AlertTriangle className="w-20 h-20 text-red-500" />
          </div>
          <p className="text-slate-400 font-medium text-sm mb-1">Critical</p>
          <h3 className="text-3xl font-bold text-red-500">{criticalReports}</h3>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search user or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 placeholder:text-slate-600 transition-all text-sm"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm"
          >
            <option value="all">All Event Types</option>
            <option value={AbuseEventType.NO_SHOW}>No Show</option>
            <option value={AbuseEventType.PRESENCE_VIOLATION}>Presence Violation</option>
            <option value={AbuseEventType.MULTIPLE_CANCELLATIONS}>Multiple Cancellations</option>
            <option value={AbuseEventType.SUSPICIOUS_ACTIVITY}>Suspicious Activity</option>
            <option value={AbuseEventType.RATE_LIMIT_EXCEEDED}>Rate Limit Exceeded</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </motion.div>

      {/* Reports List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-slate-900/30 border border-slate-800 rounded-2xl p-12 text-center border-dashed"
            >
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-slate-300 mb-2">No reports found</h3>
              <p className="text-slate-500 text-sm">
                {searchQuery || typeFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters.'
                  : 'All clear! No abuse reports to review.'}
              </p>
            </motion.div>
          ) : (
            filteredLogs.map((log, index) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.03 }}
                className={`group bg-slate-900/50 rounded-2xl border ${getEventBorderColor(log.eventType)} overflow-hidden hover:shadow-xl transition-all ${!log.resolved && log.severity >= 8 ? 'shadow-[0_0_20px_rgba(239,68,68,0.1)]' : ''
                  }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center border border-slate-700">
                        {getEventIcon(log.eventType)}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-white tracking-tight">{log.eventType.replace(/_/g, ' ')}</h3>
                          {getSeverityBadge(log.severity)}
                          {log.resolved ? (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                              Resolved
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
                              Pending
                            </span>
                          )}
                        </div>

                        <p className="text-slate-300 mb-4 text-sm leading-relaxed">{log.description || 'No description provided.'}</p>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm bg-slate-950/30 p-3 rounded-lg border border-slate-800/50">
                          <div>
                            <p className="text-slate-500 text-xs font-semibold uppercase mb-0.5">User</p>
                            <p className="text-slate-200 font-medium truncate">
                              {log.user?.email || log.user?.phone || 'Unknown'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs font-semibold uppercase mb-0.5">Severity Score</p>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${log.severity >= 8 ? 'bg-red-500' : log.severity >= 5 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${(log.severity / 10) * 100}%` }}></div>
                              </div>
                              <span className="text-slate-200 font-medium">{log.severity}/10</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs font-semibold uppercase mb-0.5">Reported</p>
                            <p className="text-slate-200 font-medium">{formatDateTime(log.createdAt).split(',')[0]}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-800/50">
                    {!log.resolved && (
                      <>
                        <button
                          onClick={() => handleResolve(log.id)}
                          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/20"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Resolved
                        </button>

                        {log.userId && (
                          <button
                            onClick={() => handleBanUser(log.userId!, log.user?.email || log.user?.phone || 'User')}
                            className="flex items-center gap-2 bg-slate-800 hover:bg-red-900/30 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-slate-700 hover:border-red-800"
                          >
                            <Ban className="w-4 h-4" />
                            Ban User
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => handleViewDetails(log)}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors ml-auto border border-slate-700"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Abuse Report Details
                </h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Event Type</p>
                      <p className="text-white font-bold">{selectedLog.eventType.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Severity</p>
                      <div>{getSeverityBadge(selectedLog.severity)}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">User</p>
                      <p className="text-white font-semibold truncate">
                        {selectedLog.user?.email || selectedLog.user?.phone || 'Unknown'}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Status</p>
                      <p className={`font-bold ${selectedLog.resolved ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {selectedLog.resolved ? 'Resolved' : 'Pending'}
                      </p>
                    </div>
                    <div className="col-span-2 p-3 rounded-lg bg-slate-950 border border-slate-800">
                      <p className="text-xs text-slate-500 font-semibold uppercase mb-1">Reported At</p>
                      <p className="text-white font-semibold">{formatDateTime(selectedLog.createdAt)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-slate-400 font-semibold mb-2">Description</p>
                    <p className="text-slate-200 bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-sm leading-relaxed">
                      {selectedLog.description || 'No description provided'}
                    </p>
                  </div>

                  {selectedLog.metadata && (
                    <div>
                      <p className="text-sm text-slate-400 font-semibold mb-2">Technical Metadata</p>
                      <pre className="text-xs bg-slate-950 text-emerald-400 p-4 rounded-lg border border-slate-800 overflow-x-auto font-mono">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
