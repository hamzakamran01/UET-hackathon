'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { adminAPI } from '@/lib/api'
import { User } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Users,
  ArrowLeft,
  RefreshCw,
  Search,
  Filter,
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  Ban,
  UserCheck,
  Calendar,
  Ticket,
  Activity,
  Eye,
  Shield,
  AlertTriangle,
  Download,
  MoreVertical,
} from 'lucide-react'

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [verificationFilter, setVerificationFilter] = useState<'all' | 'verified' | 'unverified'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    const adminToken = localStorage.getItem('adminAccessToken')
    if (!adminToken) {
      router.push('/admin/login')
      return
    }
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getUsers()
      setUsers(response.data)
    } catch (error: any) {
      toast.error('Failed to load users')
      if (error.response?.status === 401) {
        router.push('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async (userId: string, userName: string) => {
    const reason = prompt(`Ban user "${userName}"? Enter reason:`)
    if (!reason) return

    try {
      await adminAPI.banUser(userId, reason)
      toast.success('User banned successfully')
      fetchUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to ban user')
    }
  }

  const handleUnbanUser = async (userId: string, userName: string) => {
    if (!confirm(`Unban user "${userName}"?`)) return

    try {
      await adminAPI.unbanUser(userId)
      toast.success('User unbanned successfully')
      fetchUsers()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to unban user')
    }
  }

  const handleVerifyEmail = async (userId: string) => {
    try {
      await adminAPI.verifyUserEmail(userId)
      toast.success('Email verified')
      fetchUsers()
    } catch (error: any) {
      toast.error('Failed to verify email')
    }
  }

  const handleVerifyPhone = async (userId: string) => {
    try {
      await adminAPI.verifyUserPhone(userId)
      toast.success('Phone verified')
      fetchUsers()
    } catch (error: any) {
      toast.error('Failed to verify phone')
    }
  }

  const handleViewDetails = (user: User) => {
    setSelectedUser(user)
    setShowDetailsModal(true)
  }

  const handleExportUsers = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Email Verified', 'Phone Verified', 'Created At', 'Is Banned'].join(','),
      ...filteredUsers.map((u) =>
        [
          u.email || 'N/A',
          u.phone || 'N/A',
          u.emailVerified ? 'Yes' : 'No',
          u.phoneVerified ? 'Yes' : 'No',
          u.isBlocked ? 'Blocked' : 'Active',
          new Date(u.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-export-${Date.now()}.csv`
    a.click()
    toast.success('Users exported successfully')
  }

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone?.includes(searchQuery)

    const matchesVerification =
      verificationFilter === 'all' ||
      (verificationFilter === 'verified' && user.emailVerified && user.phoneVerified) ||
      (verificationFilter === 'unverified' && (!user.emailVerified || !user.phoneVerified))

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && !user.isBlocked) ||
      (statusFilter === 'banned' && user.isBlocked)

    return matchesSearch && matchesVerification && matchesStatus
  })

  const totalUsers = users.length
  const verifiedUsers = users.filter((u) => u.emailVerified && u.phoneVerified).length
  const bannedUsers = users.filter((u) => u.isBlocked).length

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
          <h2 className="text-2xl font-bold text-white tracking-tight">User Management</h2>
          <p className="text-slate-400">Monitor and manage user accounts and access</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportUsers}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2.5 rounded-xl border border-slate-700 transition-all font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={fetchUsers}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refresh List"
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
          <p className="text-slate-400 font-medium text-sm mb-1">Total Users</p>
          <h3 className="text-3xl font-bold text-white">{totalUsers}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <CheckCircle2 className="w-20 h-20 text-emerald-500" />
          </div>
          <p className="text-slate-400 font-medium text-sm mb-1">Verified Users</p>
          <h3 className="text-3xl font-bold text-white">{verifiedUsers}</h3>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-5 rounded-2xl relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Ban className="w-20 h-20 text-red-500" />
          </div>
          <p className="text-slate-400 font-medium text-sm mb-1">Banned Users</p>
          <h3 className="text-3xl font-bold text-white">{bannedUsers}</h3>
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
              placeholder="Search by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-600 transition-all text-sm"
            />
          </div>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
          >
            <option value="all">All Verification Status</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
          >
            <option value="all">All Account Status</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
          </select>
        </div>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-xl"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Contact Info</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Verification</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              <AnimatePresence mode="popLayout">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                        <Users className="w-8 h-8 text-slate-500" />
                      </div>
                      <p className="text-slate-300 text-lg font-medium">No users found</p>
                      <p className="text-slate-500 mt-1 text-sm">Try adjusting your search or filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold border border-slate-700">
                            {user.email?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-medium text-slate-200 text-sm">{user.email ? user.email.split('@')[0] : 'Unnamed'}</p>
                            <p className="text-xs text-slate-500 font-mono">ID: {user.id.slice(0, 6)}...</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {user.email && (
                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-2 text-slate-400 text-xs">
                              <Phone className="w-3 h-3" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            {user.emailVerified ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-slate-600" />
                            )}
                            <span className={`text-xs ${user.emailVerified ? 'text-emerald-400' : 'text-slate-500'}`}>Email</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {user.phoneVerified ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-slate-600" />
                            )}
                            <span className={`text-xs ${user.phoneVerified ? 'text-emerald-400' : 'text-slate-500'}`}>Phone</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.isBlocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-medium">
                            <Ban className="w-3 h-3" />
                            Banned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-medium">
                            <UserCheck className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-slate-400">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDateTime(user.createdAt).split(',')[0]}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleViewDetails(user)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors border border-slate-700"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {user.isBlocked ? (
                            <button
                              onClick={() => handleUnbanUser(user.id, user.email || user.phone || 'User')}
                              className="p-1.5 bg-slate-800 hover:bg-emerald-900/30 text-slate-400 hover:text-emerald-400 rounded-lg transition-colors border border-slate-700 hover:border-emerald-800"
                              title="Unban User"
                            >
                              <UserCheck className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBanUser(user.id, user.email || user.phone || 'User')}
                              className="p-1.5 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-lg transition-colors border border-slate-700 hover:border-red-800"
                              title="Ban User"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <h2 className="text-xl font-bold text-white">User Details</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  <div className="flex items-center gap-5 pb-6 border-b border-slate-800">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-3xl shadow-lg shadow-blue-900/20">
                      {selectedUser.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{selectedUser.email || selectedUser.phone || 'Unnamed User'}</h3>
                      <p className="text-slate-500 font-mono text-xs bg-slate-950 px-2 py-1 rounded w-fit border border-slate-800">
                        ID: {selectedUser.id}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Contact Info</p>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Mail className="w-4 h-4 text-slate-500" />
                          <span className="truncate">{selectedUser.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Phone className="w-4 h-4 text-slate-500" />
                          <span className="truncate">{selectedUser.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-2">Account Status</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Status</span>
                          <span className={`font-semibold ${selectedUser.isBlocked ? 'text-red-400' : 'text-emerald-400'}`}>
                            {selectedUser.isBlocked ? 'Banned' : 'Active'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">Joined</span>
                          <span className="text-slate-300">{formatDateTime(selectedUser.createdAt).split(',')[0]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-3">Verification Status</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-sm text-slate-300">Email</span>
                          {selectedUser.emailVerified ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              <XCircle className="w-3 h-3" /> Unverified
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
                          <span className="text-sm text-slate-300">Phone</span>
                          {selectedUser.phoneVerified ? (
                            <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                              <XCircle className="w-3 h-3" /> Unverified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800">
                    <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-500" /> Administrative Actions
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {!selectedUser.emailVerified && (
                        <button
                          onClick={() => {
                            handleVerifyEmail(selectedUser.id)
                            setShowDetailsModal(false)
                          }}
                          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-3 rounded-xl text-sm font-semibold transition-colors border border-slate-700"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Email Verified
                        </button>
                      )}

                      {!selectedUser.phoneVerified && (
                        <button
                          onClick={() => {
                            handleVerifyPhone(selectedUser.id)
                            setShowDetailsModal(false)
                          }}
                          className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-3 rounded-xl text-sm font-semibold transition-colors border border-slate-700"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Mark Phone Verified
                        </button>
                      )}

                      {selectedUser.isBlocked ? (
                        <button
                          onClick={() => {
                            handleUnbanUser(selectedUser.id, selectedUser.email || selectedUser.phone || 'User')
                            setShowDetailsModal(false)
                          }}
                          className="col-span-2 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/20"
                        >
                          <UserCheck className="w-4 h-4" />
                          Unban User Access
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            handleBanUser(selectedUser.id, selectedUser.email || selectedUser.phone || 'User')
                            setShowDetailsModal(false)
                          }}
                          className="col-span-2 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white px-4 py-3 rounded-xl text-sm font-semibold transition-colors shadow-lg shadow-red-900/20"
                        >
                          <Ban className="w-4 h-4" />
                          Ban User Access
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
