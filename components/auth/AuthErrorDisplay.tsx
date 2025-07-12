'use client'

import { AlertCircle, Mail, Shield, UserCheck, HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AuthErrorDisplayProps {
  error: string | null
  className?: string
}

const errorConfigs = {
  'OAuthAccountNotLinked': {
    title: 'Account Already Exists',
    message: 'This email is already associated with a different Google account.',
    action: 'Please sign in with the same Google account you used previously.',
    icon: UserCheck,
    severity: 'warning' as const,
    helpText: 'If you\'re unsure which account you used, contact your administrator.'
  },
  'inactive': {
    title: 'Account Deactivated',
    message: 'Your account has been deactivated by an administrator.',
    action: 'Please contact your IT administrator to reactivate your account.',
    icon: Shield,
    severity: 'error' as const,
    helpText: 'You can reach IT support at support@company.com or call extension 1234.'
  },
  'AccessDenied': {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this system.',
    action: 'Contact your administrator to request access to the IT Inventory system.',
    icon: Shield,
    severity: 'error' as const,
    helpText: 'Make sure you\'re using your company email address.'
  },
  'Configuration': {
    title: 'System Configuration Error',
    message: 'Authentication is not properly configured.',
    action: 'Please contact the system administrator.',
    icon: AlertCircle,
    severity: 'error' as const,
    helpText: 'This is a technical issue that requires administrator attention.'
  },
  'Verification': {
    title: 'Email Verification Required',
    message: 'Please verify your email address before signing in.',
    action: 'Check your inbox for a verification email and click the link.',
    icon: Mail,
    severity: 'warning' as const,
    helpText: 'If you don\'t see the email, check your spam folder.'
  },
  'Callback': {
    title: 'Authentication Error',
    message: 'There was a problem completing your sign-in.',
    action: 'Please try signing in again.',
    icon: AlertCircle,
    severity: 'error' as const,
    helpText: 'If the problem persists, try clearing your browser cookies.'
  },
  'default': {
    title: 'Authentication Failed',
    message: 'An unexpected error occurred during sign-in.',
    action: 'Please try again or contact support if the problem persists.',
    icon: AlertCircle,
    severity: 'error' as const,
    helpText: 'You can contact support at support@company.com'
  }
}

export function AuthErrorDisplay({ error, className }: AuthErrorDisplayProps) {
  if (!error) return null

  const config = errorConfigs[error as keyof typeof errorConfigs] || errorConfigs.default
  const IconComponent = config.icon

  const severityStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <div className={cn(
      'border rounded-lg p-4 mb-6',
      severityStyles[config.severity],
      className
    )}>
      <div className="flex">
        <div className="flex-shrink-0">
          <IconComponent className="h-5 w-5" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {config.title}
          </h3>
          <div className="mt-2 text-sm space-y-2">
            <p>{config.message}</p>
            <p className="font-medium">{config.action}</p>
            {config.helpText && (
              <div className="flex items-start space-x-2 mt-3 p-2 bg-white/50 rounded">
                <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <p className="text-xs">{config.helpText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 