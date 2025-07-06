import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { UserMenu } from '@/components/dashboard/UserMenu'

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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <nav className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">IT Inventory</h2>
          <p className="text-sm text-gray-600 mt-1">
            Welcome, {session.user.name}
          </p>
        </div>
        <ul className="mt-6">
          <li>
            <Link
              href="/dashboard"
              className="block py-2 px-4 text-gray-700 hover:bg-gray-200"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/assets"
              className="block py-2 px-4 text-gray-700 hover:bg-gray-200"
            >
              Assets
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/assignments"
              className="block py-2 px-4 text-gray-700 hover:bg-gray-200"
            >
              Assign Equipment
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/maintenance"
              className="block py-2 px-4 text-gray-700 hover:bg-gray-200"
            >
              Maintenance Records
            </Link>
          </li>
          {/* Admin/Manager only sections */}
          {(session.user.role === 'admin' || session.user.role === 'super_admin' || session.user.role === 'manager') && (
            <li>
              <Link
                href="/dashboard/users"
                className="block py-2 px-4 text-gray-700 hover:bg-gray-200"
              >
                Users
              </Link>
            </li>
          )}
          <li>
            <Link
              href="/dashboard/reports"
              className="block py-2 px-4 text-gray-700 hover:bg-gray-200"
            >
              Reports
            </Link>
          </li>
        </ul>
        
        {/* User Menu */}
        <div className="absolute bottom-0 left-0 w-64 p-4 border-t">
          <UserMenu user={session.user} />
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
} 