'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { adminAPI } from '@/lib/api'
import { useSocket } from '@/lib/socket'
import { Token, Service } from '@/types'
import { formatDateTime, formatDuration, getStatusColor } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Activity,
  ArrowLeft,
  RefreshCw,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PauseCircle,
  SkipForward,
  Bell,
  AlertTriangle,
  Filter,
  Search,
  Eye,
  Edit2,
  Trash2,
  MessageSquare,
  MapPin,
  Ticket,
  MoreHorizontal,
  Phone,
  Mail
} from 'lucide-react'

export default function AdminQueuePage() {
  const router = useRouter()
  const { socket } = useSocket()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<string>('all')
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'active' | 'completed' | 'no-show'>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Initial load of services
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await adminAPI.getServices()
        setServices(response.data)
      } catch (error) {
        console.error('Failed to load services', error)
      }
    }
    loadServices()
  }, [])

  const fetchData = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) setLoading(true)

      const tokensRes = await adminAPI.getTokens({
        serviceId: selectedService !== 'all' ? selectedService : undefined,
        group: viewMode
      })

      setTokens(tokensRes.data)
    } catch (error: any) {
      toast.error('Failed to load queue data')
      if (error.response?.status === 401) {
        router.push('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }, [selectedService, viewMode, router])

  useEffect(() => {
    const adminToken = localStorage.getItem('adminAccessToken')
    if (!adminToken) {
      router.push('/admin/login')
      return
    }

    fetchData(true)

    // Auto-refresh every 10 seconds
    const interval = autoRefresh ? setInterval(() => fetchData(false), 10000) : null

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchData, autoRefresh])

  const handleCallNext = async (serviceId: string) => {
    try {
      await adminAPI.callNextToken(serviceId)
      toast.success('Next token called')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to call next token')
    }
  }

  const handleServeToken = async (tokenId: string) => {
    try {
      await adminAPI.serveToken(tokenId)
      toast.success('Token marked as served')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to serve token')
    }
  }

  const handleCompleteToken = async (tokenId: string) => {
    try {
      await adminAPI.completeToken(tokenId)
      toast.success('Token completed')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete token')
    }
  }

  const handleCancelToken = async (tokenId: string, tokenNumber: string) => {
    const reason = prompt(`Cancel token ${tokenNumber}. Enter reason:`)
    if (!reason) return

    try {
      await adminAPI.cancelToken(tokenId, reason)
      toast.success('Token cancelled by admin')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel token')
    }
  }

  const handleNotifyUser = async (tokenId: string, tokenNumber: string) => {
    const message = prompt(`Send notification to ${tokenNumber}:`)
    if (!message) return

    try {
      await adminAPI.notifyUser(tokenId, message)
      toast.success('Notification sent successfully')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send notification')
    }
  }

  const filteredTokens = tokens.filter((token) => {
    const matchesSearch =
      token.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.user?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.user?.phone?.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesSearch
  })

  const activeCount = tokens.filter((t) => t.status === 'ACTIVE').length
  const calledCount = tokens.filter((t) => t.status === 'CALLED').length
  const inServiceCount = tokens.filter((t) => t.status === 'IN_SERVICE').length

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Queue Monitor</h2>
          <p className="text-slate-400">Manage live queues and service stations</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${autoRefresh
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
          >
            {autoRefresh ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
            {autoRefresh ? 'Live Updates' : 'Paused'}
          </button>

          <button
            onClick={() => fetchData()}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users className="w-20 h-20 text-blue-500" />
          </div>
          <p className="text-slate-400 font-medium text-sm mb-1">Waiting in Queue</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">{activeCount}</h3>
            <span className="text-xs text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">Active</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Bell className="w-20 h-20 text-amber-500" />
          </div>
          <p className="text-slate-400 font-medium text-sm mb-1">Currently Called</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">{calledCount}</h3>
            <span className="text-xs text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Action Required</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-20 h-20 text-emerald-500" />
          </div>
          <p className="text-slate-400 font-medium text-sm mb-1">In Service</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">{inServiceCount}</h3>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Being Served</span>
          </div>
        </motion.div>
      </div>

      {/* Controls & Filters */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          {/* Tabs */}
          <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800 w-full lg:w-auto overflow-x-auto">
            {[
              { id: 'active', label: 'Active Queue', icon: Activity },
              { id: 'completed', label: 'Completed', icon: CheckCircle2 },
              { id: 'no-show', label: 'No Show / Cancelled', icon: XCircle },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${viewMode === tab.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                <tab.icon className={`w-4 h-4 ${viewMode === tab.id ? 'text-blue-400' : ''}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Services</option>
              {services.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search tokens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 bg-slate-950 border border-slate-700 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main List */}
      <AnimatePresence mode='popLayout'>
        {filteredTokens.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
              <Ticket className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No tokens found</h3>
            <p className="text-slate-400 max-w-sm">
              There are no tokens matching your current filters.
              {viewMode === 'active' && " The queue might be empty!"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTokens.map((token, i) => (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                layoutId={`token-${token.id}`}
                className={`group bg-slate-900/50 backdrop-blur-sm border rounded-2xl overflow-hidden hover:shadow-xl transition-all ${token.status === 'CALLED'
                    ? 'border-amber-500/50 shadow-amber-900/10'
                    : token.status === 'IN_SERVICE'
                      ? 'border-blue-500/50 shadow-blue-900/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
              >
                {/* Status Bar */}
                <div className={`h-1.5 w-full ${token.status === 'CALLED' ? 'bg-amber-500 animate-pulse' :
                    token.status === 'IN_SERVICE' ? 'bg-blue-500' :
                      token.status === 'COMPLETED' ? 'bg-emerald-500' :
                        token.status === 'CANCELLED' || token.status === 'NO_SHOW' ? 'bg-red-500' :
                          'bg-slate-700'
                  }`}></div>

                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-3xl font-bold text-white tracking-tight">{token.tokenNumber}</h3>
                      <div className="text-sm text-slate-400 mt-1 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${token.status === 'active' ? 'bg-slate-500' :
                            token.status === 'CALLED' ? 'bg-amber-500' :
                              token.status === 'IN_SERVICE' ? 'bg-blue-500' :
                                'bg-emerald-500'
                          }`}></span>
                        {token.service?.name || 'Unknown Service'}
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-mono text-lg font-bold text-slate-300 border border-slate-700">
                      #{token.queuePosition}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                      <p className="text-xs text-slate-500 mb-1">Wait Time</p>
                      <p className={`font-semibold ${token.estimatedWaitTime && token.estimatedWaitTime > 20 ? 'text-red-400' : 'text-emerald-400'
                        }`}>
                        {token.estimatedWaitTime ? formatDuration(token.estimatedWaitTime * 60) : '0m'}
                      </p>
                    </div>
                    <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800/50">
                      <p className="text-xs text-slate-500 mb-1">Created At</p>
                      <p className="font-semibold text-slate-300">
                        {formatDateTime(token.createdAt).split(',')[1]}
                      </p>
                    </div>
                  </div>

                  {token.user && (
                    <div className="flex items-center gap-3 mb-4 p-3 bg-slate-800/30 rounded-lg border border-slate-800/50">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-slate-300">{token.user.email?.charAt(0).toUpperCase() || 'U'}</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium text-slate-200 truncate">{token.user.email || 'No email'}</p>
                        <p className="text-xs text-slate-500 truncate">{token.user.phone || 'No phone'}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {token.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleCallNext(token.serviceId)}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-900/20"
                      >
                        <Bell className="w-4 h-4" />
                        Call User
                      </button>
                    )}

                    {token.status === 'CALLED' && (
                      <button
                        onClick={() => handleServeToken(token.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
                      >
                        <PlayCircle className="w-4 h-4" />
                        Start Service
                      </button>
                    )}

                    {token.status === 'IN_SERVICE' && (
                      <button
                        onClick={() => handleCompleteToken(token.id)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete
                      </button>
                    )}

                    {/* Secondary Actions */}
                    {['ACTIVE', 'CALLED', 'IN_SERVICE'].includes(token.status) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleNotifyUser(token.id, token.tokenNumber)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition-colors"
                          title="Notify User"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancelToken(token.id, token.tokenNumber)}
                          className="p-2 bg-slate-800 hover:bg-red-900/30 text-slate-300 hover:text-red-400 rounded-lg border border-slate-700 hover:border-red-800 transition-colors"
                          title="Cancel Token"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => router.push(`/token/${token.id}`)} // Keeping logic, but user likely wants admin view details
                      className="p-2 ml-auto bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
