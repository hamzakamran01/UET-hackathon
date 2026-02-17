'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useSocket } from '@/lib/socket'
import { notificationsAPI } from '@/lib/api'
import { Notification, NotificationType } from '@/types'
import { formatDateTime, timeAgo } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  Filter,
  Clock,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  Ticket,
  User,
  Settings,
  ArrowLeft,
} from 'lucide-react'

export default function NotificationsPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { socket } = useSocket()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }
    fetchNotifications()
  }, [isAuthenticated])

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return

    socket.on('notification:new', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev])
      showNotificationToast(notification)
    })

    return () => {
      socket.off('notification:new')
    }
  }, [socket])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await notificationsAPI.getAll()
      setNotifications(response.data)
    } catch (error: any) {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const showNotificationToast = (notification: Notification) => {
    const icon = getNotificationIcon(notification.type)
    toast(notification.title, {
      description: notification.message,
      icon,
      duration: 5000,
    })

    // Browser notification
    if ('Notification' in window && window.Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.message,
        icon: '/logo.png',
      })
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await notificationsAPI.markAsRead(id)
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      )
    } catch (error) {
      toast.error('Failed to mark as read')
    }
  }

  const markAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead()
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      toast.success('All notifications marked as read')
    } catch (error) {
      toast.error('Failed to mark all as read')
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      await notificationsAPI.delete(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    } catch (error) {
      toast.error('Failed to delete notification')
    }
  }

  const clearAll = async () => {
    if (!confirm('Are you sure you want to delete all notifications?')) return

    try {
      await notificationsAPI.clearAll()
      setNotifications([])
      toast.success('All notifications cleared')
    } catch (error) {
      toast.error('Failed to clear notifications')
    }
  }

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TOKEN_ISSUED:
        return <Ticket className="w-5 h-5 text-blue-500" />
      case NotificationType.TOKEN_CALLED:
        return <Bell className="w-5 h-5 text-amber-500" />
      case NotificationType.TOKEN_SERVED:
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case NotificationType.TOKEN_COMPLETED:
        return <CheckCheck className="w-5 h-5 text-green-600" />
      case NotificationType.TOKEN_CANCELLED:
        return <XCircle className="w-5 h-5 text-red-500" />
      case NotificationType.PRESENCE_CHECK:
        return <AlertCircle className="w-5 h-5 text-orange-500" />
      case NotificationType.QUEUE_UPDATE:
        return <Clock className="w-5 h-5 text-purple-500" />
      case NotificationType.SYSTEM:
        return <Settings className="w-5 h-5 text-gray-500" />
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case NotificationType.TOKEN_ISSUED:
        return 'border-l-blue-500 bg-blue-50/50'
      case NotificationType.TOKEN_CALLED:
        return 'border-l-amber-500 bg-amber-50/50'
      case NotificationType.TOKEN_SERVED:
      case NotificationType.TOKEN_COMPLETED:
        return 'border-l-green-500 bg-green-50/50'
      case NotificationType.TOKEN_CANCELLED:
        return 'border-l-red-500 bg-red-50/50'
      case NotificationType.PRESENCE_CHECK:
        return 'border-l-orange-500 bg-orange-50/50'
      case NotificationType.QUEUE_UPDATE:
        return 'border-l-purple-500 bg-purple-50/50'
      default:
        return 'border-l-gray-500 bg-gray-50/50'
    }
  }

  const filteredNotifications = notifications.filter(n => {
    const matchesReadStatus =
      filter === 'all' ||
      (filter === 'unread' && !n.isRead) ||
      (filter === 'read' && n.isRead)

    const matchesType = typeFilter === 'all' || n.type === typeFilter

    return matchesReadStatus && matchesType
  })

  const unreadCount = notifications.filter(n => !n.isRead).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading notifications...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 shadow-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4"
            >
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-300 backdrop-blur-lg"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Bell className="w-8 h-8" />
                  Notifications
                </h1>
                <p className="text-blue-100 mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {notifications.length > 0 && (
                <>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl backdrop-blur-lg border border-white/30 transition-all duration-300"
                    >
                      <CheckCheck className="w-5 h-5" />
                      <span className="font-semibold hidden sm:inline">Mark All Read</span>
                    </button>
                  )}
                  <button
                    onClick={clearAll}
                    className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-white px-4 py-2 rounded-xl backdrop-blur-lg border border-red-300/30 transition-all duration-300"
                  >
                    <Trash2 className="w-5 h-5" />
                    <span className="font-semibold hidden sm:inline">Clear All</span>
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Status</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${filter === 'all'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${filter === 'unread'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
                <button
                  onClick={() => setFilter('read')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${filter === 'read'
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  Read
                </button>
              </div>
            </div>

            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              >
                <option value="all">All Types</option>
                <option value={NotificationType.TOKEN_ISSUED}>Token Issued</option>
                <option value={NotificationType.TOKEN_CALLED}>Token Called</option>
                <option value={NotificationType.TOKEN_SERVED}>Token Served</option>
                <option value={NotificationType.TOKEN_COMPLETED}>Token Completed</option>
                <option value={NotificationType.TOKEN_CANCELLED}>Token Cancelled</option>
                <option value={NotificationType.PRESENCE_CHECK}>Presence Check</option>
                <option value={NotificationType.QUEUE_UPDATE}>Queue Update</option>
                <option value={NotificationType.SYSTEM}>System</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Notifications List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center"
              >
                <BellOff className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications</h3>
                <p className="text-gray-500">
                  {filter !== 'all' || typeFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : "You're all caught up!"}
                </p>
              </motion.div>
            ) : (
              filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white rounded-2xl shadow-lg border-l-4 ${getNotificationColor(
                    notification.type
                  )} overflow-hidden hover:shadow-xl transition-all duration-300 ${!notification.isRead ? 'ring-2 ring-blue-500/20' : ''
                    }`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${notification.isRead ? 'bg-gray-100' : 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg'
                        }`}>
                        {notification.isRead ? (
                          getNotificationIcon(notification.type)
                        ) : (
                          <Bell className="w-6 h-6 text-white animate-pulse" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className={`font-bold text-lg ${notification.isRead ? 'text-gray-700' : 'text-gray-900'
                              }`}>
                              {notification.title}
                            </h3>
                            <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                              <Clock className="w-4 h-4" />
                              {timeAgo(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse flex-shrink-0"></div>
                          )}
                        </div>

                        <p className={`text-base mb-4 ${notification.isRead ? 'text-gray-600' : 'text-gray-800'
                          }`}>
                          {notification.message}
                        </p>

                        {notification.metadata && (
                          <div className="bg-gray-50 rounded-lg p-3 mb-4 text-sm">
                            <pre className="text-gray-700 font-mono text-xs overflow-x-auto">
                              {JSON.stringify(notification.metadata, null, 2)}
                            </pre>
                          </div>
                        )}

                        <div className="flex items-center gap-3">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="flex items-center gap-2 text-red-600 hover:text-red-700 font-semibold text-sm transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
