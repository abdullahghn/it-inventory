'use client'

import * as React from 'react'
import { RefreshCw, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// Base loading spinner
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <Loader2
      className={cn(
        'animate-spin text-gray-500',
        sizeClasses[size],
        className
      )}
    />
  )
}

// Full page loading
interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message = 'Loading...' }: PageLoadingProps) {
  return (
    <div className="flex min-h-[400px] w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  )
}

// Inline loading (for buttons, small components)
interface InlineLoadingProps {
  text?: string
  size?: 'sm' | 'md'
  className?: string
}

export function InlineLoading({ 
  text = 'Loading...', 
  size = 'sm', 
  className 
}: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoadingSpinner size={size} />
      <span className="text-sm text-gray-500">{text}</span>
    </div>
  )
}

// Skeleton loading for data tables and lists
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full">
      <div className="animate-pulse space-y-4">
        {/* Header skeleton */}
        <div className="flex space-x-4">
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded flex-1" />
          ))}
        </div>
        {/* Row skeletons */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            {Array.from({ length: columns }).map((_, j) => (
              <div key={j} className="h-8 bg-gray-200 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Card skeleton for dashboard widgets
export function CardSkeleton() {
  return (
    <div className="p-6 border rounded-lg space-y-4 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
            <div className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
      </div>
    </div>
  )
}

// Form skeleton
export function FormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded w-full" />
        </div>
      ))}
      <div className="flex space-x-4 pt-4">
        <div className="h-10 bg-muted rounded w-24" />
        <div className="h-10 bg-muted rounded w-32" />
      </div>
    </div>
  )
}

// Loading overlay for existing content
interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  message?: string
  className?: string
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  message = 'Loading...', 
  className 
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-500">{message}</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Progress indicator for multi-step operations
interface ProgressIndicatorProps {
  current: number
  total: number
  message?: string
  className?: string
}

export function ProgressIndicator({ 
  current, 
  total, 
  message, 
  className 
}: ProgressIndicatorProps) {
  const percentage = (current / total) * 100

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">
          {message || 'Processing...'}
        </span>
        <span className="text-muted-foreground">
          {current} / {total}
        </span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

// Status indicator (loading, success, error)
interface StatusIndicatorProps {
  status: 'loading' | 'success' | 'error' | 'idle'
  message?: string
  className?: string
}

export function StatusIndicator({ status, message, className }: StatusIndicatorProps) {
  const configs = {
    idle: { icon: null, color: 'text-muted-foreground' },
    loading: { 
      icon: <LoadingSpinner size="sm" />, 
      color: 'text-muted-foreground' 
    },
    success: { 
      icon: <CheckCircle className="h-4 w-4" />, 
      color: 'text-green-600' 
    },
    error: { 
      icon: <AlertCircle className="h-4 w-4" />, 
      color: 'text-destructive' 
    },
  }

  const config = configs[status]

  if (status === 'idle' && !message) return null

  return (
    <div className={cn('flex items-center space-x-2', config.color, className)}>
      {config.icon}
      {message && <span className="text-sm">{message}</span>}
    </div>
  )
}

// Empty state component
interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({ 
  title, 
  description, 
  action, 
  icon,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-md">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
} 