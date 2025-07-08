'use client'

import * as React from 'react'
import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Toast types
export type ToastType = 'success' | 'error' | 'warning' | 'info'

// Toast interface
export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  persistent?: boolean
}

// Toast context
interface ToastContextValue {
  toasts: Toast[]
  toast: (toast: Omit<Toast, 'id'>) => string
  success: (title: string, description?: string, options?: Partial<Toast>) => string
  error: (title: string, description?: string, options?: Partial<Toast>) => string
  warning: (title: string, description?: string, options?: Partial<Toast>) => string
  info: (title: string, description?: string, options?: Partial<Toast>) => string
  dismiss: (id: string) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast provider component
interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
  defaultDuration?: number
}

export function ToastProvider({ 
  children, 
  maxToasts = 5, 
  defaultDuration = 5000 
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const generateId = () => Math.random().toString(36).substring(2, 9)

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId()
    const newToast: Toast = {
      id,
      duration: defaultDuration,
      ...toast,
    }

    setToasts(prev => {
      const updated = [newToast, ...prev]
      // Limit number of toasts
      return updated.slice(0, maxToasts)
    })

    // Auto dismiss if not persistent
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }

    return id
  }, [defaultDuration, maxToasts])

  const success = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return toast({ type: 'success', title, description, ...options })
  }, [toast])

  const error = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return toast({ type: 'error', title, description, persistent: true, ...options })
  }, [toast])

  const warning = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return toast({ type: 'warning', title, description, ...options })
  }, [toast])

  const info = useCallback((title: string, description?: string, options?: Partial<Toast>) => {
    return toast({ type: 'info', title, description, ...options })
  }, [toast])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const dismissAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast,
        success,
        error,
        warning,
        info,
        dismiss,
        dismissAll,
      }}
    >
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

// Toast container component
function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 w-full max-w-sm">
      {toasts.map(toast => (
        <ToastComponent key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

// Individual toast component
interface ToastComponentProps {
  toast: Toast
}

function ToastComponent({ toast }: ToastComponentProps) {
  const { dismiss } = useToast()
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  React.useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => dismiss(toast.id), 150)
  }

  const typeConfig = {
    success: {
      icon: <CheckCircle className="h-5 w-5" />,
      className: 'border-green-200 bg-green-50 text-green-800',
      iconColor: 'text-green-600',
    },
    error: {
      icon: <AlertCircle className="h-5 w-5" />,
      className: 'border-red-200 bg-red-50 text-red-800',
      iconColor: 'text-red-600',
    },
    warning: {
      icon: <AlertTriangle className="h-5 w-5" />,
      className: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      iconColor: 'text-yellow-600',
    },
    info: {
      icon: <Info className="h-5 w-5" />,
      className: 'border-blue-200 bg-blue-50 text-blue-800',
      iconColor: 'text-blue-600',
    },
  }

  const config = typeConfig[toast.type]

  return (
    <div
      className={cn(
        'border rounded-lg p-4 shadow-lg transition-all duration-300 ease-out',
        'transform',
        isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95',
        config.className
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn('flex-shrink-0', config.iconColor)}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{toast.title}</div>
          {toast.description && (
            <div className="text-sm opacity-90 mt-1">{toast.description}</div>
          )}
          {toast.action && (
            <div className="mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={toast.action.onClick}
                className="text-xs h-7"
              >
                {toast.action.label}
              </Button>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="flex-shrink-0 h-6 w-6 p-0 hover:bg-black/10"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Specialized toast functions for IT inventory operations
export function useInventoryToasts() {
  const { success, error, warning, info } = useToast()

  return {
    // Asset operations
    assetCreated: (assetName: string) =>
      success('Asset Created', `${assetName} has been successfully added to inventory.`),
    
    assetUpdated: (assetName: string) =>
      success('Asset Updated', `${assetName} has been successfully updated.`),
    
    assetDeleted: (assetName: string) =>
      success('Asset Deleted', `${assetName} has been removed from inventory.`),
    
    assetAssigned: (assetName: string, userName: string) =>
      success('Asset Assigned', `${assetName} has been assigned to ${userName}.`),
    
    assetReturned: (assetName: string, userName: string) =>
      success('Asset Returned', `${assetName} has been returned by ${userName}.`),
    
    // User operations
    userCreated: (userName: string) =>
      success('User Created', `${userName} has been added to the system.`),
    
    userUpdated: (userName: string) =>
      success('User Updated', `${userName}'s profile has been updated.`),
    
    userDeactivated: (userName: string) =>
      warning('User Deactivated', `${userName} has been deactivated.`),
    
    // Bulk operations
    bulkAssignment: (count: number) =>
      success('Bulk Assignment Complete', `${count} assets have been assigned successfully.`),
    
    bulkUpdate: (count: number) =>
      success('Bulk Update Complete', `${count} items have been updated successfully.`),
    
    // Validation errors
    validationError: (message: string) =>
      error('Validation Error', message),
    
    // Network errors
    networkError: () =>
      error('Network Error', 'Unable to connect to the server. Please check your connection.'),
    
    // Permission errors
    permissionDenied: () =>
      error('Permission Denied', 'You do not have permission to perform this action.'),
    
    // Maintenance notifications
    maintenanceScheduled: (assetName: string, date: string) =>
      info('Maintenance Scheduled', `Maintenance for ${assetName} is scheduled for ${date}.`),
    
    warrantyExpiring: (assetName: string, days: number) =>
      warning('Warranty Expiring', `${assetName} warranty expires in ${days} days.`),
    
    // Import/Export operations
    dataImported: (count: number) =>
      success('Data Imported', `${count} records have been imported successfully.`),
    
    dataExported: (filename: string) =>
      success('Data Exported', `Report has been exported as ${filename}.`),
    
    // Sync operations
    syncComplete: () =>
      success('Sync Complete', 'Data has been synchronized successfully.'),
    
    syncFailed: () =>
      error('Sync Failed', 'Unable to synchronize data. Please try again.'),
  }
} 