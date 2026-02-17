'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { tokensAPI, usersAPI } from '@/lib/api'
import { Token, User } from '@/types'
import { formatDateTime, formatDuration, getStatusColor, getStatusBadge } from '@/lib/utils'
import { toast } from 'sonner'
import {
  UserCircle,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Bell,
  Settings,
  LogOut,
  Ticket,
  Clock,
  CheckCircle2,
  XCircle,
  Filter,
  Search,
  Download,
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, logout, isAuthenticated } = useAuthStore()
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    totalTokens: 0,
    activeTokens: 0,
    completedTokens: 0,
    cancelledTokens: 0,
    totalWaitTime: 0,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }
    fetchUserData()
  }, [isAuthenticated])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await tokensAPI.getMyTokens()
      const userTokens = response.data

      setTokens(userTokens)

      // Calculate statistics
      const stats = {
        totalTokens: userTokens.length,
        activeTokens: userTokens.filter(t => t.status === 'ACTIVE').length,
        completedTokens: userTokens.filter(t => t.status === 'COMPLETED').length,
        cancelledTokens: userTokens.filter(t => t.status === 'CANCELLED').length,
        totalWaitTime: userTokens.reduce((sum, t) => sum + (t.estimatedWaitTime || 0), 0),
      }
      setStats(stats)
    } catch (error: any) {
      toast.error('Failed to load profile data')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    router.push('/')
  }

  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.service?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || token.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your profile...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-4"
            >
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-lg flex items-center justify-center border-4 border-white/50 shadow-2xl">
                <UserCircle className="w-12 h-12 text-white" />
              </div>
              <div className="text-white">
                <h1 className="text-3xl font-bold">{user?.name || 'User Profile'}</h1>
                <p className="text-blue-100 flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4" />
                  Member since {user?.createdAt ? formatDateTime(user.createdAt).split(',')[0] : 'N/A'}
                </p>
              </div>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl backdrop-blur-lg border border-white/30 transition-all duration-300 shadow-lg"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold">Logout</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - User Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Contact Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Email</p>
                    <p className="text-gray-900 font-semibold">{user?.email || 'Not provided'}</p>
                    {user?.emailVerified && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500 font-medium">Phone</p>
                    <p className="text-gray-900 font-semibold">{user?.phone || 'Not provided'}</p>
                    {user?.phoneVerified && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Statistics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Ticket className="w-5 h-5" />
                  Your Statistics
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Total Tokens</span>
                  <span className="text-2xl font-bold text-gray-900">{stats.totalTokens}</span>
                </div>
                <div className="border-t border-gray-100"></div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-600 font-medium">Active</span>
                  </div>
                  <span className="text-xl font-bold text-green-600">{stats.activeTokens}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-gray-600 font-medium">Completed</span>
                  </div>
                  <span className="text-xl font-bold text-blue-600">{stats.completedTokens}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-600 font-medium">Cancelled</span>
                  </div>
                  <span className="text-xl font-bold text-red-600">{stats.cancelledTokens}</span>
                </div>

                <div className="border-t border-gray-100 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-purple-500" />
                      <span className="text-gray-600 font-medium">Total Wait Time</span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">
                      {formatDuration(stats.totalWaitTime * 60)}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Quick Actions
                </h2>
              </div>
              <div className="p-6 space-y-3">
                <button
                  onClick={() => router.push('/services')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white px-4 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300"
                >
                  Get New Token
                </button>
                <button
                  onClick={() => router.push('/notifications')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-xl font-semibold transition-all duration-300"
                >
                  View Notifications
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Token History */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-xl border border-gray-100"
            >
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 rounded-t-2xl">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Ticket className="w-6 h-6" />
                  Token History
                </h2>
              </div>

              {/* Search and Filters */}
              <div className="p-6 border-b border-gray-100 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by token number or service name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full sm:w-48 pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all appearance-none bg-white"
                    >
                      <option value="all">All Status</option>
                      <option value="ACTIVE">Active</option>
                      <option value="CALLED">Called</option>
                      <option value="IN_SERVICE">In Service</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                      <option value="NO_SHOW">No Show</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Token List */}
              <div className="p-6">
                {filteredTokens.length === 0 ? (
                  <div className="text-center py-12">
                    <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">No tokens found</p>
                    <p className="text-gray-400 mt-2">
                      {searchQuery || statusFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Get your first token to see it here'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTokens.map((token, index) => (
                      <motion.div
                        key={token.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.02 }}
                        className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 cursor-pointer"
                        onClick={() => router.push(`/token/${token.id}`)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {token.tokenNumber.slice(0, 2)}
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900 text-lg">{token.tokenNumber}</h3>
                              <p className="text-gray-500 text-sm">{token.service?.name}</p>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(token.status)}`}>
                            {token.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">Queue Position</p>
                            <p className="text-lg font-bold text-gray-900">#{token.queuePosition}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-medium mb-1">Wait Time</p>
                            <p className="text-lg font-bold text-purple-600">
                              {token.estimatedWaitTime ? formatDuration(token.estimatedWaitTime * 60) : 'N/A'}
                            </p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-gray-500 font-medium mb-1">Created</p>
                            <p className="text-sm font-semibold text-gray-700">{formatDateTime(token.createdAt)}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
