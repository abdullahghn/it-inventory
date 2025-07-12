import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/dashboard/UserMenu'
import { AuthLoading } from '@/components/auth/AuthLoading'
import { Suspense } from 'react'
import { 
  Home, 
  Computer, 
  Users, 
  FileText, 
  Settings, 
  BarChart3,
  Wrench,
  UserCheck,
  Menu,
  Upload
} from 'lucide-react'

// Loading component for the layout
function DashboardLoading() {
  return <AuthLoading message="Loading dashboard..." showBranding={false} />
}

// Navigation items component
function NavigationItems({ userRole }: { userRole: string }) {
  const baseItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/assets', label: 'Assets', icon: Computer },
    { href: '/dashboard/assignments', label: 'Assign Equipment', icon: UserCheck },
    { href: '/dashboard/maintenance', label: 'Maintenance', icon: Wrench },
    { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
  ]

  const adminItems = [
    { href: '/dashboard/users', label: 'Users', icon: Users },
    { href: '/dashboard/import', label: 'Import Data', icon: Upload },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ]

  const allItems = [
    ...baseItems,
    ...(userRole === 'admin' || userRole === 'super_admin' || userRole === 'manager' ? adminItems : [])
  ]

  return (
    <ul className="mt-6 space-y-1">
      {allItems.map((item) => {
        const IconComponent = item.icon
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center py-2 px-4 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-150 group"
            >
              <IconComponent className="h-5 w-5 mr-3 text-gray-400 group-hover:text-gray-600" />
              <span className="font-medium">{item.label}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar - Fixed position on desktop, hidden on mobile */}
      <nav className="fixed left-0 top-0 w-64 h-full bg-white shadow-lg border-r border-gray-200 z-10 hidden lg:block">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Computer className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">IT Inventory</h2>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                Welcome back, {session.user.name}
              </p>
              <p className="text-xs text-gray-500">
                {session.user.department || 'No department assigned'}
              </p>
            </div>
          </div>

          {/* Navigation - Scrollable */}
          <div className="flex-1 overflow-y-auto">
            <NavigationItems userRole={session.user.role} />
          </div>
          
          {/* User Menu - Fixed at bottom */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <Suspense fallback={<div className="h-16 bg-gray-100 rounded-lg animate-pulse" />}>
              <UserMenu user={session.user} />
            </Suspense>
          </div>
        </div>
      </nav>

      {/* Main content - With left margin on desktop, full width on mobile */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top bar - Fixed */}
        <div className="sticky top-0 z-10 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <div className="flex items-center space-x-4">
            {/* Mobile menu button - only visible on mobile */}
            <button className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <Menu className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Dashboard</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Mobile user menu - only visible on mobile */}
            <div className="lg:hidden">
              <Suspense fallback={<div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />}>
                <UserMenu user={session.user} />
              </Suspense>
            </div>
            {/* Quick actions or notifications could go here */}
          </div>
        </div>

        {/* Page content - Scrollable */}
        <div className="bg-gray-50 min-h-screen">
          <Suspense fallback={<DashboardLoading />}>
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </Suspense>
        </div>
      </main>
    </div>
  )
} 