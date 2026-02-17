'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Activity,
    Users,
    Building2,
    AlertCircle,
    BarChart3,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Shield,
    Menu
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

export default function AdminSidebar({
    collapsed,
    setCollapsed,
    mobileOpen,
    setMobileOpen
}: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminRole');
        localStorage.removeItem('adminName');
        toast.success('Logged out successfully');
        router.push('/admin/login');
    };

    const navItems = [
        {
            group: 'Overview',
            items: [
                { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
                { name: 'Live Queue', href: '/admin/queue', icon: Activity },
            ]
        },
        {
            group: 'Management',
            items: [
                { name: 'Services', href: '/admin/services', icon: Building2 },
                { name: 'Users', href: '/admin/users', icon: Users },
                { name: 'Abuse Reports', href: '/admin/abuse', icon: AlertCircle },
            ]
        },
        {
            group: 'Analytics',
            items: [
                { name: 'Overview', href: '/admin/analytics', icon: BarChart3 },
            ]
        }
    ];

    if (!mounted) return null;

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-slate-900 text-slate-300 border-r border-slate-800/50">
            {/* Brand Header */}
            <div className={cn(
                "h-16 flex items-center border-b border-slate-800/50 transition-all duration-300",
                collapsed ? "justify-center px-2" : "px-6"
            )}>
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-900/20">
                        <Shield className="w-5 h-5 text-white" />
                    </div>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="font-bold text-lg text-white tracking-tight whitespace-nowrap"
                        >
                            DQMS <span className="text-slate-500 text-xs ml-1 font-medium px-1.5 py-0.5 rounded-full bg-slate-800">Admin</span>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 space-y-8 scrollbar-thin scrollbar-thumb-slate-800">
                {navItems.map((group, idx) => (
                    <div key={idx} className="px-3">
                        {!collapsed && (
                            <h3 className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                {group.group}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                            isActive
                                                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                                                : "hover:bg-slate-800 hover:text-white"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "w-5 h-5 flex-shrink-0 transition-colors",
                                            isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                                        )} />

                                        {!collapsed ? (
                                            <span className="font-medium truncate">{item.name}</span>
                                        ) : (
                                            // Tooltip for collapsed mode
                                            <div className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap border border-slate-700 shadow-xl">
                                                {item.name}
                                            </div>
                                        )}

                                        {isActive && !collapsed && (
                                            <motion.div
                                                layoutId="active-pill"
                                                className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm"
                                            />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer / User Profile */}
            <div className="p-3 border-t border-slate-800/50 bg-slate-900/50">
                <button
                    onClick={handleLogout}
                    className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all group",
                        collapsed && "justify-center"
                    )}
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span className="font-medium">Sign Out</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 80 : 280 }}
                className="hidden lg:block fixed left-0 top-0 bottom-0 z-40 bg-slate-900 shadow-xl border-r border-slate-800/50"
            >
                <SidebarContent />

                {/* Collapse Toggle */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-20 bg-slate-800 text-slate-400 border border-slate-700 p-1 rounded-full shadow-lg hover:text-white hover:bg-slate-700 transition-colors"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </motion.aside>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 w-72 z-50 bg-slate-900 shadow-2xl"
                        >
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
