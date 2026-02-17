'use client'
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSocket } from '@/lib/socket'
import { tokensAPI, presenceAPI } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Users, MapPin, CheckCircle, XCircle, AlertCircle,
  Printer, Download, Share2, Signal, Store, ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import './../../globals.css';

interface Token {
  id: string
  tokenNumber: string
  status: string
  queuePosition: number
  estimatedWaitTime: number
  service: {
    name: string
    geofenceRadius: number
    latitude: number
    longitude: number
  }
}

interface QueueInfo {
  position: number
  ahead: number
  behind: number
  total: number
}

export default function TokenDashboard() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { socket, isConnected, joinToken, leaveToken } = useSocket()
  const tokenId = params.id as string
  const isPrintMode = searchParams.get('print') === 'true'
  const tokenCardRef = useRef<HTMLDivElement>(null)

  const [token, setToken] = useState<Token | null>(null)
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null)
  const [isWithinGeofence, setIsWithinGeofence] = useState(false)
  const [distance, setDistance] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Geolocation tracking
  const checkPresence = useCallback(async () => {
    if (!navigator.geolocation || !tokenId) {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser')
      }
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords

        try {
          const response = await presenceAPI.checkPresence(
            tokenId,
            latitude,
            longitude,
            accuracy
          )

          setIsWithinGeofence(response.data.isWithinGeofence)
          setDistance(response.data.distance)

          if (!response.data.isWithinGeofence) {
            toast.warning(`You are ${Math.round(response.data.distance)}m away from the service location`)
          }
        } catch (error) {
          // Silently fail
        }
      },
      (error) => {
        // Only show error if we haven't successfully checked yet
        if (loading) {
          toast.error('Unable to access location. Please enable location services.')
        }
      },
      { enableHighAccuracy: true }
    )
  }, [tokenId, loading])

  // Fetch initial token data
  useEffect(() => {
    if (!tokenId) return

    const fetchToken = async () => {
      setLoading(true)
      setError(null)
      try {
        const [tokenRes, positionRes] = await Promise.all([
          tokensAPI.getById(tokenId),
          tokensAPI.getPosition(tokenId),
        ])
        setToken(tokenRes.data)
        setQueueInfo(positionRes.data)
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load token data'
        setError(errorMessage)
        console.error('Failed to fetch token:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchToken()
  }, [tokenId])

  // Join WebSocket room
  useEffect(() => {
    if (tokenId && socket && isConnected) {
      joinToken(tokenId)

      return () => {
        leaveToken(tokenId)
      }
    }
  }, [tokenId, socket, isConnected, joinToken, leaveToken])

  // Listen to WebSocket events
  useEffect(() => {
    if (!socket || !tokenId) return

    const handleTokenUpdate = (data: any) => {
      setToken(data.token)
      setQueueInfo(data.queueInfo)
    }

    const handleQueueUpdate = () => {
      const currentTokenId = tokenId
      if (currentTokenId) {
        tokensAPI.getPosition(currentTokenId).then((res) => {
          setQueueInfo(res.data)
        }).catch(() => {
          // Silently fail if position fetch fails
        })
      }
    }

    const handleYourTurn = () => {
      toast.success('It\'s your turn! Please proceed to the counter.', {
        duration: 10000,
      })

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Your Turn!', {
          body: 'Please proceed to the counter.',
          icon: '/logo.png', // Ensure this exists or use a placeholder
        })
      }
    }

    const handlePresenceCheck = () => {
      toast.info('Please enable location to confirm your presence')
      checkPresence()
    }

    const handleTokenCancelled = (data: any) => {
      toast.error(`Token cancelled: ${data.reason}`)
      router.push('/')
    }

    socket.on('token:update', handleTokenUpdate)
    socket.on('queue:update', handleQueueUpdate)
    socket.on('token:your_turn', handleYourTurn)
    socket.on('presence:check_required', handlePresenceCheck)
    socket.on('token:cancelled', handleTokenCancelled)

    return () => {
      socket.off('token:update', handleTokenUpdate)
      socket.off('queue:update', handleQueueUpdate)
      socket.off('token:your_turn', handleYourTurn)
      socket.off('presence:check_required', handlePresenceCheck)
      socket.off('token:cancelled', handleTokenCancelled)
    }
  }, [socket, tokenId, router, checkPresence])


  // Auto-check presence every 30 seconds
  useEffect(() => {
    if (!token || token.status !== 'ACTIVE') return

    const interval = setInterval(() => {
      checkPresence()
    }, 30000)

    // Initial check
    checkPresence()

    return () => clearInterval(interval)
  }, [token, checkPresence])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleCancelToken = async () => {
    if (!confirm('Are you sure you want to cancel this token?')) return

    try {
      await tokensAPI.cancel(tokenId, 'User cancelled')
      toast.success('Token cancelled successfully')
      router.push('/')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel token'
      toast.error(errorMessage)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    try {
      toast.info('Generating PDF...')

      const tokenCard = tokenCardRef.current
      if (!tokenCard) {
        toast.error('Failed to find token card')
        return
      }

      // Create clone
      const clone = tokenCard.cloneNode(true) as HTMLElement
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.left = '-9999px'
      tempContainer.style.top = '0'
      tempContainer.style.width = '800px'
      tempContainer.style.background = 'white'
      tempContainer.style.padding = '40px'

      // Force light mode styles for PDF
      clone.style.background = 'white';
      clone.style.color = 'black';
      clone.style.boxShadow = 'none';
      clone.style.border = '2px solid #e2e8f0';

      tempContainer.appendChild(clone)
      document.body.appendChild(tempContainer)

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
      })

      document.body.removeChild(tempContainer)

      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgData = canvas.toDataURL('image/png')

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`Token-${token?.tokenNumber || 'Unknown'}.pdf`)
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try Print instead.')
    }
  }

  const handleShare = async () => {
    const shareUrl = window.location.href

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Token ${token?.tokenNumber}`,
          text: `My queue token for ${token?.service.name}`,
          url: shareUrl,
        })
      } catch (error) {
        // Share cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl)
        toast.success('Link copied to clipboard!')
      } catch (error) {
        toast.error('Failed to copy link')
      }
    }
  }

  // Auto-print if in print mode
  useEffect(() => {
    if (isPrintMode && token) {
      setTimeout(() => {
        window.print()
      }, 1000)
    }
  }, [isPrintMode, token])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Loading your token...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8 bg-white rounded-3xl shadow-xl max-w-md mx-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Token Not Found</h2>
          <p className="text-slate-500 mb-6">We couldn't find the token you're looking for. It may have expired or been cancelled.</p>
          <button
            onClick={() => router.push('/')}
            className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  const progressPercentage = queueInfo?.total
    ? ((queueInfo.total - queueInfo.ahead) / queueInfo.total) * 100
    : 0

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:py-12 relative overflow-hidden">
      {/* Background Mesh */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-purple-50/40 to-transparent pointer-events-none"></div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 0; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .token-card-container { 
            box-shadow: none !important; 
            border: 2px solid #000 !important;
            margin: 20mm !important;
            page-break-inside: avoid;
          }
        }
        .print-only { display: none; }
      `}</style>

      <div className="max-w-2xl mx-auto relative z-10 w-full">
        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute top-0 right-0 lg:-right-32 flex items-center gap-2 px-3 py-1 bg-white/50 backdrop-blur-md rounded-full border border-slate-200 shadow-sm text-xs font-medium no-print ${isConnected ? 'text-emerald-700' : 'text-amber-600'
            }`}
        >
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
          {isConnected ? 'Live Updates' : 'Connecting...'}
        </motion.div>

        {/* Dashboard Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 no-print"
        >
          <h1 className="text-2xl font-bold text-slate-800 mb-1">{token.service.name}</h1>
          <p className="text-slate-500">Live Status Dashboard</p>
        </motion.div>

        {/* Action Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 sm:gap-3 mb-8 justify-center no-print"
        >
          <button
            onClick={handlePrint}
            className="p-3 sm:px-4 sm:py-3 bg-white border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            title="Print Ticket"
          >
            <Printer className="w-5 h-5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="p-3 sm:px-4 sm:py-3 bg-white border border-slate-200 hover:border-purple-300 text-slate-600 hover:text-purple-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            title="Save as PDF"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Save PDF</span>
          </button>

          <button
            onClick={handleShare}
            className="p-3 sm:px-4 sm:py-3 bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-600 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            title="Share Link"
          >
            <Share2 className="w-5 h-5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={handleCancelToken}
            className="ml-auto px-4 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            title="Leave Queue"
          >
            <XCircle className="w-5 h-5" />
            <span className="hidden sm:inline">Cancel</span>
          </button>
        </motion.div>

        {/* DIGITAL TICKET CARD */}
        <motion.div
          ref={tokenCardRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="token-card-container bg-white rounded-3xl shadow-2xl p-6 sm:p-10 mb-8 border border-white/50 backdrop-blur-xl relative overflow-hidden"
        >
          {/* Card Decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

          {/* Print Header */}
          <div className="print-only text-center mb-8 border-b border-gray-200 pb-4">
            <h1 className="text-3xl font-bold">DIGITAL QUEUE TOKEN</h1>
            <p className="text-gray-500 uppercase tracking-widest text-sm mt-1">{token.service.name}</p>
          </div>

          <div className="text-center relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full mb-6 max-w-fit mx-auto no-print">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Official Digital Token</span>
            </div>

            <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-2">Your Token Number</p>

            <motion.div
              layout
              className="relative inline-block"
            >
              <h1 className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tighter mb-4 tabular-nums">
                {token.tokenNumber}
              </h1>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl -z-10 rounded-full"></div>
            </motion.div>

            {/* Status Banner */}
            <div className="flex justify-center mb-8">
              <div className={`px-6 py-2 rounded-xl border flex items-center gap-2 shadow-sm ${token.status === 'ACTIVE'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                : token.status === 'CALLED'
                  ? 'bg-amber-50 border-amber-100 text-amber-700 animate-pulse'
                  : 'bg-slate-100 border-slate-200 text-slate-600'
                }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${token.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' :
                  token.status === 'CALLED' ? 'bg-amber-500' : 'bg-slate-400'
                  }`}></span>
                <span className="font-bold text-sm tracking-wide uppercase">
                  {token.status === 'ACTIVE' && 'Waiting in Queue'}
                  {token.status === 'CALLED' && 'It is Your Turn!'}
                  {token.status === 'IN_SERVICE' && 'Being Served'}
                  {!['ACTIVE', 'CALLED', 'IN_SERVICE'].includes(token.status) && token.status}
                </span>
              </div>
            </div>

            {/* Progress Section */}
            {queueInfo && (
              <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-100 mb-8 max-w-sm mx-auto backdrop-blur-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-semibold text-slate-500">Queue Progress</span>
                  <span className="text-sm font-bold text-slate-900">
                    <span className="text-blue-600">{queueInfo.ahead}</span> people ahead
                  </span>
                </div>

                <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.8, ease: "circOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                  />
                </div>

                <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
                  <span>Position #{queueInfo.position}</span>
                  <span>Total: {queueInfo.total}</span>
                </div>
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <Clock className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {Math.round((token.estimatedWaitTime || 0) / 60)}<span className="text-sm font-medium text-slate-400 ml-1">m</span>
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase">Est. Wait</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <MapPin className={`w-6 h-6 mx-auto mb-2 ${isWithinGeofence ? 'text-emerald-500' : 'text-amber-500'}`} />
                <div className="text-2xl font-bold text-slate-900 tabular-nums">
                  {distance < 1000 ? Math.round(distance) : (distance / 1000).toFixed(1)}<span className="text-sm font-medium text-slate-400 ml-1">{distance < 1000 ? 'm' : 'km'}</span>
                </div>
                <div className="text-xs font-semibold text-slate-400 uppercase">{isWithinGeofence ? 'In Range' : 'Away'}</div>
              </div>
            </div>

            {/* Print Footer with QR */}
            <div className="print-only mt-12 pt-8 border-t-2 border-dashed border-gray-300">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-bold text-lg mb-1">{token.service.name}</p>
                  <p className="text-sm text-gray-500">Please arrive 5 mins before your turn.</p>
                  <p className="text-xs text-gray-400 mt-4">Issued: {new Date().toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '')}`}
                    alt="Token QR"
                    className="w-24 h-24 border-2 border-gray-200 rounded-lg mb-1"
                  />
                  <p className="text-[10px] text-gray-400">Scan for updates</p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Guidelines */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center max-w-md mx-auto no-print"
        >
          <p className="text-xs text-slate-400 mb-2">Token ID: {token.id}</p>
          <p className="text-sm text-slate-500">
            Please keep this screen open. We will automatically notify you when it's your turn.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
