import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from '@/components/auth/SessionProvider'
import { ToastProvider } from '@/components/ui/toast'
import { SearchProvider } from '@/contexts/SearchContext'

export const metadata: Metadata = {
  title: 'IT Inventory System',
  description: 'Comprehensive IT asset management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body 
        className="min-h-screen bg-gray-100 font-sans antialiased"
        suppressHydrationWarning={true}
      >
        <SessionProvider>
          <SearchProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </SearchProvider>
        </SessionProvider>
      </body>
    </html>
  )
} 