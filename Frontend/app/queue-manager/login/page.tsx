'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { queueManagerAPI } from '@/lib/api'
import { toast } from 'sonner'
import { Eye, EyeOff, Lock, Mail, Activity, Shield } from 'lucide-react'

export default function QueueManagerLoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Redirect to dashboard if already logged in with valid token
  useEffect(() => {
    const checkAuth = async () => {
      const queueManagerToken = localStorage.getItem('queueManagerAccessToken')
      if (queueManagerToken) {
        try {
          // Validate token by making a simple API call
          await queueManagerAPI.getStats()
          // If successful, redirect to queue manager dashboard
          router.replace('/queue-manager')
        } catch (error) {
          // Token is invalid or expired, clear it
          localStorage.removeItem('queueManagerAccessToken')
          localStorage.removeItem('queueManagerRefreshToken')
          localStorage.removeItem('queueManagerRole')
          localStorage.removeItem('queueManagerName')
        }
      }
    }

    checkAuth()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await queueManagerAPI.login(formData)

      const { admin, token, accessToken } = response.data

      // Check if user is a queue manager (MODERATOR role)
      // TEMPORARILY DISABLED FOR TESTING
      // if (admin.role !== 'MODERATOR') {
      //   toast.error('Access denied. Queue Manager credentials required.')
      //   setLoading(false)
      //   return
      // }

      // Store the token (use token or accessToken, whichever is available)
      const authToken = token || accessToken
      localStorage.setItem('queueManagerAccessToken', authToken)
      localStorage.setItem('queueManagerRole', admin.role)
      localStorage.setItem('queueManagerName', admin.name)

      // Store refresh token if available
      if (response.data.refreshToken) {
        localStorage.setItem('queueManagerRefreshToken', response.data.refreshToken)
      }

      toast.success(`Welcome back, ${admin.name}!`)

      // Small delay to ensure localStorage is saved
      setTimeout(() => {
        router.push('/queue-manager')
      }, 100)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Invalid credentials'
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl shadow-2xl mb-6">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Queue Manager</h1>
          <p className="text-slate-600">Manage your service queue efficiently</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-8"
        >
          <div className="flex items-center gap-2 mb-6 px-4 py-3 bg-indigo-50 rounded-2xl border border-indigo-100">
            <Shield className="w-5 h-5 text-indigo-600" />
            <p className="text-sm text-indigo-800 font-medium">
              Queue Manager Access Portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-slate-700 font-semibold mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900 font-medium"
                  placeholder="manager@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-12 pr-12 py-4 border-2 border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-slate-900 font-medium"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In to Dashboard'
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Need admin access?{' '}
              <button
                onClick={() => router.push('/admin/login')}
                className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
              >
                Admin Login
              </button>
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-slate-600 text-sm">
            © 2025 DQMS. All rights reserved.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
