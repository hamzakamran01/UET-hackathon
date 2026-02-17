'use client';


import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Clock, Shield, Smartphone, Zap, ArrowRight, CheckCircle,
  Users, TrendingUp, Globe, BarChart3, Star, MessageSquare,
  Sparkles, Target, Award, Workflow, Bell, Play
} from 'lucide-react'
import LogoTicker from '@/components/home/LogoTicker';
import './globals.css';

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-slate-50">

      {/* 
        ------------------------------------
        HERO SECTION - Enterprise Split
        ------------------------------------
      */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        {/* Background - Subtle Enterprise Mesh */}
        <div className="absolute inset-0 bg-white" />
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.4]" />

        <div className="container-wide relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-full mb-8">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-xs font-semibold text-blue-700 tracking-wide uppercase">
                  New: AI-Powered Predictor 2.0
                </span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                Wait Less, <br />
                <span className="text-blue-600">Achieve More.</span>
              </h1>

              <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                The enterprise standard for intelligent queue management.
                Optimized for high-volume service centers, banks, and healthcare facilities.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/services')}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                  Get Started Guide
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push('/services')}
                  className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4 fill-slate-700" />
                  View Demo
                </button>
              </div>

              <div className="mt-12 flex items-center gap-8 text-sm font-medium text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Free 14-day trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>No credit card required</span>
                </div>
              </div>
            </motion.div>

            {/* Right Image */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-100">
                <Image
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
                  alt="Modern office queue"
                  width={800}
                  height={600}
                  className="w-full h-auto object-cover"
                  priority
                />

                {/* Floating Stats Card 1 */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-100 max-w-[200px]"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <span className="text-sm font-semibold text-slate-700">Efficiency</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">+45%</div>
                  <div className="text-xs text-slate-500">Vs traditional queuing</div>
                </motion.div>

                {/* Floating Stats Card 2 */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="absolute top-8 right-8 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-slate-100"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200" />
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300" />
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400" />
                    </div>
                    <div className="text-xs font-semibold text-slate-700 pl-2">
                      2k+ Online
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 
        ------------------------------------
        SOCIAL PROOF - Logo Ticker
        ------------------------------------
      */}
      <LogoTicker />

      {/* 
        ------------------------------------
        FEATURES - Enterprise Cards
        ------------------------------------
      */}
      <section className="py-24 bg-slate-50">
        <div className="container-wide">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
              Complete Control Over Customer Flow
            </h2>
            <p className="text-lg text-slate-600">
              Everything you need to manage queues, appointments, and customer journeys from a single dashboard.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Clock,
                title: 'Real-Time Intelligence',
                desc: 'Live wait times and predictive analytics powered by AI.'
              },
              {
                icon: Smartphone,
                title: 'Mobile-First Experience',
                desc: 'Allow customers to join queues remotely via their phone.'
              },
              {
                icon: Shield,
                title: 'Enterprise Security',
                desc: 'SOC 2 compliant data protection and role-based access.'
              },
              {
                icon: BarChart3,
                title: 'Deep Analytics',
                desc: 'Granular reporting on wait times, staff performance, and peak hours.'
              },
              {
                icon: Bell,
                title: 'Smart Notifications',
                desc: 'SMS and email alerts keep customers informed and reduce drop-offs.'
              },
              {
                icon: Globe,
                title: 'Multi-Location Ready',
                desc: 'Manage hundreds of branches from a unified central command.'
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                  <feature.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ------------------------------------
        HOW IT WORKS - Timeline
        ------------------------------------
      */}
      <section className="py-24 bg-white">
        <div className="container-wide">
          <div className="flex flex-col lg:flex-row gap-16 items-center">

            <div className="lg:w-1/2">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
                Streamlined for Speed
              </h2>
              <p className="text-lg text-slate-600 mb-12">
                Get your customers from arrival to service in three simple steps. No complex hardware required.
              </p>

              <div className="space-y-8">
                {[
                  {
                    step: '01',
                    title: 'Scan or Select',
                    desc: 'Customers scan a QR code or select a service from the kiosk.'
                  },
                  {
                    step: '02',
                    title: 'Wait Anywhere',
                    desc: 'They get a digital token and can wait remotely. We notify them when it\'s time.'
                  },
                  {
                    step: '03',
                    title: 'Get Served',
                    desc: 'Staff call the next ticket with one click. Service data is logged automatically.'
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg bg-blue-50">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                      <p className="text-slate-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:w-1/2 relative">
              <div className="absolute inset-0 bg-blue-600 rounded-3xl rotate-6 opacity-10 blur-xl"></div>
              <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1200"
                  alt="Dashboard Preview"
                  width={800}
                  height={600}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ------------------------------------
        TRUST / TESTIMONIALS
        ------------------------------------
      */}
      <section className="py-24 bg-slate-50 border-t border-slate-200">
        <div className="container-wide">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-6">
              Loved by Operations Managers
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "DQMS slashed our lobby wait times by 40% in the first month. The analytics are a game changer for staffing.",
                author: "Sarah Jenkins",
                role: "Director of Ops, Metro Health",
                image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150"
              },
              {
                quote: "The mobile token system means our customers don't have to crowd the waiting room anymore. It's safer and calmer.",
                author: "Michael Chang",
                role: "Branch Manager, CityBank",
                image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150"
              },
              {
                quote: "Setup was incredibly easy. We were live in 3 locations within a single afternoon. Highly recommended.",
                author: "Elena Rodriguez",
                role: "VP Experience, RetailGroup",
                image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150"
              }
            ].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm"
              >
                <div className="flex gap-1 mb-6">
                  {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700 mb-8 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <Image
                    src={t.image}
                    alt={t.author}
                    width={48}
                    height={48}
                    className="rounded-full object-cover w-12 h-12 ring-2 ring-white shadow-md"
                  />
                  <div>
                    <div className="font-bold text-slate-900">{t.author}</div>
                    <div className="text-xs text-slate-500 font-semibold uppercase tracking-wide">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 
        ------------------------------------
        CTA SECTION
        ------------------------------------
      */}
      <section className="py-24">
        <div className="container-narrow">
          <div className="relative rounded-3xl overflow-hidden bg-blue-600 text-white shadow-2xl shadow-blue-900/20 px-8 py-16 md:px-16 md:py-20 text-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>

            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Ready to transform your queue?
              </h2>
              <p className="text-blue-100 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                Join 500+ enterprises managing customer flow with DQMS.
                Start your 14-day free trial today.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => router.push('/services')}
                  className="px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl"
                >
                  Start Free Trial
                </button>
                <button
                  className="px-8 py-4 bg-blue-700 text-white rounded-xl font-bold text-lg hover:bg-blue-800 transition-colors border border-blue-500"
                >
                  Contact Sales
                </button>
              </div>

              <p className="mt-8 text-sm text-blue-200 opacity-80">
                No credit card required. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
