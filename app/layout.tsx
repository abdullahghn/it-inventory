import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from '@/components/auth/SessionProvider'

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
        className="min-h-screen bg-background font-sans antialiased"
        suppressHydrationWarning={true}
      >
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
} 