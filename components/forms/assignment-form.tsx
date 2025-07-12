'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { assignmentFormSchema, type AssignmentFormData } from '@/lib/validations'
import { assignmentStatusEnum } from '@/lib/db/schema'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, X, Search, User, Package, Calendar, FileText } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  department?: string
  role: string
  isActive: boolean
}

interface Asset {
  id: number
  assetTag: string
  name: string
  category: string
  status: string
  condition: string
  manufacturer?: string
  model?: string
}

interface AssignmentFormProps {
  initialData?: Partial<AssignmentFormData>
  onSubmit: (data: AssignmentFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  mode?: 'create' | 'edit'
  availableAssets?: Asset[]
  availableUsers?: User[]
  currentAssignment?: any
  preSelectedAsset?: Asset | null
}

export function AssignmentForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = 'create',
  availableAssets = [],
  availableUsers = [],
  currentAssignment,
  preSelectedAsset
}: AssignmentFormProps) {
  const { toast } = useToast()
  const [searchAsset, setSearchAsset] = useState('')
  const [searchUser, setSearchUser] = useState('')
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [hasUserChangedAsset, setHasUserChangedAsset] = useState(false)

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      assetId: initialData?.assetId || 0,
      userId: initialData?.userId || '',
      purpose: initialData?.purpose || '',
      expectedReturnAt: initialData?.expectedReturnAt || null,
      notes: initialData?.notes || '',
    },
  })

  // Filter assets based on search
  const filteredAssets = availableAssets.filter(asset => 
    asset.assetTag.toLowerCase().includes(searchAsset.toLowerCase()) ||
    asset.name.toLowerCase().includes(searchAsset.toLowerCase()) ||
    asset.manufacturer?.toLowerCase().includes(searchAsset.toLowerCase()) ||
    asset.model?.toLowerCase().includes(searchAsset.toLowerCase())
  )

  // Filter users based on search
  const filteredUsers = availableUsers.filter(user => 
    user.name.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchUser.toLowerCase())
  )

  // Set selected asset when assetId changes or when preSelectedAsset is provided
  useEffect(() => {
    const assetId = form.watch('assetId')
    if (assetId && assetId > 0) {
      const asset = availableAssets.find(a => a.id === assetId)
      setSelectedAsset(asset || null)
    } else if (preSelectedAsset && !selectedAsset && !hasUserChangedAsset) {
      // Only set preSelectedAsset if no asset is currently selected and user hasn't changed it
      setSelectedAsset(preSelectedAsset)
      form.setValue('assetId', preSelectedAsset.id)
    }
  }, [form.watch('assetId'), availableAssets, preSelectedAsset, form, selectedAsset, hasUserChangedAsset])

  // Set selected user when userId changes
  useEffect(() => {
    const userId = form.watch('userId')
    if (userId) {
      const user = availableUsers.find(u => u.id === userId)
      setSelectedUser(user || null)
    }
  }, [form.watch('userId'), availableUsers])

  /**
   * Handles asset selection and updates form
   */
  const handleAssetSelect = (asset: Asset) => {
    setSelectedAsset(asset)
    setHasUserChangedAsset(true)
    form.setValue('assetId', asset.id)
    setSearchAsset('')
  }

  /**
   * Handles user selection and updates form
   */
  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    form.setValue('userId', user.id)
    setSearchUser('')
  }

  /**
   * Handles form submission with validation and error handling
   */
  const handleSubmit = async (data: AssignmentFormData) => {
    try {
      await onSubmit(data)
      toast({
        type: 'success',
        title: 'Success',
        description: `Assignment ${mode === 'create' ? 'created' : 'updated'} successfully`,
      })
    } catch (error) {
      console.error('Assignment form submission error:', error)
      toast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save assignment',
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {mode === 'create' ? 'Assign Asset' : 'Edit Assignment'}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            {mode === 'create' 
              ? 'Assign an asset to a user with purpose and return date' 
              : 'Update assignment details and return information'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Asset Selection Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Asset Selection
              {preSelectedAsset && (
                <span className="text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  Pre-selected from URL
                </span>
              )}
            </h3>
            <Separator />
            
            <div className="space-y-4">
              {/* Asset Search - Show only if no asset is selected or when searching */}
              {(!selectedAsset || searchAsset) && (
                <div className="space-y-2">
                  <Label htmlFor="assetSearch">
                    {selectedAsset ? 'Search for Different Asset' : 'Search Asset'}
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="assetSearch"
                      placeholder="Search by asset tag, name, manufacturer, or model..."
                      value={searchAsset}
                      onChange={(e) => setSearchAsset(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              {/* Asset List */}
              {searchAsset && (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {filteredAssets.length > 0 ? (
                    filteredAssets.map((asset) => (
                      <div
                        key={asset.id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedAsset?.id === asset.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => handleAssetSelect(asset)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{asset.assetTag}</p>
                            <p className="text-sm text-gray-600">{asset.name}</p>
                            <p className="text-xs text-gray-500">
                              {asset.manufacturer} {asset.model}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              asset.status === 'available' ? 'bg-green-100 text-green-800' :
                              asset.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {asset.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{asset.condition}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No assets found matching your search
                    </div>
                  )}
                </div>
              )}

              {/* Selected Asset Display */}
              {selectedAsset && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">Selected Asset</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAsset(null)
                        setSearchAsset('')
                        setHasUserChangedAsset(true)
                        form.setValue('assetId', 0)
                      }}
                    >
                      Change Asset
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Tag:</span> {selectedAsset.assetTag}</p>
                      <p><span className="font-medium">Name:</span> {selectedAsset.name}</p>
                      <p><span className="font-medium">Category:</span> {selectedAsset.category}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Status:</span> {selectedAsset.status}</p>
                      <p><span className="font-medium">Condition:</span> {selectedAsset.condition}</p>
                      <p><span className="font-medium">Model:</span> {selectedAsset.manufacturer} {selectedAsset.model}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Selection Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              User Selection
            </h3>
            <Separator />
            
            <div className="space-y-4">
              {/* User Search */}
              <div className="space-y-2">
                <Label htmlFor="userSearch">Search User</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="userSearch"
                    placeholder="Search by name, email, or department..."
                    value={searchUser}
                    onChange={(e) => setSearchUser(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* User List */}
              {searchUser && (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedUser?.id === user.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <p className="text-xs text-gray-500">{user.department}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{user.role}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No users found matching your search
                    </div>
                  )}
                </div>
              )}

              {/* Selected User Display */}
              {selectedUser && (
                <div className="p-4 border rounded-lg bg-gray-50">
                  <h4 className="font-medium mb-2">Selected User</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><span className="font-medium">Name:</span> {selectedUser.name}</p>
                      <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                      <p><span className="font-medium">Department:</span> {selectedUser.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p><span className="font-medium">Role:</span> {selectedUser.role}</p>
                      <p><span className="font-medium">Status:</span> {selectedUser.isActive ? 'Active' : 'Inactive'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Assignment Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Assignment Details
            </h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purpose */}
              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose *</Label>
                <Textarea
                  id="purpose"
                  {...form.register('purpose')}
                  placeholder="Describe the purpose of this assignment (e.g., Work from home, Project work, Replacement device)"
                  rows={3}
                  className={form.formState.errors.purpose ? 'border-red-500' : ''}
                />
                {form.formState.errors.purpose && (
                  <p className="text-sm text-red-500">{form.formState.errors.purpose.message}</p>
                )}
              </div>

              {/* Expected Return Date */}
              <div className="space-y-2">
                <Label htmlFor="expectedReturnAt">Expected Return Date</Label>
                <Input
                  id="expectedReturnAt"
                  type="date"
                  {...form.register('expectedReturnAt')}
                  className={form.formState.errors.expectedReturnAt ? 'border-red-500' : ''}
                />
                {form.formState.errors.expectedReturnAt && (
                  <p className="text-sm text-red-500">{form.formState.errors.expectedReturnAt.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave empty for indefinite assignment
                </p>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Any additional notes or special instructions for this assignment"
                rows={3}
                className={form.formState.errors.notes ? 'border-red-500' : ''}
              />
              {form.formState.errors.notes && (
                <p className="text-sm text-red-500">{form.formState.errors.notes.message}</p>
              )}
            </div>
          </div>

          {/* Current Assignment Warning */}
          {currentAssignment && (
            <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <h4 className="font-medium text-yellow-800 mb-2">Current Assignment</h4>
              <p className="text-sm text-yellow-700">
                This asset is currently assigned to {currentAssignment.userName} since{' '}
                {new Date(currentAssignment.assignedAt).toLocaleDateString()}.
                Creating a new assignment will return the current one.
              </p>
            </div>
          )}
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
        <Button 
          type="submit" 
          disabled={isLoading || !selectedAsset || !selectedUser}
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create Assignment' : 'Update Assignment'}
        </Button>
      </div>
    </form>
  )
} 