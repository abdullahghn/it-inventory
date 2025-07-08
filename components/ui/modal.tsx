'use client'

import * as React from 'react'
import { AlertTriangle, CheckCircle, Info, XCircle, Trash2, Plus, Edit } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Base modal interface
interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

// Base modal component
export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
}: BaseModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] h-[95vh]',
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}

// Confirmation modal interface
interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  isLoading?: boolean
}

// Confirmation modal with different variants
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'warning',
  isLoading = false,
}: ConfirmationModalProps) {
  const variantConfig = {
    danger: {
      icon: <XCircle className="h-6 w-6 text-destructive" />,
      confirmVariant: 'destructive' as const,
    },
    warning: {
      icon: <AlertTriangle className="h-6 w-6 text-orange-500" />,
      confirmVariant: 'default' as const,
    },
    info: {
      icon: <Info className="h-6 w-6 text-blue-500" />,
      confirmVariant: 'default' as const,
    },
    success: {
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      confirmVariant: 'default' as const,
    },
  }

  const config = variantConfig[variant]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center space-x-3">
            {config.icon}
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={config.confirmVariant}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Delete confirmation modal (specialized for asset/user deletion)
interface DeleteConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
  itemType: 'asset' | 'user' | 'assignment' | 'request'
  additionalInfo?: string
  isLoading?: boolean
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  additionalInfo,
  isLoading = false,
}: DeleteConfirmationModalProps) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Delete ${itemType}`}
      message={`Are you sure you want to delete "${itemName}"? ${
        additionalInfo || 'This action cannot be undone.'
      }`}
      confirmText="Delete"
      cancelText="Cancel"
      variant="danger"
      isLoading={isLoading}
    />
  )
}

// Form modal (for create/edit operations)
interface FormModalProps extends BaseModalProps {
  onSubmit?: () => void
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  isSubmitting?: boolean
  isValid?: boolean
  type?: 'create' | 'edit'
  icon?: React.ReactNode
}

export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  onCancel,
  title,
  description,
  children,
  submitText,
  cancelText = 'Cancel',
  isSubmitting = false,
  isValid = true,
  type = 'create',
  icon,
  size = 'lg',
  className,
}: FormModalProps) {
  const defaultSubmitText = type === 'create' ? 'Create' : 'Save Changes'
  const defaultIcon = type === 'create' ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      onClose()
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      className={className}
    >
      <div className="space-y-4">
        {children}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
          {cancelText}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !isValid}
          className="min-w-[100px]"
        >
          {isSubmitting ? (
            'Saving...'
          ) : (
            <div className="flex items-center space-x-2">
              {icon || defaultIcon}
              <span>{submitText || defaultSubmitText}</span>
            </div>
          )}
        </Button>
      </DialogFooter>
    </Modal>
  )
}

// Asset assignment modal
interface AssetAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onAssign: (userId: string, notes?: string) => void
  assetName: string
  availableUsers: Array<{ id: string; name: string; department: string }>
  isLoading?: boolean
}

export function AssetAssignmentModal({
  isOpen,
  onClose,
  onAssign,
  assetName,
  availableUsers,
  isLoading = false,
}: AssetAssignmentModalProps) {
  const [selectedUserId, setSelectedUserId] = React.useState('')
  const [notes, setNotes] = React.useState('')

  const handleAssign = () => {
    if (selectedUserId) {
      onAssign(selectedUserId, notes || undefined)
    }
  }

  const selectedUser = availableUsers.find(user => user.id === selectedUserId)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Asset</DialogTitle>
          <DialogDescription>
            Assign "{assetName}" to a user
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Choose a user...</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.department})
                </option>
              ))}
            </select>
          </div>
          {selectedUser && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">{selectedUser.name}</p>
              <p className="text-sm text-muted-foreground">{selectedUser.department}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Assignment Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this assignment..."
              className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUserId || isLoading}
          >
            {isLoading ? 'Assigning...' : 'Assign Asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Bulk action confirmation modal
interface BulkActionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  action: string
  selectedItems: Array<{ id: string; name: string }>
  isLoading?: boolean
}

export function BulkActionModal({
  isOpen,
  onClose,
  onConfirm,
  action,
  selectedItems,
  isLoading = false,
}: BulkActionModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Bulk Action</DialogTitle>
          <DialogDescription>
            You are about to {action.toLowerCase()} {selectedItems.length} item(s)
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="max-h-40 overflow-y-auto">
            <ul className="space-y-1">
              {selectedItems.map((item) => (
                <li key={item.id} className="text-sm p-2 bg-muted rounded">
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">
            This action will affect all selected items. Are you sure you want to continue?
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Processing...' : `${action} Selected`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 