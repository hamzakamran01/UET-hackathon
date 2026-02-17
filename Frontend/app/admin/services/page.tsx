'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { adminAPI, servicesAPI } from '@/lib/api'
import { Service } from '@/types'
import { toast } from 'sonner'
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  Search,
  MapPin,
  Clock,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  Eye,
  Ticket,
} from 'lucide-react'

export default function AdminServicesPage() {
  const router = useRouter()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    location: '',
    latitude: 0,
    longitude: 0,
    operatingHours: '',
    avgServiceTime: 15,
    maxQueueSize: 100,
    presenceCheckRadius: 500,
    presenceCheckInterval: 300,
  })

  useEffect(() => {
    const adminToken = localStorage.getItem('adminAccessToken')
    if (!adminToken) {
      router.push('/admin/login')
      return
    }
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      const response = await servicesAPI.getAll()
      setServices(response.data)
    } catch (error: any) {
      toast.error('Failed to load services')
      if (error.response?.status === 401) {
        router.push('/admin/login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingService(null)
    setFormData({
      name: '',
      description: '',
      category: '',
      location: '',
      latitude: 0,
      longitude: 0,
      operatingHours: '9:00 AM - 5:00 PM',
      avgServiceTime: 15,
      maxQueueSize: 100,
      presenceCheckRadius: 500,
      presenceCheckInterval: 300,
    })
    setShowModal(true)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description || '',
      category: '',
      location: service.address || '',
      latitude: service.latitude || 0,
      longitude: service.longitude || 0,
      operatingHours: '9:00 AM - 5:00 PM',
      avgServiceTime: service.estimatedServiceTime || 15,
      maxQueueSize: service.maxConcurrentTokens || 100,
      presenceCheckRadius: service.geofenceRadius || 500,
      presenceCheckInterval: service.presenceGraceTime || 300,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingService) {
        await adminAPI.updateService(editingService.id, formData)
        toast.success('Service updated successfully')
      } else {
        await adminAPI.createService(formData)
        toast.success('Service created successfully')
      }
      setShowModal(false)
      fetchServices()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await adminAPI.deleteService(id)
      toast.success('Service deleted successfully')
      fetchServices()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete service')
    }
  }

  const handleToggleStatus = async (service: Service) => {
    try {
      await adminAPI.updateService(service.id, { isActive: !service.isActive })
      toast.success(`Service ${!service.isActive ? 'activated' : 'deactivated'}`)
      fetchServices()
    } catch (error: any) {
      toast.error('Failed to update service status')
    }
  }

  const filteredServices = services.filter((service) => {
    const matchesSearch =
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && service.isActive) ||
      (statusFilter === 'inactive' && !service.isActive)

    return matchesSearch && matchesStatus
  })

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
          <h2 className="text-2xl font-bold text-white tracking-tight">Services Management</h2>
          <p className="text-slate-400">Configure service queues and operational settings</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-blue-900/20 transition-all border border-blue-500/50"
        >
          <Plus className="w-5 h-5" />
          Create New Service
        </motion.button>
      </div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-4"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search services by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 placeholder:text-slate-600 transition-all"
            />
          </div>

          <div className="flex bg-slate-950/50 p-1 rounded-xl border border-slate-800">
            {[
              { id: 'all', label: 'All' },
              { id: 'active', label: 'Active' },
              { id: 'inactive', label: 'Inactive' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setStatusFilter(opt.id as any)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === opt.id
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AnimatePresence mode='popLayout'>
          {filteredServices.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              layoutId={`service-${service.id}`}
              className="group bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 hover:shadow-xl transition-all"
            >
              <div className={`h-1.5 w-full ${service.isActive ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-white truncate">{service.name}</h3>
                      {!service.isActive && (
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Inactive</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm line-clamp-2 min-h-[40px]">{service.description || 'No description provided.'}</p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(service)}
                    className="flex-shrink-0 focus:outline-none"
                    title={service.isActive ? "Deactivate Service" : "Activate Service"}
                  >
                    {service.isActive ? (
                      <ToggleRight className="w-10 h-10 text-emerald-500 hover:text-emerald-400 transition-colors" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-600 hover:text-slate-500 transition-colors" />
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-950/30 p-2 rounded-lg border border-slate-800/50">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <span className="truncate">{service.address || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-950/30 p-2 rounded-lg border border-slate-800/50">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>~{service.estimatedServiceTime} min</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-950/30 p-2 rounded-lg border border-slate-800/50">
                    <Ticket className="w-4 h-4 text-blue-400" />
                    <span>Max: {service.maxConcurrentTokens}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm bg-slate-950/30 p-2 rounded-lg border border-slate-800/50">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <span>Region: {service.geofenceRadius}m</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                  <button
                    onClick={() => handleEdit(service)}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-slate-700"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(service.id, service.name)}
                    className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-900/20 text-slate-400 hover:text-red-400 px-3 py-2 rounded-lg transition-colors border border-slate-700 hover:border-red-900/30"
                    title="Delete Service"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredServices.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-900/30 border border-slate-800 rounded-2xl border-dashed">
            <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-lg font-medium">No services found</p>
            <p className="text-slate-600 text-sm mt-1">
              {searchQuery || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Get started by creating a new service.'}
            </p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
                <h2 className="text-xl font-bold text-white">
                  {editingService ? 'Edit Service' : 'Create New Service'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-4">
                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">Service Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="e.g. General Consultation"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                      placeholder="Brief description of the service..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="e.g. Medical"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">Location/Room</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="e.g. Room 304"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">Avg Service Time (min)</label>
                      <input
                        type="number"
                        value={formData.avgServiceTime}
                        onChange={(e) => setFormData({ ...formData, avgServiceTime: parseInt(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 text-sm font-semibold mb-2">Max Queue Size</label>
                      <input
                        type="number"
                        value={formData.maxQueueSize}
                        onChange={(e) => setFormData({ ...formData, maxQueueSize: parseInt(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-semibold mb-2">Presence Check Radius (m)</label>
                    <input
                      type="number"
                      value={formData.presenceCheckRadius}
                      onChange={(e) => setFormData({ ...formData, presenceCheckRadius: parseInt(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                    <p className="text-xs text-slate-500 mt-1">Geofence radius for automated check-ins.</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-8 pt-6 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-colors border border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingService ? 'Update Service' : 'Create Service'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
