'use client'

import { signIn, getProviders } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthErrorDisplay } from '@/components/auth/AuthErrorDisplay'
import { LoadingSpinner } from '@/components/ui/loading'
import { Shield, Building2, Users, BarChart3 } from 'lucide-react'

export default function SignInPage() {
  const [providers, setProviders] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProviders, setIsLoadingProviders] = useState(true)
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await getProviders()
        setProviders(res)
      } catch (error) {
        console.error('Error fetching providers:', error)
      } finally {
        setIsLoadingProviders(false)
      }
    }
    fetchProviders()
  }, [])

  const handleSignIn = async (providerId: string) => {
    setIsLoading(true)
    try {
      await signIn(providerId, { callbackUrl })
    } catch (error) {
      console.error('Sign in error:', error)
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: Shield,
      title: 'Secure Access',
      description: 'Role-based authentication with enterprise security'
    },
    {
      icon: Building2,
      title: 'Asset Management',
      description: 'Track and manage all IT equipment efficiently'
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Manage user assignments and permissions'
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'Real-time reports and insights'
    }
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left side - Features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white">
        <div className="max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">IT Inventory System</h1>
            <p className="text-blue-100 text-lg">
              Comprehensive asset management for modern organizations
            </p>
          </div>
          
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg">
                  <feature.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{feature.title}</h3>
                  <p className="text-blue-100">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Sign in form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">IT Inventory</h1>
            <p className="text-gray-600">Sign in to access your dashboard</p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:block">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back
            </h2>
            <p className="text-gray-600">
              Sign in to your IT Inventory account
            </p>
          </div>

          {/* Error display */}
          <AuthErrorDisplay error={error} />

          {/* Sign in form */}
          <div className="bg-white rounded-lg shadow-sm border p-8">
            {isLoadingProviders ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="lg" />
                <span className="ml-3 text-gray-600">Loading sign-in options...</span>
              </div>
            ) : (
              <div className="space-y-6">
                {providers && Object.values(providers).map((provider: any) => {
                  if (provider.id === 'google') {
                    return (
                      <div key={provider.name}>
                        <button
                          onClick={() => handleSignIn(provider.id)}
                          disabled={isLoading}
                          className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                          {isLoading ? (
                            <div className="flex items-center">
                              <LoadingSpinner size="sm" />
                              <span className="ml-3">Signing in...</span>
                            </div>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                                <path
                                  fill="#4285F4"
                                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                  fill="#34A853"
                                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                  fill="#FBBC05"
                                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                  fill="#EA4335"
                                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                              </svg>
                              Continue with {provider.name}
                            </>
                          )}
                        </button>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            )}

            {/* Help text */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                By signing in, you agree to our{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:text-blue-500 font-medium">
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>

          {/* Support info */}
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Need help? Contact{' '}
              <a href="mailto:support@company.com" className="text-blue-600 hover:text-blue-500 font-medium">
                IT Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 