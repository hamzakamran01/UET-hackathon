'use client';
import { Home, Building2, User, Bell, LogOut, Menu, X, Settings, Ticket, Shield, ChevronDown, LayoutDashboard } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { AnimatePresence, motion } from 'framer-motion';

export default function Header() {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/')
    setShowUserMenu(false)
  }

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Services', href: '/services', icon: Building2 },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50' : 'bg-transparent'
          }`}
      >
        <div className="container-wide">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2.5 group"
              >
                <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 group-hover:scale-105 transition-all duration-300">
                  <Ticket className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start leading-none">
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                    DQMS
                  </span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
                    Enterprise
                  </span>
                </div>
              </button>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1 bg-slate-100/50 p-1 rounded-full border border-slate-200/50 backdrop-blur-sm">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <button
                      key={item.name}
                      onClick={() => router.push(item.href)}
                      className={`relative flex items-center gap-2 px-5 py-2 rounded-full font-medium text-sm transition-all duration-300 ${active
                          ? 'text-blue-600 bg-white shadow-sm ring-1 ring-slate-200'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'fill-current opacity-20' : ''}`} />
                      {item.name}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  {/* Notifications Button */}
                  <button
                    onClick={() => router.push('/notifications')}
                    className="p-2.5 rounded-full hover:bg-slate-100 transition-colors relative group"
                  >
                    <Bell className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                  </button>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-3 pl-1 pr-4 py-1 rounded-full border border-slate-200 hover:border-blue-300 hover:shadow-soft bg-white transition-all duration-300 group"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                        {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="hidden sm:flex flex-col items-start leading-none gap-0.5">
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">
                          {user?.name || 'User'}
                        </span>
                        <span className="text-[10px] text-slate-500">Account</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showUserMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* User Dropdown */}
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.96 }}
                          className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden ring-1 ring-slate-900/5 focus:outline-none"
                        >
                          <div className="p-4 bg-slate-50 border-b border-slate-100">
                            <p className="font-bold text-slate-900">{user?.name || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate mt-0.5">{user?.email || user?.phone}</p>
                          </div>

                          <div className="p-2 space-y-1">
                            <button
                              onClick={() => {
                                router.push('/profile')
                                setShowUserMenu(false)
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                <User className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <span className="block text-sm font-semibold">My Profile</span>
                                <span className="block text-xs text-slate-500">Manage your account</span>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                router.push('/notifications')
                                setShowUserMenu(false)
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                                <Bell className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <span className="block text-sm font-semibold">Notifications</span>
                                <span className="block text-xs text-slate-500">Check your alerts</span>
                              </div>
                            </button>

                            <button
                              onClick={() => {
                                router.push('/settings')
                                setShowUserMenu(false)
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-colors group"
                            >
                              <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                                <Settings className="w-4 h-4" />
                              </div>
                              <div className="text-left">
                                <span className="block text-sm font-semibold">Settings</span>
                                <span className="block text-xs text-slate-500">Preferences</span>
                              </div>
                            </button>
                          </div>

                          <div className="p-2 border-t border-slate-100">
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              <span className="font-semibold text-sm">Sign Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => router.push('/services')}
                  className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Get Token</span>
                </button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                {showMobileMenu ? (
                  <X className="w-6 h-6 text-slate-600" />
                ) : (
                  <Menu className="w-6 h-6 text-slate-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-xl shadow-lg"
            >
              <div className="px-4 py-6 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        router.push(item.href)
                        setShowMobileMenu(false)
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl font-semibold transition-all ${active
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </button>
                  )
                })}

                {!isAuthenticated && (
                  <div className="pt-4 mt-4 border-t border-slate-100">
                    <button
                      onClick={() => {
                        router.push('/services')
                        setShowMobileMenu(false)
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold shadow-lg shadow-blue-500/25"
                    >
                      <Ticket className="w-5 h-5" />
                      Get Token
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Spacer to prevent content overlap */}
      <div className="h-20" />

      {/* Admin Mode Indicator */}
      {pathname.startsWith('/admin') && (
        <div className="bg-slate-900 text-white px-4 py-2 relative z-40">
          <div className="container-wide flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
              <Shield className="w-3 h-3 text-blue-400" />
              <span>Admin Console</span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-white text-xs font-medium transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Exit
            </button>
          </div>
        </div>
      )}
    </>
  )
}
