'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, ArrowLeft } from 'lucide-react'

interface CancelTokenModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    isCancelling: boolean
}

export function CancelTokenModal({ isOpen, onClose, onConfirm, isCancelling }: CancelTokenModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
                    >
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                Leave the queue?
                            </h3>
                            <p className="text-slate-600 mb-8">
                                You will lose your current position. If you decide to join again later, you'll be placed at the end of the line.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={onClose}
                                    disabled={isCancelling}
                                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Keep my spot
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={isCancelling}
                                    className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isCancelling ? 'Cancelling...' : 'Yes, leave queue'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
