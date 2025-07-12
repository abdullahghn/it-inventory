'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAssignmentSchema, type CreateAssignment } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, X, Package, User, Calendar, FileText } from 'lucide-react'

interface Asset {
  id: number
  name: string
  category: string
  serialNumber: string | null
  status: string
}

interface User {
  id: string
  name: string
  email: string
  department: string | null
}

export function AssignmentForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assets, setAssets] = useState<Asset[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<CreateAssignment>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      assetId: 0,
      userId: '',
      purpose: '',
      expectedReturnAt: null,
      notes: '',
    },
  })

  // Fetch available assets and users
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available assets (not currently assigned)
        const assetsResponse = await fetch('/api/assets?isAssigned=false&limit=100')
        if (assetsResponse.ok) {
          const assetsData = await assetsResponse.json()
          setAssets(assetsData.data || [])
        }

        // Fetch active users
        const usersResponse = await fetch('/api/users?isActive=true&limit=100')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData.users || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast({
          type: 'error',
          title: 'Error',
          description: 'Failed to load assets and users',
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  const onSubmit = async (data: CreateAssignment) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create assignment')
      }

      const result = await response.json()
      
      toast({
        type: 'success',
        title: 'Assignment Created',
        description: result.message || 'Asset assigned successfully',
      })

      router.push('/dashboard/assignments')
    } catch (error: any) {
      toast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to create assignment',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Asset Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Asset Selection
          </CardTitle>
          <CardDescription>
            Choose an unassigned asset to assign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assetId">Select Asset *</Label>
            <Select
              value={watch('assetId')?.toString() || ''}
              onValueChange={(value) => setValue('assetId', parseInt(value))}
            >
              <SelectTrigger className={errors.assetId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Choose an unassigned asset" />
              </SelectTrigger>
              <SelectContent>
                {assets.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id.toString()}>
                    {asset.name} - {asset.category}
                    {asset.serialNumber && ` (${asset.serialNumber})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assetId && (
              <p className="text-sm text-red-500">{errors.assetId.message}</p>
            )}
            {assets.length === 0 && (
              <p className="text-sm text-amber-600">
                No unassigned assets found. All assets may be currently assigned to users.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Assignment
          </CardTitle>
          <CardDescription>
            Select the user to assign the asset to
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Assign to User *</Label>
            <Select
              value={watch('userId')}
              onValueChange={(value) => setValue('userId', value)}
            >
              <SelectTrigger className={errors.userId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Choose a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                    {user.department && ` - ${user.department}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.userId && (
              <p className="text-sm text-red-500">{errors.userId.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignment Details
          </CardTitle>
          <CardDescription>
            Provide additional information about the assignment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Input
              id="purpose"
              {...register('purpose')}
              placeholder="e.g., Work from home, Project assignment, Temporary use"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedReturnAt">Expected Return Date</Label>
            <Input
              id="expectedReturnAt"
              type="date"
              {...register('expectedReturnAt')}
              min={new Date().toISOString().split('T')[0]}
            />
            <p className="text-sm text-gray-500">
              Leave empty for indefinite assignment
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Assignment Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Enter any additional notes about this assignment"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || assets.length === 0}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Create Assignment
        </Button>
      </div>
    </form>
  )
} 