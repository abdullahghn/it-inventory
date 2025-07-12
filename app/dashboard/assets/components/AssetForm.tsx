'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createAssetSchema, type CreateAsset, type UpdateAsset } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, X, Building2, MapPin, DollarSign, Calendar, Package, Settings } from 'lucide-react'

interface AssetFormProps {
  asset?: UpdateAsset
  mode?: 'create' | 'edit'
}

export function AssetForm({ asset, mode = 'create' }: AssetFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Use createAssetSchema for both create and update modes
  const schema = createAssetSchema
  const defaultValues = asset || {
    assetTag: '',
    name: '',
    category: 'laptop',
    subcategory: '',
    serialNumber: '',
    model: '',
    manufacturer: '',
    specifications: {},
    purchaseDate: null,
    purchasePrice: '',
    currentValue: '',
    depreciationRate: '',
    warrantyExpiry: null,
    status: 'available',
    condition: 'good',
    building: '',
    floor: '',
    room: '',
    desk: '',
    locationNotes: '',
    description: '',
    notes: '',
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const onSubmit = async (data: any) => {
    setIsSubmitting(true)
    try {
      const url = mode === 'create' ? '/api/assets' : `/api/assets/${asset?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save asset')
      }

      const result = await response.json()
      
      toast({
        type: 'success',
        title: mode === 'create' ? 'Asset Created' : 'Asset Updated',
        description: result.message || `Asset ${mode === 'create' ? 'created' : 'updated'} successfully`,
      })

      router.push('/dashboard/assets')
    } catch (error: any) {
      toast({
        type: 'error',
        title: 'Error',
        description: error.message || 'Failed to save asset',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Basic Information
          </CardTitle>
          <CardDescription>
            Enter the essential details about the asset
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Enter asset name"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message?.toString()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetTag">Asset Tag *</Label>
              <Input
                id="assetTag"
                {...register('assetTag')}
                placeholder="e.g., IT-001234"
                className={errors.assetTag ? 'border-red-500' : ''}
              />
              {errors.assetTag && (
                <p className="text-sm text-red-500">{errors.assetTag.message?.toString()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={watch('category')}
                onValueChange={(value) => setValue('category', value as any)}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laptop">Laptop</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                  <SelectItem value="monitor">Monitor</SelectItem>
                  <SelectItem value="printer">Printer</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="tablet">Tablet</SelectItem>
                  <SelectItem value="server">Server</SelectItem>
                  <SelectItem value="network_device">Network Device</SelectItem>
                  <SelectItem value="software_license">Software License</SelectItem>
                  <SelectItem value="toner">Toner</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-500">{errors.category.message?.toString()}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Input
                id="subcategory"
                {...register('subcategory')}
                placeholder="Enter subcategory"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="serialNumber">Serial Number</Label>
              <Input
                id="serialNumber"
                {...register('serialNumber')}
                placeholder="Enter serial number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                {...register('model')}
                placeholder="Enter model"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer</Label>
              <Input
                id="manufacturer"
                {...register('manufacturer')}
                placeholder="Enter manufacturer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch('status')}
                onValueChange={(value) => setValue('status', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="stolen">Stolen</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={watch('condition')}
                onValueChange={(value) => setValue('condition', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                  <SelectItem value="damaged">Damaged</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Information
          </CardTitle>
          <CardDescription>
            Enter financial details and warranty information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input
                id="purchaseDate"
                type="date"
                {...register('purchaseDate')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price (SAR)</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                {...register('purchasePrice')}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Current Value (SAR)</Label>
              <Input
                id="currentValue"
                type="number"
                step="0.01"
                min="0"
                {...register('currentValue')}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="depreciationRate">Depreciation Rate (%)</Label>
              <Input
                id="depreciationRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                {...register('depreciationRate')}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
              <Input
                id="warrantyExpiry"
                type="date"
                {...register('warrantyExpiry')}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Information
          </CardTitle>
          <CardDescription>
            Specify where the asset is located
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="building">Building</Label>
              <Input
                id="building"
                {...register('building')}
                placeholder="Building name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input
                id="floor"
                {...register('floor')}
                placeholder="Floor number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room">Room</Label>
              <Input
                id="room"
                {...register('room')}
                placeholder="Room number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="desk">Desk/Position</Label>
              <Input
                id="desk"
                {...register('desk')}
                placeholder="Desk number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locationNotes">Location Notes</Label>
            <Textarea
              id="locationNotes"
              {...register('locationNotes')}
              placeholder="Additional location details"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Additional Information
          </CardTitle>
          <CardDescription>
            Add descriptions and notes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Enter asset description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Any additional notes"
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {mode === 'create' ? 'Create Asset' : 'Update Asset'}
        </Button>
      </div>
    </form>
  )
} 