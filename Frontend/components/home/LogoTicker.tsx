'use client'

import { motion } from 'framer-motion'

const companies = [
    { name: 'Acme Corp', logo: 'AC', color: 'bg-blue-500' },
    { name: 'Quantum', logo: 'QT', color: 'bg-purple-500' },
    { name: 'Echo Valley', logo: 'EV', color: 'bg-emerald-500' },
    { name: 'Nebula', logo: 'NB', color: 'bg-indigo-500' },
    { name: 'Horizon', logo: 'HZ', color: 'bg-amber-500' },
    { name: 'Apex', logo: 'AP', color: 'bg-rose-500' },
    { name: 'Vortex', logo: 'VX', color: 'bg-cyan-500' },
    { name: 'Pinnacle', logo: 'PN', color: 'bg-orange-500' },
]

export default function LogoTicker() {
    return (
        <div className="py-8 bg-slate-50 border-y border-blue-600 overflow-hidden">
            <div className="container-wide">
                <h3 className="text-center text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">
                    Trusted by over 100+ Leading Organizations
                </h3>
                <div className="flex overflow-hidden relative after:content-[''] after:dark:from-brand-dark after:from-background after:bg-gradient-to-r after:to-transparent after:w-32 after:absolute after:left-0 after:top-0 after:bottom-0 after:z-10 before:content-[''] before:dark:from-brand-dark before:from-background before:bg-gradient-to-l before:to-transparent before:w-32 before:absolute before:right-0 before:top-0 before:bottom-0 before:z-10">
                    <motion.div
                        transition={{
                            duration: 20,
                            ease: "linear",
                            repeat: Infinity,
                        }}
                        initial={{ translateX: 0 }}
                        animate={{ translateX: "-50%" }}
                        className="flex gap-16 flex-none pr-16"
                    >
                        {[...companies, ...companies].map((company, index) => (
                            <div key={index} className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 cursor-pointer">
                                <div className={`w-10 h-10 rounded-lg ${company.color} flex items-center justify-center text-white font-bold shadow-sm`}>
                                    {company.logo}
                                </div>
                                <span className="font-bold text-slate-700 text-lg">{company.name}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
