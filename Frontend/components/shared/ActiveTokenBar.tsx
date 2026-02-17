'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { tokensAPI } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { Ticket, ArrowRight, Loader2 } from 'lucide-react'

interface ActiveToken {
    id: string
    tokenNumber: string
    service: {
        name: string
    }
    status: string
}

export default function ActiveTokenBar() {
    const router = useRouter()
    const pathname = usePathname()
    const { isAuthenticated } = useAuthStore()
    const [activeToken, setActiveToken] = useState<ActiveToken | null>(null)
    const [loading, setLoading] = useState(true)

    const checkActiveToken = async () => {
        if (!isAuthenticated) {
            setLoading(false)
            return
        }

        try {
            // We'll use getMyTokens to find the first active one
            // Assuming getMyTokens returns a list of tokens
            // And we filter for 'ACTIVE', 'CALLED', 'IN_SERVICE'
            const response = await tokensAPI.getMyTokens()
            const tokens = response.data
            const current = tokens.find((t: any) =>
                ['ACTIVE', 'CALLED', 'IN_SERVICE'].includes(t.status)
            )

            setActiveToken(current || null)
        } catch (error) {
            console.error('Failed to check active tokens', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        checkActiveToken()

        // Poll every 30 seconds to keep it updated
        const interval = setInterval(checkActiveToken, 30000)
        return () => clearInterval(interval)
    }, [isAuthenticated, pathname]) // Re-check on path change too

    // Don't show if we are already on the token page
    if (activeToken && pathname === `/token/${activeToken.id}`) {
        return null
    }

    if (!activeToken) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-4 left-4 right-4 z-40 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl pointer-events-none"
            >
                <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-white/10 pointer-events-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeToken.status === 'CALLED' ? 'bg-amber-500 animate-pulse' :
                                activeToken.status === 'IN_SERVICE' ? 'bg-emerald-500' :
                                    'bg-blue-600'
                            }`}>
                            <Ticket className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                                {activeToken.status === 'CALLED' ? 'It\'s Your Turn!' :
                                    activeToken.status === 'IN_SERVICE' ? 'Now Serving' :
                                        'Active Token'}
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="font-bold text-lg">{activeToken.tokenNumber}</span>
                                <span className="text-sm text-slate-400 truncate max-w-[120px] md:max-w-xs">
                                    • {activeToken.service.name}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => router.push(`/token/${activeToken.id}`)}
                        className="flex-shrink-0 bg-white text-slate-900 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors flex items-center gap-2"
                    >
                        View
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    )
}
