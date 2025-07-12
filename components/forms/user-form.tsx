'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { userFormSchema, type UserFormData } from '@/lib/validations'
import { userRoleEnum } from '@/lib/db/schema'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, X, User, Mail, Phone, Building, Badge } from 'lucide-react'

interface UserFormProps {
  initialData?: Partial<UserFormData>
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  mode?: 'create' | 'edit'
  currentUserRole?: string
}

export function UserForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = 'create',
  currentUserRole = 'user'
}: UserFormProps) {
  const { toast } = useToast()
  
  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      department: initialData?.department || '',
      jobTitle: initialData?.jobTitle || '',
      employeeId: initialData?.employeeId || '',
      phone: initialData?.phone || '',
      role: initialData?.role || 'user',
      isActive: initialData?.isActive ?? true,
    },
  })

  /**
   * Determines if the current user can assign certain roles
   * Only super_admin can assign admin roles, admin can assign manager and below
   */
  const canAssignRole = (targetRole: string) => {
    if (currentUserRole === 'super_admin') return true
    if (currentUserRole === 'admin' && targetRole !== 'super_admin' && targetRole !== 'admin') return true
    return false
  }

  /**
   * Handles form submission with validation and error handling
   */
  const handleSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data)
      toast({
        type: 'success',
        title: 'Success',
        description: `User ${mode === 'create' ? 'created' : 'updated'} successfully`,
      })
    } catch (error) {
      console.error('User form submission error:', error)
      toast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save user',
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {mode === 'create' ? 'Create New User' : 'Edit User Profile'}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            {mode === 'create' 
              ? 'Add a new user to the system with appropriate permissions' 
              : 'Update user information and role assignments'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="John Doe"
                  className={form.formState.errors.name ? 'border-red-500' : ''}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register('email')}
                  placeholder="john.doe@company.com"
                  className={form.formState.errors.email ? 'border-red-500' : ''}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Employee ID */}
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  {...form.register('employeeId')}
                  placeholder="EMP001"
                  className={form.formState.errors.employeeId ? 'border-red-500' : ''}
                />
                {form.formState.errors.employeeId && (
                  <p className="text-sm text-red-500">{form.formState.errors.employeeId.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  {...form.register('phone')}
                  placeholder="+966 50 123 4567"
                  className={form.formState.errors.phone ? 'border-red-500' : ''}
                />
                {form.formState.errors.phone && (
                  <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Professional Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building className="h-4 w-4" />
              Professional Information
            </h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Department */}
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  {...form.register('department')}
                  placeholder="IT, HR, Finance, etc."
                />
              </div>

              {/* Job Title */}
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title</Label>
                <Input
                  id="jobTitle"
                  {...form.register('jobTitle')}
                  placeholder="Software Engineer, Manager, etc."
                />
              </div>
            </div>
          </div>

          {/* System Access Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Badge className="h-4 w-4" />
              System Access
            </h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">User Role *</Label>
                <Select
                  value={form.watch('role')}
                  onValueChange={(value) => form.setValue('role', value as any)}
                  disabled={!canAssignRole(form.watch('role'))}
                >
                  <SelectTrigger className={form.formState.errors.role ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {['super_admin', 'admin', 'manager', 'user', 'viewer'].map((role) => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.role && (
                  <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Role determines user permissions and access levels
                </p>
              </div>

              {/* Active Status */}
              <div className="space-y-2">
                <Label htmlFor="isActive">Account Status</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={form.watch('isActive')}
                    onCheckedChange={(checked) => form.setValue('isActive', checked)}
                  />
                  <Label htmlFor="isActive" className="text-sm">
                    {form.watch('isActive') ? 'Active' : 'Inactive'}
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Inactive users cannot log in or access the system
                </p>
              </div>
            </div>
          </div>

          {/* Role Descriptions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Role Permissions</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Super Admin</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Full system access and configuration</li>
                  <li>• User and role management</li>
                  <li>• System settings and security</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Admin</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Asset and user management</li>
                  <li>• Assignment and maintenance oversight</li>
                  <li>• Reports and analytics access</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Manager</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Department asset oversight</li>
                  <li>• Assignment approvals</li>
                  <li>• Department reports</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">User</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• View assigned assets</li>
                  <li>• Submit maintenance requests</li>
                  <li>• Personal asset history</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create User' : 'Update User'}
        </Button>
      </div>
    </form>
  )
} 