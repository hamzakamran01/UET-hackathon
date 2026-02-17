'use client';
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, CheckCircle2, Database, Zap, Lock, Users, ArrowRight, Sparkles } from 'lucide-react'

export default function WelcomeOverlay() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const hasVisited = localStorage.getItem('dqms_visited')
    if (!hasVisited) {
      setShow(true)
    }
  }, [])

  const handleContinue = () => {
    localStorage.setItem('dqms_visited', 'true')
    setShow(false)
  }

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900"
        >
          {/* Animated background grid */}
          <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-10" />

          {/* Gradient orbs */}
          <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />

          <div className="relative h-full overflow-y-auto">
            <div className="min-h-full flex items-center justify-center p-6">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-full max-w-4xl"
              >
                {/* Header Badge */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex justify-center mb-8"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full backdrop-blur-xl">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-300">Portfolio Showcase Version</span>
                  </div>
                </motion.div>

                {/* Main Card */}
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                  {/* Header */}
                  <div className="relative px-8 py-12 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 border-b border-white/10">
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
                    <div className="relative">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4, type: 'spring' }}
                        className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"
                      >
                        <Shield className="w-8 h-8 text-white" />
                      </motion.div>
                      <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        Digital Queue Management System
                      </h1>
                      <p className="text-center text-lg text-slate-300 max-w-2xl mx-auto">
                        Enterprise-Grade Queue Management Solution
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-8 md:p-12 space-y-8">
                    {/* Important Notice */}
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-amber-300 mb-2">
                            Portfolio Demonstration Version
                          </h3>
                          <p className="text-sm text-slate-300 leading-relaxed">
                            This is a comprehensive portfolio showcase of a production-ready queue management system.
                            Sample data has been integrated to demonstrate full functionality across all panels (User, Admin, Queue Manager).
                            Deployed on free-tier cloud infrastructure while maintaining <span className="font-semibold text-white">95%+ feature completeness</span> with
                            enterprise-grade architecture.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Technical Highlights */}
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-blue-400" />
                        Technical Architecture Highlights
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {[
                          { icon: Database, label: 'Real-time Data Sync', desc: 'WebSocket + Redis Pub/Sub' },
                          { icon: Zap, label: 'Background Jobs', desc: 'Bull Queue Processing' },
                          { icon: Lock, label: 'Enterprise Security', desc: 'JWT + Multi-factor Auth' },
                          { icon: Users, label: 'Multi-tenant Ready', desc: 'Scalable Architecture' },
                        ].map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                            className="flex items-start gap-3 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300"
                          >
                            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                              <item.icon className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                              <div className="font-semibold text-white text-sm">{item.label}</div>
                              <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Testing Credentials */}
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-green-400" />
                        Testing Credentials
                      </h3>
                      <div className="space-y-4">
                        {/* Admin Portal */}
                        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Shield className="w-5 h-5 text-blue-400" />
                            <h4 className="font-semibold text-blue-300">Admin Portal</h4>
                            <code className="ml-auto text-xs bg-black/30 px-2 py-1 rounded text-slate-400">/admin/login</code>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-slate-400 mb-1">Email</div>
                              <code className="block bg-black/40 px-3 py-2 rounded text-green-400 font-mono">
                                testingadmin@gmail.com
                              </code>
                            </div>
                            <div>
                              <div className="text-slate-400 mb-1">Password</div>
                              <code className="block bg-black/40 px-3 py-2 rounded text-green-400 font-mono">
                                abc123
                              </code>
                            </div>
                          </div>
                        </div>

                        {/* Queue Manager Portal */}
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="w-5 h-5 text-purple-400" />
                            <h4 className="font-semibold text-purple-300">Queue Manager Portal</h4>
                            <code className="ml-auto text-xs bg-black/30 px-2 py-1 rounded text-slate-400">/queue-manager/login</code>
                          </div>
                          <div className="grid md:grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="text-slate-400 mb-1">Email</div>
                              <code className="block bg-black/40 px-3 py-2 rounded text-green-400 font-mono">
                                testingadmin@gmail.com
                              </code>
                            </div>
                            <div>
                              <div className="text-slate-400 mb-1">Password</div>
                              <code className="block bg-black/40 px-3 py-2 rounded text-green-400 font-mono">
                                abc123
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Feature Completeness */}
                    <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold text-green-300 mb-2">Production-Ready Features</h4>
                          <ul className="text-sm text-slate-300 space-y-2">
                            <li className="flex items-start gap-2">
                              <span className="text-green-400">✓</span>
                              <span>Real-time queue updates with WebSocket connections</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-400">✓</span>
                              <span>Geolocation-based presence verification</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-400">✓</span>
                              <span>Automated queue management with Bull background jobs</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-400">✓</span>
                              <span>Comprehensive analytics dashboard with live data rendering</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-400">✓</span>
                              <span>Multi-layer security (JWT, Rate Limiting, Helmet.js)</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-green-400">✓</span>
                              <span>Redis caching & Prisma ORM with PostgreSQL</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-8 md:px-12 pb-12">
                    {/* Continue Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleContinue}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-4 px-8 rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-300 flex items-center justify-center gap-3 group"
                    >
                      <span className="text-lg">Continue to Application</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </motion.button>

                    {/* Developer Credit */}
                    <div className="mt-8 pt-8 border-t border-white/10">
                      <p className="text-center text-slate-400 text-sm">
                        Developed and Architected by
                      </p>
                      <p className="text-center mt-2">
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                          Hamza Kamran
                        </span>
                      </p>
                      <p className="text-center text-xs text-slate-500 mt-2">
                        Full-Stack Engineer • Cloud Architecture • Real-time Systems
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
