'use client'

import * as React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Error boundary state interface
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

// Base error boundary props
interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<ErrorFallbackProps>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  resetOnPropsChange?: boolean
  resetKeys?: Array<string | number>
}

// Error fallback props
interface ErrorFallbackProps {
  error: Error
  resetError: () => void
  resetKeys?: Array<string | number>
}

// Default error fallback component
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <Card className="max-w-lg mx-auto mt-8">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive">Something went wrong</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
        <div className="flex space-x-2">
          <Button onClick={resetError} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button 
            onClick={() => window.location.href = '/dashboard'} 
            variant="secondary" 
            size="sm"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// Main error boundary class component
export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  private resetTimeoutId: number | null = null

  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler
    this.props.onError?.(error, errorInfo)

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetKeys, resetOnPropsChange } = this.props
    const { hasError } = this.state

    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetError()
    }

    if (hasError && resetKeys) {
      const prevResetKeys = prevProps.resetKeys || []
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevResetKeys[index]
      )
      if (hasResetKeyChanged) {
        this.resetError()
      }
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback: Fallback = DefaultErrorFallback } = this.props

    if (hasError && error) {
      return <Fallback error={error} resetError={this.resetError} />
    }

    return children
  }
}

// React Hook version for functional components
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  const captureError = React.useCallback((error: Error) => {
    setError(error)
  }, [])

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return { captureError, resetError }
}

// Page-level error fallback
interface PageErrorFallbackProps extends ErrorFallbackProps {
  title?: string
  description?: string
}

export function PageErrorFallback({ 
  error, 
  resetError, 
  title = "Page Error",
  description = "This page encountered an error and couldn't load properly."
}: PageErrorFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={resetError} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
            <Button 
              onClick={() => window.location.href = '/dashboard'} 
              size="sm"
            >
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left">
              <summary className="cursor-pointer text-sm font-medium">
                Technical Details
              </summary>
              <div className="mt-2 text-xs bg-muted p-2 rounded">
                <p><strong>Error:</strong> {error.message}</p>
                <pre className="mt-1 whitespace-pre-wrap break-all">
                  {error.stack}
                </pre>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Asset/Data error fallback
interface DataErrorFallbackProps extends ErrorFallbackProps {
  type?: 'assets' | 'users' | 'assignments' | 'reports'
}

export function DataErrorFallback({ 
  error, 
  resetError, 
  type = 'assets' 
}: DataErrorFallbackProps) {
  const typeConfig = {
    assets: { name: 'Assets', action: 'loading assets' },
    users: { name: 'Users', action: 'loading users' },
    assignments: { name: 'Assignments', action: 'loading assignments' },
    reports: { name: 'Reports', action: 'generating reports' },
  }

  const config = typeConfig[type]

  return (
    <Card className="p-6">
      <div className="text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <Bug className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h3 className="font-semibold">Error Loading {config.name}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            There was a problem {config.action}. Please try again.
          </p>
        </div>
        <Button onClick={resetError} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reload {config.name}
        </Button>
      </div>
    </Card>
  )
}

// Form error fallback
export function FormErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="border border-destructive/50 rounded-md p-4 bg-destructive/5">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-medium text-destructive">
            Form Error
          </h4>
          <p className="text-sm text-muted-foreground">
            The form encountered an error and couldn't be submitted. Please check your input and try again.
          </p>
          <Button onClick={resetError} variant="outline" size="sm">
            Reset Form
          </Button>
        </div>
      </div>
    </div>
  )
}

// Error boundary wrapper with specific fallbacks
interface ErrorBoundaryWrapperProps {
  children: React.ReactNode
  type?: 'page' | 'data' | 'form'
  fallbackProps?: any
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export function ErrorBoundaryWrapper({ 
  children, 
  type = 'page',
  fallbackProps = {},
  onError 
}: ErrorBoundaryWrapperProps) {
  const fallbackComponents = {
    page: PageErrorFallback,
    data: DataErrorFallback,
    form: FormErrorFallback,
  }

  const FallbackComponent = fallbackComponents[type]

  return (
    <ErrorBoundary
      fallback={(props) => <FallbackComponent {...props} {...fallbackProps} />}
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  )
} 