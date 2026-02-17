'use client';


import { useState, useEffect } from 'react'

export default function DeveloperBadge() {
    const [isExpanded, setIsExpanded] = useState(true)
    const [isHovered, setIsHovered] = useState(false)

    useEffect(() => {
        // Collapse after 3 seconds
        const timer = setTimeout(() => {
            setIsExpanded(false)
        }, 3000)

        return () => clearTimeout(timer)
    }, [])

    const shouldShowFull = isExpanded || isHovered

    return (
        <div
            className="fixed top-4 left-4 z-[9998] pointer-events-auto select-none cursor-pointer"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="group relative">
                {/* Glow effect */}
                <div
                    className={`absolute inset-0 bg-gradient-to-r from-blue-500/40 to-purple-500/40 rounded-xl blur-xl transition-all duration-500 ${shouldShowFull ? 'opacity-70' : 'opacity-50'
                        } group-hover:opacity-100`}
                />

                {/* Main badge container */}
                <div
                    className={`relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl ring-1 ring-white/10 transition-all duration-500 ease-in-out ${shouldShowFull
                        ? 'px-5 py-2.5 hover:bg-slate-800/95'
                        : 'px-3 py-3 hover:bg-slate-800/95'
                        }`}
                >
                    <div className="flex items-center gap-2.5">
                        {/* Enterprise Code Icon */}
                        <div className="relative flex-shrink-0">
                            <svg
                                className={`transition-all duration-500 ${shouldShowFull ? 'w-5 h-5' : 'w-6 h-6'
                                    }`}
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                {/* Gradient Definition */}
                                <defs>
                                    <linearGradient id="codeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="50%" stopColor="#8b5cf6" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>

                                {/* Code Brackets Icon */}
                                <path
                                    d="M8 6L2 12L8 18"
                                    stroke="url(#codeGradient)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="animate-pulse"
                                />
                                <path
                                    d="M16 6L22 12L16 18"
                                    stroke="url(#codeGradient)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className="animate-pulse"
                                />
                                <path
                                    d="M13 4L11 20"
                                    stroke="url(#codeGradient)"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                    className="animate-pulse"
                                    style={{ animationDelay: '0.2s' }}
                                />
                            </svg>

                            {/* Animated ring around icon */}
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 animate-ping"
                                style={{ animationDuration: '2s' }} />
                        </div>

                        {/* Text content with smooth transition */}
                        <div
                            className={`overflow-hidden transition-all duration-500 ease-in-out ${shouldShowFull ? 'max-w-xs opacity-100' : 'max-w-0 opacity-0'
                                }`}
                        >
                            <p className="text-sm font-semibold tracking-wide text-white/90 whitespace-nowrap">
                                Developed by{' '}
                                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-bold">
                                    Hamza Kamran
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
