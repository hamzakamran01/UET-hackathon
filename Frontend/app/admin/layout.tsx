'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminAssistantPanel from '@/components/admin/AdminAssistantPanel';
import { Toaster } from 'sonner';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [authorized, setAuthorized] = useState(false);
    const [mounting, setMounting] = useState(true);

    // Auth Guard
    useEffect(() => {
        // Skip check for login page
        if (pathname === '/admin/login') {
            setAuthorized(true);
            setMounting(false);
            return;
        }

        const checkAuth = () => {
            const token = localStorage.getItem('adminAccessToken');
            if (!token) {
                router.replace('/admin/login');
            } else {
                setAuthorized(true);
            }
            setMounting(false);
        };

        checkAuth();
    }, [pathname, router]);

    // Don't render anything until client-side auth check is done
    // (prevents flash of content before redirect)
    if (mounting) {
        return <div className="min-h-screen bg-slate-950" />;
    }

    // Login Page - Render without layout shell
    if (pathname === '/admin/login') {
        return (
            <div className="antialiased text-slate-900 dark:text-slate-50">
                {children}
            </div>
        );
    }

    // Protected Admin Pages
    if (!authorized) return null;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
            <AdminSidebar
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                mobileOpen={mobileOpen}
                setMobileOpen={setMobileOpen}
            />

            <AdminHeader
                collapsed={collapsed}
                setMobileOpen={setMobileOpen}
            />

            <AdminAssistantPanel />

            <main
                className={`min-h-screen transition-all duration-300 pt-20 px-4 pb-8 lg:px-8 ${collapsed ? 'lg:ml-20' : 'lg:ml-[280px]'
                    }`}
            >
                <div className="max-w-[1600px] mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}
