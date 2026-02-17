export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/shared/Providers';
import { Toaster } from 'sonner';
import WelcomeOverlay from '@/components/shared/WelcomeOverlay';
import DeveloperBadge from '@/components/shared/DeveloperBadge';
import ActiveTokenBar from '@/components/shared/ActiveTokenBar';
import Header from '@/components/shared/Header';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Digital Queue Management System',
  description: 'Smart queue management with real-time updates',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <WelcomeOverlay />
          <Header />
          {children}

          {/* Professional Developer Badge - Top Left */}
          <DeveloperBadge />

          {/* Persistent Active Token Bar */}
          <ActiveTokenBar />

          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  )
}
