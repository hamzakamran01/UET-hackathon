'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { queueManagerAPI } from '@/lib/api'
import { Token, Service } from '@/types'
import { toast } from 'sonner'
import {
  Activity,
  ArrowLeft,
  RefreshCw,
  Users,
  Clock,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
  Bell,
  Search,
  Filter,
  Phone,
  Mail,
  MapPin,
  Ticket,
  ChevronRight,
} from 'lucide-react'

export default function QueueManagerQueuePage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [selectedService, setSelectedService] = useState<string>('all')
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('queueManagerAccessToken')
    if (!token) {
      router.push('/queue-manager/login')
      return
    }

    fetchData()

    const interval = autoRefresh ? setInterval(fetchData, 10000) : null
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, selectedService])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [servicesRes, tokensRes] = await Promise.all([
        queueManagerAPI.getServices(),
        queueManagerAPI.getTokens({ serviceId: selectedService !== 'all' ? selectedService : undefined }),
      ])

      setServices(servicesRes.data)
      setTokens(tokensRes.data)
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        toast.error('Session expired')
        router.push('/queue-manager/login')
      } else {
        toast.error('Failed to load queue data')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCallNext = async (serviceId: string) => {
    try {
      await queueManagerAPI.callNextToken(serviceId)
      toast.success('Next token called')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to call next token')
    }
  }

  const handleServeToken = async (tokenId: string) => {
    try {
      await queueManagerAPI.serveToken(tokenId)
      toast.success('Token marked as in service')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to serve token')
    }
  }

  const handleCompleteToken = async (tokenId: string) => {
    try {
      await queueManagerAPI.completeToken(tokenId)
      toast.success('Service completed')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to complete token')
    }
  }

  const handleNotifyUser = async (tokenId: string, tokenNumber: string) => {
    const message = prompt(`Send notification to ${tokenNumber}:`)
    if (!message) return

    try {
      await queueManagerAPI.notifyUser(tokenId, message)
      toast.success('Notification sent')
    } catch (error: any) {
      toast.error('Failed to send notification')
    }
  }

  const filteredTokens = tokens.filter((token) => {
    const matchesSearch =
      token.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || token.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const activeTokens = tokens.filter((t) => t.status === 'ACTIVE').length
  const calledTokens = tokens.filter((t) => t.status === 'CALLED').length
  const inServiceTokens = tokens.filter((t) => t.status === 'IN_SERVICE').length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700 border-green-300'
      case 'CALLED':
        return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'IN_SERVICE':
        return 'bg-purple-100 text-purple-700 border-purple-300'
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-700 border-gray-300'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading queue...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/queue-manager')}
                className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-lg"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-7 h-7" />
                  Queue Control Center
                </h1>
                <p className="text-indigo-100 text-sm">Real-time queue monitoring and management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all backdrop-blur-lg ${
                  autoRefresh
                    ? 'bg-green-500/20 text-white border border-green-300/30'
                    : 'bg-white/20 text-white border border-white/30'
                }`}
              >
                {autoRefresh ? <PlayCircle className="w-5 h-5" /> : <PauseCircle className="w-5 h-5" />}
                <span className="hidden sm:inline">{autoRefresh ? 'Live' : 'Paused'}</span>
              </button>

              <button
                onClick={fetchData}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors backdrop-blur-lg"
              >
                <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium mb-1">Active in Queue</p>
                <p className="text-4xl font-bold text-green-600">{activeTokens}</p>
              </div>
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium mb-1">Called</p>
                <p className="text-4xl font-bold text-blue-600">{calledTokens}</p>
              </div>
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
                <Bell className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 font-medium mb-1">In Service</p>
                <p className="text-4xl font-bold text-purple-600">{inServiceTokens}</p>
              </div>
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-xl border border-slate-100 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by token number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium"
            >
              <option value="all">All Services</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('CALLED')}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  statusFilter === 'CALLED'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Called
              </button>
            </div>
          </div>
        </motion.div>

        {/* Call Next Button */}
        {selectedService !== 'all' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <button
              onClick={() => handleCallNext(selectedService)}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-6 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-indigo-500/50 transition-all"
            >
              <Bell className="w-6 h-6" />
              Call Next Token in Queue
              <ChevronRight className="w-6 h-6" />
            </button>
          </motion.div>
        )}

        {/* Tokens List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredTokens.map((token, index) => (
              <motion.div
                key={token.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all"
              >
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                          {token.queuePosition}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">{token.tokenNumber}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(token.status)}`}>
                              {token.status}
                            </span>
                            <span className="text-slate-500 text-sm">
                              Created {new Date(token.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Ticket className="w-4 h-4" />
                          <span>Service: {token.service?.name || 'Unknown'}</span>
                        </div>
                        {token.estimatedWaitTime && (
                          <div className="flex items-center gap-2 text-slate-600">
                            <Clock className="w-4 h-4" />
                            <span>Est. Wait: {Math.round(token.estimatedWaitTime / 60)} min</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {token.status === 'CALLED' && (
                        <button
                          onClick={() => handleServeToken(token.id)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-colors shadow-lg text-sm"
                        >
                          Start Service
                        </button>
                      )}
                      {token.status === 'IN_SERVICE' && (
                        <button
                          onClick={() => handleCompleteToken(token.id)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition-colors shadow-lg text-sm"
                        >
                          Complete
                        </button>
                      )}
                      <button
                        onClick={() => handleNotifyUser(token.id, token.tokenNumber)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors shadow-lg text-sm flex items-center justify-center gap-2"
                      >
                        <Bell className="w-4 h-4" />
                        Notify
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredTokens.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl shadow-xl border border-slate-100">
              <Ticket className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 text-lg font-medium">No tokens found</p>
              <p className="text-slate-400 mt-2">Queue is empty or no matches for your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
