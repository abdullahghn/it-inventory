'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Shield, User, Users, Settings, Crown } from 'lucide-react'
import { type UserRole } from '@/components/auth/RoleGuard'

// Role configuration with icons and descriptions
const ROLE_CONFIG: Record<UserRole, {
  label: string
  description: string
  icon: React.ReactNode
  color: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info'
  hierarchy: number
}> = {
  viewer: {
    label: 'Viewer',
    description: 'View-only access to assigned assets',
    icon: <User className="h-4 w-4" />,
    color: 'outline',
    hierarchy: 1,
  },
  user: {
    label: 'User',
    description: 'Standard user with personal asset access',
    icon: <User className="h-4 w-4" />,
    color: 'secondary',
    hierarchy: 2,
  },
  end_user: {
    label: 'End User',
    description: 'Standard user with personal asset access',
    icon: <User className="h-4 w-4" />,
    color: 'secondary',
    hierarchy: 2,
  },
  manager: {
    label: 'Manager',
    description: 'Department management and oversight',
    icon: <Users className="h-4 w-4" />,
    color: 'info',
    hierarchy: 3,
  },
  it_staff: {
    label: 'IT Staff',
    description: 'IT operations and daily management',
    icon: <Settings className="h-4 w-4" />,
    color: 'warning',
    hierarchy: 4,
  },
  admin: {
    label: 'Administrator',
    description: 'System administration and configuration',
    icon: <Shield className="h-4 w-4" />,
    color: 'success',
    hierarchy: 5,
  },
  super_admin: {
    label: 'Super Admin',
    description: 'Full system control and security',
    icon: <Crown className="h-4 w-4" />,
    color: 'destructive',
    hierarchy: 6,
  },
}

// Base form field wrapper
interface RoleSelectorFieldProps {
  label?: string
  error?: string
  required?: boolean
  description?: string
  className?: string
  children: React.ReactNode
}

function RoleSelectorField({
  label,
  error,
  required,
  description,
  className,
  children,
}: RoleSelectorFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}

// Dropdown-based role selector
interface RoleSelectorDropdownProps {
  value?: UserRole
  onChange?: (role: UserRole) => void
  label?: string
  error?: string
  required?: boolean
  description?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  allowedRoles?: UserRole[]
  blockedRoles?: UserRole[]
  showHierarchy?: boolean
  currentUserRole?: UserRole
}

export function RoleSelectorDropdown({
  value,
  onChange,
  label,
  error,
  required,
  description,
  placeholder = 'Select a role...',
  disabled = false,
  className,
  allowedRoles,
  blockedRoles = [],
  showHierarchy = false,
  currentUserRole,
}: RoleSelectorDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // Filter available roles based on permissions
  const availableRoles = React.useMemo(() => {
    let roles = Object.keys(ROLE_CONFIG) as UserRole[]
    
    // Filter by allowed roles
    if (allowedRoles) {
      roles = roles.filter(role => allowedRoles.includes(role))
    }
    
    // Filter out blocked roles
    roles = roles.filter(role => !blockedRoles.includes(role))
    
    // Filter by hierarchy (users can't assign roles higher than their own)
    if (currentUserRole) {
      const currentHierarchy = ROLE_CONFIG[currentUserRole].hierarchy
      roles = roles.filter(role => ROLE_CONFIG[role].hierarchy <= currentHierarchy)
    }
    
    return roles.sort((a, b) => ROLE_CONFIG[a].hierarchy - ROLE_CONFIG[b].hierarchy)
  }, [allowedRoles, blockedRoles, currentUserRole])

  const selectedRole = value ? ROLE_CONFIG[value] : null

  return (
    <RoleSelectorField
      label={label}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={disabled}
            className={cn(
              'w-full justify-between',
              error && 'border-destructive focus-visible:ring-destructive'
            )}
          >
            {selectedRole ? (
              <div className="flex items-center space-x-2">
                {selectedRole.icon}
                <span>{selectedRole.label}</span>
                {showHierarchy && (
                  <Badge variant="outline" className="text-xs">
                    Level {selectedRole.hierarchy}
                  </Badge>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-full min-w-[280px]">
          <DropdownMenuLabel>Select Role</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableRoles.map((role) => {
            const config = ROLE_CONFIG[role]
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => {
                  onChange?.(role)
                  setIsOpen(false)
                }}
                className="flex items-center space-x-3 p-3"
              >
                <div className="flex items-center space-x-2 flex-1">
                  {config.icon}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{config.label}</span>
                      {showHierarchy && (
                        <Badge variant="outline" className="text-xs">
                          Level {config.hierarchy}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
                {value === role && (
                  <Badge variant={config.color} className="ml-2">
                    Selected
                  </Badge>
                )}
              </DropdownMenuItem>
            )
          })}
          {availableRoles.length === 0 && (
            <DropdownMenuItem disabled className="text-muted-foreground">
              No roles available
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </RoleSelectorField>
  )
}

// Radio-based role selector
interface RoleSelectorRadioProps {
  value?: UserRole
  onChange?: (role: UserRole) => void
  label?: string
  error?: string
  required?: boolean
  description?: string
  disabled?: boolean
  className?: string
  allowedRoles?: UserRole[]
  blockedRoles?: UserRole[]
  showHierarchy?: boolean
  currentUserRole?: UserRole
  layout?: 'vertical' | 'horizontal'
}

export function RoleSelectorRadio({
  value,
  onChange,
  label,
  error,
  required,
  description,
  disabled = false,
  className,
  allowedRoles,
  blockedRoles = [],
  showHierarchy = false,
  currentUserRole,
  layout = 'vertical',
}: RoleSelectorRadioProps) {
  // Filter available roles based on permissions
  const availableRoles = React.useMemo(() => {
    let roles = Object.keys(ROLE_CONFIG) as UserRole[]
    
    // Filter by allowed roles
    if (allowedRoles) {
      roles = roles.filter(role => allowedRoles.includes(role))
    }
    
    // Filter out blocked roles
    roles = roles.filter(role => !blockedRoles.includes(role))
    
    // Filter by hierarchy (users can't assign roles higher than their own)
    if (currentUserRole) {
      const currentHierarchy = ROLE_CONFIG[currentUserRole].hierarchy
      roles = roles.filter(role => ROLE_CONFIG[role].hierarchy <= currentHierarchy)
    }
    
    return roles.sort((a, b) => ROLE_CONFIG[a].hierarchy - ROLE_CONFIG[b].hierarchy)
  }, [allowedRoles, blockedRoles, currentUserRole])

  return (
    <RoleSelectorField
      label={label}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <div className={cn(
        'space-y-3',
        layout === 'horizontal' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'
      )}>
        {availableRoles.map((role) => {
          const config = ROLE_CONFIG[role]
          const isSelected = value === role
          
          return (
            <div
              key={role}
              className={cn(
                'relative flex items-start space-x-3 p-3 border rounded-lg cursor-pointer transition-colors',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={() => !disabled && onChange?.(role)}
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={isSelected}
                onChange={() => !disabled && onChange?.(role)}
                disabled={disabled}
                className="mt-1 h-4 w-4 text-primary border-gray-300 focus:ring-primary"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  {config.icon}
                  <span className="font-medium text-sm">{config.label}</span>
                  {showHierarchy && (
                    <Badge variant="outline" className="text-xs">
                      Level {config.hierarchy}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {config.description}
                </p>
              </div>
            </div>
          )
        })}
        {availableRoles.length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            No roles available
          </div>
        )}
      </div>
    </RoleSelectorField>
  )
}

// Simple select-based role selector (fallback)
interface RoleSelectorSelectProps {
  value?: UserRole
  onChange?: (role: UserRole) => void
  label?: string
  error?: string
  required?: boolean
  description?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  allowedRoles?: UserRole[]
  blockedRoles?: UserRole[]
  currentUserRole?: UserRole
}

export function RoleSelectorSelect({
  value,
  onChange,
  label,
  error,
  required,
  description,
  placeholder = 'Select a role...',
  disabled = false,
  className,
  allowedRoles,
  blockedRoles = [],
  currentUserRole,
}: RoleSelectorSelectProps) {
  // Filter available roles based on permissions
  const availableRoles = React.useMemo(() => {
    let roles = Object.keys(ROLE_CONFIG) as UserRole[]
    
    // Filter by allowed roles
    if (allowedRoles) {
      roles = roles.filter(role => allowedRoles.includes(role))
    }
    
    // Filter out blocked roles
    roles = roles.filter(role => !blockedRoles.includes(role))
    
    // Filter by hierarchy (users can't assign roles higher than their own)
    if (currentUserRole) {
      const currentHierarchy = ROLE_CONFIG[currentUserRole].hierarchy
      roles = roles.filter(role => ROLE_CONFIG[role].hierarchy <= currentHierarchy)
    }
    
    return roles.sort((a, b) => ROLE_CONFIG[a].hierarchy - ROLE_CONFIG[b].hierarchy)
  }, [allowedRoles, blockedRoles, currentUserRole])

  return (
    <RoleSelectorField
      label={label}
      error={error}
      required={required}
      description={description}
      className={className}
    >
      <select
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value as UserRole)}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-destructive focus-visible:ring-destructive'
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {availableRoles.map((role) => {
          const config = ROLE_CONFIG[role]
          return (
            <option key={role} value={role}>
              {config.label} - {config.description}
            </option>
          )
        })}
      </select>
    </RoleSelectorField>
  )
}

// Default export (dropdown version)
export const RoleSelector = RoleSelectorDropdown

// Export role configuration for external use
export { ROLE_CONFIG }
export type { UserRole } 