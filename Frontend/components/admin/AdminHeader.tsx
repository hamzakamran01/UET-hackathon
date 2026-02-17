'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
    Bell,
    Search,
    Menu,
    User,
    RefreshCw
} from 'lucide-react';

interface AdminHeaderProps {
    collapsed: boolean;
    setMobileOpen: (open: boolean) => void;
    title?: string;
}

export default function AdminHeader({ collapsed, setMobileOpen, title }: AdminHeaderProps) {
    return (
        <header className={`h-16 fixed top-0 right-0 z-30 transition-all duration-300 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50 flex items-center justify-between px-4 lg:px-8 ${collapsed ? 'left-20' : 'left-0 lg:left-[280px]'
            }`}>
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setMobileOpen(true)}
                    className="lg:hidden p-2 text-slate-400 hover:text-white"
                >
                    <Menu className="w-6 h-6" />
                </button>

                <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block">
                    {title || 'Dashboard'}
                </h1>
            </div>

            <div className="flex items-center gap-4">
                {/* Search - Visibly hidden on small screens for now */}
                <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search anything..."
                        className="bg-slate-800/50 border border-slate-700 text-slate-200 text-sm rounded-full pl-10 pr-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    />
                </div>

                <div className="h-6 w-px bg-slate-800 mx-2 hidden sm:block"></div>

                <button className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors">
                    <Bell className="w-5 h-5" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-slate-900"></span>
                </button>

                <div className="flex items-center gap-3 pl-2">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-semibold text-white">Administrator</p>
                        <p className="text-xs text-slate-400">Super Admin</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[2px] cursor-pointer shadow-lg shadow-purple-900/20">
                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
