'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, MessageSquare, Loader2, ThumbsUp } from 'lucide-react'
import { tokensAPI } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface FeedbackModalProps {
    isOpen: boolean
    onClose: () => void
    tokenId: string
    serviceName: string
    onSuccess?: () => void
}

export function FeedbackModal({ isOpen, onClose, tokenId, serviceName, onSuccess }: FeedbackModalProps) {
    const [rating, setRating] = useState(0)
    const [hoverRating, setHoverRating] = useState(0)
    const [feedback, setFeedback] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    const handleSubmit = async () => {
        if (rating === 0) {
            toast.error('Please select a rating')
            return
        }

        try {
            setIsSubmitting(true)
            await tokensAPI.submitFeedback(tokenId, rating, feedback)

            setIsSubmitted(true)
            toast.success('Thank you for your feedback!')

            // Allow user to see the success state briefly before closing or callback
            setTimeout(() => {
                if (onSuccess) onSuccess()
                onClose()
            }, 2000)
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to submit feedback')
            setIsSubmitting(false)
        }
    }

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
                        {/* Close Button */}
                        {!isSubmitted && (
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}

                        <div className="p-8">
                            {!isSubmitted ? (
                                /* Feedback Form */
                                <div className="text-center space-y-6">
                                    <div>
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 rotate-3">
                                            <MessageSquare className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">How was {serviceName}?</h2>
                                        <p className="text-slate-500">Your feedback helps us improve our service.</p>
                                    </div>

                                    {/* Star Rating */}
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                                className="group relative p-1 transition-transform hover:scale-110 focus:outline-none"
                                            >
                                                <Star
                                                    className={cn(
                                                        "w-8 h-8 transition-colors duration-200",
                                                        (hoverRating || rating) >= star
                                                            ? "fill-amber-400 text-amber-400"
                                                            : "fill-slate-100 text-slate-300"
                                                    )}
                                                />
                                            </button>
                                        ))}
                                    </div>

                                    {/* Rating Label */}
                                    <div className="h-6 text-sm font-medium text-blue-600">
                                        {rating === 1 && "Terrible"}
                                        {rating === 2 && "Bad"}
                                        {rating === 3 && "Okay"}
                                        {rating === 4 && "Good"}
                                        {rating === 5 && "Excellent!"}
                                    </div>

                                    {/* Feedback Textarea */}
                                    <div className="relative">
                                        <textarea
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Tell us what you liked or what we can do better..."
                                            className="w-full h-32 p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none resize-none text-slate-900 placeholder:text-slate-400"
                                        />
                                    </div>

                                    {/* Submit Button */}
                                    <button
                                        onClick={handleSubmit}
                                        disabled={isSubmitting || rating === 0}
                                        className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit Feedback'
                                        )}
                                    </button>
                                </div>
                            ) : (
                                /* Success State */
                                <div className="text-center py-8 space-y-6">
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600"
                                    >
                                        <ThumbsUp className="w-10 h-10" />
                                    </motion.div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Thanks for sharing!</h2>
                                        <p className="text-slate-500">We appreciate your feedback.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
