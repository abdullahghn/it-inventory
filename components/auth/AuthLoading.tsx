'use client'

import { LoadingSpinner } from '@/components/ui/loading'
import { Shield, Building2 } from 'lucide-react'

interface AuthLoadingProps {
  message?: string
  showBranding?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function AuthLoading({ 
  message = 'Authenticating...', 
  showBranding = true,
  size = 'lg'
}: AuthLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="text-center max-w-md mx-auto px-6">
        {showBranding && (
          <div className="mb-8">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-8 w-8 text-blue-600" />
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">IT Inventory</h1>
            <p className="text-gray-600">Secure asset management system</p>
          </div>
        )}
        
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size={size} />
          <div className="text-center">
            <p className="text-gray-600 font-medium">{message}</p>
            <p className="text-sm text-gray-500 mt-1">Please wait while we verify your credentials</p>
          </div>
        </div>

        {/* Loading dots animation */}
        <div className="flex justify-center space-x-1 mt-6">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}

// Compact version for inline use
export function AuthLoadingInline({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-3">
        <LoadingSpinner size="sm" />
        <span className="text-gray-600">{message}</span>
      </div>
    </div>
  )
}

// Skeleton for authentication forms
export function AuthFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center space-y-2">
        <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
      </div>
      
      {/* Form skeleton */}
      <div className="bg-white rounded-lg shadow-sm border p-8 space-y-6">
        <div className="space-y-4">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
        
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </div>
    </div>
  )
} 