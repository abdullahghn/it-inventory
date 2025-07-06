import { auth, signIn, signOut } from '@/lib/auth'

async function handleSignIn() {
  'use server'
  await signIn('google')
}

async function handleSignOut() {
  'use server'
  await signOut()
}

export default async function HomePage() {
  const session = await auth()

  if (session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome, {session.user?.name}!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            IT Inventory System - Ready to manage your assets
          </p>
          <div className="space-x-4">
            <a
              href="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded inline-block"
            >
              Go to Dashboard
            </a>
            <form action={handleSignOut} className="inline">
              <button
                type="submit"
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          IT Inventory System
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Comprehensive IT asset management solution
        </p>
        <div className="space-x-4">
          <form action={handleSignIn} className="inline">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Sign In with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  )
} 