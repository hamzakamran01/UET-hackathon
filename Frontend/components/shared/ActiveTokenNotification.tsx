'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ArrowRight, Printer, Ticket } from 'lucide-react'
import { tokensAPI } from '@/lib/api'

interface ActiveToken {
  id: string
  tokenNumber: string
  status: string
  queuePosition: number
  serviceName?: string
}

export default function ActiveTokenNotification() {
  const router = useRouter()
  const pathname = usePathname()
  const [activeTokens, setActiveTokens] = useState<ActiveToken[]>([])
  const [dismissed, setDismissed] = useState(false)
  const [loading, setLoading] = useState(true)

  // Don't show on token pages, admin pages, or queue manager pages
  const isTokenPage = pathname?.startsWith('/token/')
  const isAdminPage = pathname?.startsWith('/admin')
  const isQueueManagerPage = pathname?.startsWith('/queue-manager')
  const shouldHide = isTokenPage || isAdminPage || isQueueManagerPage

  useEffect(() => {
    if (shouldHide) {
      setLoading(false)
      return
    }

    checkActiveTokens()
  }, [pathname])

  const checkActiveTokens = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')

      if (!accessToken) {
        setLoading(false)
        return
      }

      const response = await tokensAPI.getMyTokens()
      const tokens = response.data

      // Filter for active tokens only (ACTIVE, CALLED, IN_SERVICE)
      const activeTokensList = tokens
        .filter((token: any) => ['ACTIVE', 'CALLED', 'IN_SERVICE'].includes(token.status))
        .map((token: any) => ({
          id: token.id,
          tokenNumber: token.tokenNumber,
          status: token.status,
          queuePosition: token.queuePosition,
          serviceName: token.service?.name,
        }))

      setActiveTokens(activeTokensList)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const handlePrintToken = (tokenId: string) => {
    // Open token page in new window for printing
    const printWindow = window.open(`/token/${tokenId}?print=true`, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  const handleGoToToken = (tokenId: string) => {
    router.push(`/token/${tokenId}`)
  }

  const handleDismiss = () => {
    setDismissed(true)
  }

  // Don't render if loading, should hide, dismissed, or no active tokens
  if (loading || shouldHide || dismissed || activeTokens.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4"
      >
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl border-2 border-white/20 backdrop-blur-lg">
            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                {/* Left: Icon & Message */}
                <div className="flex items-center gap-4 flex-1">
                  <div className="bg-white/20 rounded-full p-3">
                    <Ticket className="w-6 h-6 text-white" />
                  </div>

                  <div className="text-white">
                    <h3 className="font-bold text-lg mb-1">
                      {activeTokens.length === 1 ? 'Active Token' : `${activeTokens.length} Active Tokens`}
                    </h3>
                    <p className="text-sm text-white/90">
                      {activeTokens.length === 1
                        ? `${activeTokens[0].tokenNumber} - ${activeTokens[0].serviceName || 'Service'} (Position #${activeTokens[0].queuePosition})`
                        : `You have ${activeTokens.length} active tokens in queue`
                      }
                    </p>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-3">
                  {/* Print Button */}
                  <button
                    onClick={() => handlePrintToken(activeTokens[0].id)}
                    className="px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all flex items-center gap-2 border border-white/20"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>

                  {/* View Token Button */}
                  <button
                    onClick={() => handleGoToToken(activeTokens[0].id)}
                    className="px-5 py-2.5 bg-white hover:bg-gray-100 text-purple-600 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg"
                  >
                    View Token
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {/* Dismiss Button */}
                  <button
                    onClick={handleDismiss}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Dismiss"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>

              {/* Multiple Tokens - Show All */}
              {activeTokens.length > 1 && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {activeTokens.slice(0, 3).map((token) => (
                      <button
                        key={token.id}
                        onClick={() => handleGoToToken(token.id)}
                        className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-left transition-all"
                      >
                        <p className="text-xs text-white/80">{token.serviceName}</p>
                        <p className="text-sm font-bold text-white">{token.tokenNumber}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
