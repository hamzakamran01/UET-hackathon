'use client'
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Users, MapPin, Search, Filter, ArrowRight,
  Store, ChevronRight, Zap, AlertCircle
} from 'lucide-react'
import { servicesAPI } from '@/lib/api'
import { toast } from 'sonner'
import './../globals.css';

interface Service {
  id: string
  name: string
  description: string
  isActive: boolean
  geofenceRadius: number
  address: string
  averageWaitTime: number
  estimatedWaitTime: number
  _count: {
    tokens: number
  }
}

export default function ServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await servicesAPI.getAll()
      setServices(response.data)
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Connection timed out. Please check your internet.')
      } else {
        toast.error('Failed to load services. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())

    if (activeFilter === 'all') return matchesSearch
    if (activeFilter === 'active') return matchesSearch && service.isActive
    if (activeFilter === 'inactive') return matchesSearch && !service.isActive

    return matchesSearch
  })

  return (
    <div className="min-h-screen bg-slate-50">

      {/* 
        ------------------------------------
        HEADER SECTION
        ------------------------------------
      */}
      <div className="relative bg-white pt-32 pb-20 overflow-hidden border-b border-slate-200">
        <div className="absolute inset-0 bg-slate-50/50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50/50 to-transparent"></div>

        <div className="container-wide relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-6"
            >
              <Store className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                Service Directory
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight"
            >
              Find a Service & <span className="text-blue-600">Join the Queue</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-600 leading-relaxed"
            >
              Real-time wait updates for all our locations. Join remotely and arrive just in time.
            </motion.p>
          </div>

          {/* Search & Filter Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-200 flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, location, or service..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-slate-50 transition-colors"
                />
              </div>

              <div className="flex gap-2 p-1 overflow-x-auto">
                {[
                  { id: 'all', label: 'All Services' },
                  { id: 'active', label: 'Available Now' },
                  { id: 'inactive', label: 'Closed' }
                ].map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setActiveFilter(filter.id as any)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeFilter === filter.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 
        ------------------------------------
        SERVICES GRID
        ------------------------------------
      */}
      <div className="container-wide py-20">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 h-80 shadow-sm border border-slate-100 animate-pulse">
                <div className="h-40 bg-slate-100 rounded-xl mb-6"></div>
                <div className="h-6 bg-slate-100 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-6"></div>
                <div className="flex gap-4">
                  <div className="h-12 flex-1 bg-slate-100 rounded-lg"></div>
                  <div className="h-12 flex-1 bg-slate-100 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 bg-white rounded-3xl border border-slate-200 border-dashed"
          >
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No services found</h3>
            <p className="text-slate-500 max-w-sm mx-auto">
              We couldn't find any services matching "{searchQuery}". Try adjusting your filters or search terms.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
              className="mt-8 px-6 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredServices.map((service, index) => (
                <motion.div
                  key={service.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => service.isActive && router.push(`/services/${service.id}`)}
                  className={`group relative bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300 ${service.isActive
                      ? 'hover:shadow-xl hover:border-blue-200 cursor-pointer hover:-translate-y-1'
                      : 'opacity-75 cursor-not-allowed bg-slate-50'
                    }`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm backdrop-blur-md border ${service.isActive
                        ? 'bg-emerald-50/90 text-emerald-700 border-emerald-100'
                        : 'bg-slate-100/90 text-slate-600 border-slate-200'
                      }`}>
                      <span className={`w-2 h-2 rounded-full ${service.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}></span>
                      {service.isActive ? 'Live' : 'Closed'}
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-8">
                    <div className="mb-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${service.isActive ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                        <Store className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                        {service.description || 'Quick and efficient service for all your needs.'}
                      </p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 font-medium">
                          <Users className="w-3.5 h-3.5" /> Waiting
                        </div>
                        <div className="text-lg font-bold text-slate-900">
                          {service._count.tokens}
                        </div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1 font-medium">
                          <Clock className="w-3.5 h-3.5" /> Est. Time
                        </div>
                        <div className={`text-lg font-bold ${service.estimatedWaitTime > 30 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                          {Math.round(service.estimatedWaitTime || 0)}m
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    {service.address && (
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{service.address}</span>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className={`flex items-center justify-center w-full py-3 rounded-xl text-sm font-bold transition-all ${service.isActive
                        ? 'bg-slate-900 text-white group-hover:bg-blue-600 shadow-lg shadow-slate-900/10 group-hover:shadow-blue-600/20'
                        : 'bg-slate-200 text-slate-400'
                      }`}>
                      {service.isActive ? (
                        <>
                          Join Queue <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                      ) : (
                        'Currently Unavailable'
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

    </div>
  )
}
