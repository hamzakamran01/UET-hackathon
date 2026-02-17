"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronRight, Check } from "lucide-react"

export interface Step {
    target: string
    title: string
    description: string
    position?: "top" | "bottom" | "left" | "right"
}

interface WalkthroughOverlayProps {
    steps: Step[]
    onComplete: () => void
    show: boolean
}

export function WalkthroughOverlay({ steps, onComplete, show }: WalkthroughOverlayProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0, height: 0 })

    useEffect(() => {
        if (show && steps[currentStep]) {
            const updatePosition = () => {
                const element = document.querySelector(steps[currentStep].target)
                if (element) {
                    const rect = element.getBoundingClientRect()
                    setPosition({
                        top: rect.top + window.scrollY,
                        left: rect.left + window.scrollX,
                        width: rect.width,
                        height: rect.height,
                    })

                    // Scroll element into view if needed
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
            }

            // Initial update
            updatePosition()

            // Update on resize
            window.addEventListener('resize', updatePosition)
            // Update on scroll (optional, but good for dynamic pages)
            window.addEventListener('scroll', updatePosition)

            return () => {
                window.removeEventListener('resize', updatePosition)
                window.removeEventListener('scroll', updatePosition)
            }
        }
    }, [currentStep, show, steps])

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            onComplete()
        }
    }

    if (!show) return null

    const step = steps[currentStep]

    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-50 pointer-events-none">
                    {/* Backdrop with hole */}
                    <div className="absolute inset-0 bg-slate-900/60 transition-colors duration-500 clip-path-hole" />

                    {/* Spotlight Effect (simulated with large borders or multiple divs, but for simplicity using absolute positioning + shadow ring) */}
                    <motion.div
                        layoutId="highlight-box"
                        className="absolute border-2 border-blue-500 rounded-xl shadow-[0_0_0_9999px_rgba(15,23,42,0.8)] pointer-events-none transition-all duration-500 ease-in-out z-10"
                        style={{
                            top: position.top,
                            left: position.left,
                            width: position.width,
                            height: position.height
                        }}
                        initial={false}
                        animate={{
                            top: position.top - 4,
                            left: position.left - 4,
                            width: position.width + 8,
                            height: position.height + 8
                        }}
                    />

                    {/* Tooltip Card */}
                    <div className="absolute inset-0 pointer-events-auto flex items-center justify-center pointer-events-none"> {/* This wrapper is just to contain specific absolute children */}
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="absolute bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full pointer-events-auto border border-slate-100"
                            style={{
                                // Rudimentary positioning logic
                                top: step.position === 'top' ? position.top - 200 :
                                    step.position === 'bottom' ? position.top + position.height + 20 :
                                        'auto',
                                left: step.position === 'left' ? position.left - 340 :
                                    step.position === 'right' ? position.left + position.width + 20 :
                                        Math.max(20, Math.min(window.innerWidth - 340, position.left)), // Default centerish horizontal
                                // Fallback to center screen if no specific position or target not found? 
                                // For now let's assume valid target + default calculation
                                ...(step.position === 'top' ? { transform: 'translateY(-100%)' } : {}),
                            }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1 block">
                                        Step {currentStep + 1} of {steps.length}
                                    </span>
                                    <h3 className="text-lg font-bold text-slate-900">{step.title}</h3>
                                </div>
                                <button
                                    onClick={onComplete}
                                    className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                                {step.description}
                            </p>

                            <div className="flex justify-between items-center">
                                <div className="flex gap-1.5">
                                    {steps.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-blue-600' : 'bg-slate-200'
                                                }`}
                                        />
                                    ))}
                                </div>

                                <button
                                    onClick={handleNext}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-slate-900/10 hover:shadow-xl hover:scale-105"
                                >
                                    {currentStep === steps.length - 1 ? (
                                        <>
                                            Get Started <Check className="w-4 h-4" />
                                        </>
                                    ) : (
                                        <>
                                            Next <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    )
}
