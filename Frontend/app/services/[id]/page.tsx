'use client'


import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Users, MapPin, Shield, CheckCircle, Mail,
  ArrowRight, ArrowLeft, Loader2, AlertCircle, Store, Zap, ChevronRight
} from 'lucide-react'
import { servicesAPI, authAPI, tokensAPI } from '@/lib/api'
import { toast } from 'sonner'
import './../../globals.css';
import { useAuthStore } from '@/store/authStore'
import { Skeleton } from '@/components/ui/Skeleton'
import { WalkthroughOverlay, Step as TourStep } from '@/components/ui/WalkthroughOverlay'

interface Service {
  id: string
  name: string
  description: string
  address: string
  geofenceRadius: number
  presenceGraceTime: number
  counterReachTime: number
  averageWaitTime: number
  _count: { tokens: number }
}

enum Step {
  SERVICE_DETAILS,
  EMAIL_VERIFICATION,
  CREATING_TOKEN,
}

export default function ServiceDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.id as string
  const { isAuthenticated, user } = useAuthStore()

  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(Step.SERVICE_DETAILS)

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false)

  const tourSteps: TourStep[] = [
    {
      target: '#service-card-tour',
      title: 'Detailed Service Info',
      description: 'View live status, wait times, and location details for this service.',
      position: 'right'
    },
    {
      target: '#queue-stats-tour',
      title: 'Live Queue Stats',
      description: 'Check how many people are ahead of you and the estimated wait time before joining.',
      position: 'bottom'
    },
    {
      target: '#join-flow-tour',
      title: 'Join the Queue',
      description: isAuthenticated
        ? 'Since you are signed in, you can join instantly with our One-Tap Join feature!'
        : 'Enter your email to verify your identity and secure your spot in line.',
      position: 'left'
    }
  ]

  useEffect(() => {
    // Check if user has seen tutorial
    const hasSeen = localStorage.getItem('hasSeenServiceTutorial_v1')
    if (!hasSeen && !loading && service) {
      setTimeout(() => setShowTutorial(true), 1000) // Small delay for animations to finish
      localStorage.setItem('hasSeenServiceTutorial_v1', 'true')
    }
  }, [loading, service])

  // Email verification state
  const [email, setEmail] = useState('')
  const [emailOtp, setEmailOtp] = useState('')
  const [emailOtpSent, setEmailOtpSent] = useState(false)

  // Existing token check
  const [existingToken, setExistingToken] = useState<any>(null)
  const [checkingExisting, setCheckingExisting] = useState(false)

  // Loading states
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [creatingToken, setCreatingToken] = useState(false)

  useEffect(() => {
    fetchService()
  }, [serviceId])

  const fetchService = async () => {
    try {
      setLoading(true)
      const response = await servicesAPI.getById(serviceId)
      setService(response.data)
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        toast.error('Connection timed out. Please check your internet.')
      } else if (error.response?.status === 404) {
        toast.error('Service not found')
      } else {
        toast.error('Failed to load service. Please try again.')
      }
      router.push('/services')
    } finally {
      setLoading(false)
    }
  }

  // Step 1: Email Verification
  const handleSendEmailOtp = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      setSendingOtp(true)
      setCheckingExisting(true)

      // Check if email already has a token for this service
      const checkResponse = await tokensAPI.checkExisting(email, serviceId)

      if (checkResponse.data.hasToken) {
        setExistingToken(checkResponse.data.token)
        setSendingOtp(false)
        setCheckingExisting(false)
        return
      }

      // No existing token, proceed with OTP
      await authAPI.sendEmailOTP(email)
      setEmailOtpSent(true)
      toast.success('Verification code sent to your email')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setSendingOtp(false)
      setCheckingExisting(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      toast.error('Please enter the 6-digit code')
      return
    }

    try {
      setVerifying(true)
      const response = await authAPI.verifyEmailOTP(email, emailOtp)

      // Store tokens
      if (response.data.tokens) {
        localStorage.setItem('accessToken', response.data.tokens.accessToken)
        localStorage.setItem('refreshToken', response.data.tokens.refreshToken)
      }

      toast.success('Email verified successfully!')
      setStep(Step.CREATING_TOKEN)
      await createToken()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid code')
      setVerifying(false)
    }
  }

  // Step 2: Create Token
  const createToken = async () => {
    try {
      setCreatingToken(true)
      const response = await tokensAPI.create(serviceId)
      toast.success('Token created successfully!')

      // Redirect to token dashboard
      setTimeout(() => {
        router.push(`/token/${response.data.token.id}`)
      }, 1500)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create token')
      setCreatingToken(false)
    }
  }

  // One-Tap Join Handler
  const handleOneTapJoin = async () => {
    setStep(Step.CREATING_TOKEN)
    await createToken()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 overflow-hidden">
        <div className="container-wide relative z-10 py-12 md:py-20">
          <div className="mb-8">
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left Column Skeleton */}
            <div>
              <Skeleton className="h-[500px] w-full rounded-3xl" />
              <Skeleton className="h-40 w-full rounded-2xl mt-6" />
            </div>
            {/* Right Column Skeleton */}
            <div>
              <Skeleton className="h-[600px] w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!service) return null

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/40 via-purple-50/40 to-transparent pointer-events-none"></div>

      <div className="container-wide relative z-10 py-12 md:py-20">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm font-medium text-slate-500 mb-8 overflow-x-auto whitespace-nowrap pb-2">
          <button onClick={() => router.push('/')} className="hover:text-blue-600 transition-colors">Home</button>
          <ChevronRight className="w-4 h-4 mx-2 text-slate-400 flex-shrink-0" />
          <button onClick={() => router.push('/services')} className="hover:text-blue-600 transition-colors">Services</button>
          <ChevronRight className="w-4 h-4 mx-2 text-slate-400 flex-shrink-0" />
          <span className="text-slate-900 font-semibold truncate">{service.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">

          {/* Left: Service Showcase (Sticky) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:sticky lg:top-8"
          >
            <div id="service-card-tour" className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative group">
              {/* Card Header Background */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 h-48 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-blue-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-700"></div>

                {/* Active Indicator */}
                <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 rounded-full">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  <span className="text-emerald-100 text-xs font-bold uppercase tracking-wide">Live</span>
                </div>
              </div>

              <div className="p-8 -mt-20 relative">
                {/* Service Icon */}
                <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-6 p-4">
                  <div className="w-full h-full bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Store className="w-8 h-8" />
                  </div>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                  {service.name}
                </h1>
                <p className="text-slate-600 leading-relaxed mb-8 text-lg">
                  {service.description}
                </p>

                {/* Stats Grid */}
                <div id="queue-stats-tour" className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-blue-100/50 rounded-lg text-blue-600">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">In Queue</span>
                    </div>
                    <p className="text-3xl font-bold text-slate-900">
                      {service._count.tokens}
                    </p>
                  </div>

                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-2 bg-purple-100/50 rounded-lg text-purple-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Est. Wait</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-bold text-slate-900">
                        {Math.round((service.averageWaitTime || 0) / 60)}
                      </p>
                      <span className="text-slate-500 font-medium">min</span>
                    </div>
                  </div>
                </div>

                {/* Location */}
                {service.address && (
                  <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                    <MapPin className="w-6 h-6 text-slate-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 mb-1">Location</p>
                      <p className="text-slate-600 leading-normal">{service.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Guidelines Card */}
            <div className="mt-6 bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Service Guidelines
              </h3>
              <ul className="space-y-3 text-sm text-blue-800/80">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  Must be within {service.geofenceRadius}m to join
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  Please arrive 5 mins before your turn
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                  Token expires if you miss your call
                </li>
              </ul>
            </div>
          </motion.div>

          {/* Right: Interactive Token Flow */}
          <motion.div
            id="join-flow-tour"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-slate-100">
              {/* Stepper Header (Only show if not authenticated or if in creating step) */}
              {(!isAuthenticated || step === Step.CREATING_TOKEN) && (
                <div className="flex items-center justify-between mb-10 relative">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -z-10 bg-opacity-50"></div>
                  {[
                    { icon: Shield, label: 'Identity', bg: 'bg-indigo-600', active: step >= Step.EMAIL_VERIFICATION },
                    { icon: Zap, label: 'Issue', bg: 'bg-emerald-600', active: step === Step.CREATING_TOKEN },
                    { icon: CheckCircle, label: 'Ready', bg: 'bg-blue-600', active: false },
                  ].map((item, index) => (
                    <div key={index} className="flex flex-col items-center bg-white px-2 z-10">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-2 ${item.active
                        ? `${item.bg} border-transparent text-white shadow-lg scale-110`
                        : 'bg-slate-50 border-slate-200 text-slate-300'
                        }`}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className={`text-xs mt-2 font-semibold uppercase tracking-wide transition-colors ${item.active ? 'text-slate-900' : 'text-slate-400'
                        }`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}


              <AnimatePresence mode="wait">
                {/* 1. INITIAL CTA */}
                {step === Step.SERVICE_DETAILS && (
                  <motion.div
                    key="start"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                      <Zap className="w-10 h-10 text-blue-600" />
                    </div>

                    {isAuthenticated ? (
                      // Authenticated View
                      <>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                          Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                        </h2>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                          You're signed in and ready to join. One tap is all it takes to secure your spot.
                        </p>
                        <button
                          onClick={handleOneTapJoin}
                          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 animate-shimmer bg-[length:200%_100%]"
                        >
                          <Zap className="w-5 h-5 fill-current" />
                          One-Tap Join
                        </button>
                      </>
                    ) : (
                      // Guest View
                      <>
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">
                          Skip the Physical Line
                        </h2>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto">
                          Join the digital queue instantly. We'll secure your spot and notify you when it's your turn.
                        </p>
                        <button
                          onClick={() => setStep(Step.EMAIL_VERIFICATION)}
                          className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-lg shadow-xl shadow-slate-900/10 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                        >
                          Get My Token
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    <p className="mt-4 text-xs text-slate-400">
                      By joining, you agree to our Terms of Service
                    </p>
                  </motion.div>
                )}

                {/* 2. EMAIL VERIFICATION */}
                {step === Step.EMAIL_VERIFICATION && (
                  <motion.div
                    key="email"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-slate-900">Verify Your Identity</h2>
                      <p className="text-slate-500 text-sm mt-1">We need to confirm it's really you to secure your spot</p>
                    </div>

                    {!emailOtpSent ? (
                      /* Email Input Form */
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                              type="email"
                              placeholder="name@example.com"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value)
                                setExistingToken(null)
                              }}
                              className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 font-medium"
                            />
                          </div>
                        </div>

                        {/* Existing Token Alert */}
                        {existingToken && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-red-50 border border-red-100 rounded-xl p-4 overflow-hidden"
                          >
                            <div className="flex gap-3">
                              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                              <div className="flex-1">
                                <h4 className="font-bold text-red-900 text-sm mb-1">Active Token Found</h4>
                                <p className="text-red-700 text-xs mb-3">
                                  You already have an active token (#{existingToken?.tokenNumber}) for this service.
                                </p>
                                <button
                                  onClick={() => router.push(`/token/${existingToken.id}`)}
                                  className="text-xs font-bold text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-700 transition-colors w-full"
                                >
                                  View My Token
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        <button
                          onClick={handleSendEmailOtp}
                          disabled={sendingOtp || !!existingToken}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                        >
                          {sendingOtp ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Checking availability...
                            </>
                          ) : (
                            <>
                              Send Verification Code
                              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      /* OTP Input Form */
                      <div className="space-y-6">
                        <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-600">{email}</span>
                          <button
                            onClick={() => setEmailOtpSent(false)}
                            className="text-xs font-bold text-blue-600 hover:text-blue-700"
                          >
                            Change
                          </button>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Enter 6-Digit Code</label>
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="000000"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                            className="w-full text-center tracking-[1em] text-2xl font-bold py-5 rounded-xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none text-slate-900 transition-all placeholder:tracking-normal placeholder:text-lg placeholder:font-medium placeholder:text-slate-300"
                          />
                        </div>

                        <button
                          onClick={handleVerifyEmail}
                          disabled={verifying}
                          className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {verifying ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Confirm & Get Token'
                          )}
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* 3. CREATING TOKEN */}
                {step === Step.CREATING_TOKEN && (
                  <motion.div
                    key="creating"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="relative mb-8">
                      <div className="w-20 h-20 border-4 border-blue-100 rounded-full animate-spin"></div>
                      <div className="absolute top-0 left-0 w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-8 h-8 text-blue-600 fill-blue-600" />
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold text-slate-900 mb-2">
                      Securing Your Spot...
                    </h2>
                    <p className="text-slate-500 max-w-xs mx-auto">
                      Please wait while we generate your unique queue token and position.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
      <WalkthroughOverlay
        show={showTutorial}
        steps={tourSteps}
        onComplete={() => setShowTutorial(false)}
      />
    </div>
  )
}
