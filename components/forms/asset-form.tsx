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
import { Switch } from '@/components/ui/switch'
import { assetFormSchema, type AssetFormData } from '@/lib/validations'
import { assetCategoryEnum, assetStatusEnum, assetConditionEnum } from '@/lib/db/schema'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, X, RefreshCw } from 'lucide-react'

interface AssetFormProps {
  initialData?: Partial<AssetFormData>
  onSubmit: (data: AssetFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  mode?: 'create' | 'edit'
}

export function AssetForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading = false,
  mode = 'create' 
}: AssetFormProps) {
  const [isGeneratingTag, setIsGeneratingTag] = useState(false)
  const { toast } = useToast()
  
  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetFormSchema),
    defaultValues: {
      assetTag: initialData?.assetTag || '',
      name: initialData?.name || '',
      category: initialData?.category || 'laptop',
      subcategory: initialData?.subcategory || '',
      serialNumber: initialData?.serialNumber || '',
      model: initialData?.model || '',
      manufacturer: initialData?.manufacturer || '',
      status: initialData?.status || 'available',
      condition: initialData?.condition || 'good',
      purchaseDate: initialData?.purchaseDate || null,
      purchasePrice: initialData?.purchasePrice || '',
      currentValue: initialData?.currentValue || '',
      warrantyExpiry: initialData?.warrantyExpiry || null,
      building: initialData?.building || '',
      floor: initialData?.floor || '',
      room: initialData?.room || '',
      desk: initialData?.desk || '',
      description: initialData?.description || '',
      notes: initialData?.notes || '',
    },
  })

  // Auto-generate asset tag for new assets
  useEffect(() => {
    if (mode === 'create' && !form.getValues('assetTag')) {
      generateAssetTag()
    }
  }, [mode, form])

  /**
   * Generates a unique asset tag based on category and current timestamp
   * Format: CAT-YYYYMMDD-XXXX (e.g., LAP-20241201-0001)
   */
  const generateAssetTag = async () => {
    setIsGeneratingTag(true)
    try {
      const category = form.getValues('category')
      const categoryPrefix = category.toUpperCase().substring(0, 3)
      const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
      const newTag = `${categoryPrefix}-${date}-${randomSuffix}`
      
      form.setValue('assetTag', newTag)
      toast({
        type: 'success',
        title: 'Asset tag generated',
        description: `Generated tag: ${newTag}`,
      })
    } catch (error) {
      toast({
        type: 'error',
        title: 'Error generating tag',
        description: 'Failed to generate asset tag. Please enter manually.',
      })
    } finally {
      setIsGeneratingTag(false)
    }
  }

  /**
   * Handles form submission with validation and error handling
   */
  const handleSubmit = async (data: any) => {
    try {
      // Convert the form data to the expected AssetFormData type
      const assetData: AssetFormData = {
        assetTag: data.assetTag,
        name: data.name,
        category: data.category,
        subcategory: data.subcategory,
        serialNumber: data.serialNumber,
        model: data.model,
        manufacturer: data.manufacturer,
        status: data.status,
        condition: data.condition,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice,
        currentValue: data.currentValue,
        depreciationRate: data.depreciationRate,
        warrantyExpiry: data.warrantyExpiry,
        building: data.building,
        floor: data.floor,
        room: data.room,
        desk: data.desk,
        locationNotes: data.locationNotes,
        description: data.description,
        notes: data.notes,
        specifications: data.specifications,
      }
      
      await onSubmit(assetData)
      toast({
        type: 'success',
        title: 'Success',
        description: `Asset ${mode === 'create' ? 'created' : 'updated'} successfully`,
      })
    } catch (error) {
      console.error('Asset form submission error:', error)
      toast({
        type: 'error',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save asset',
      })
    }
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {mode === 'create' ? 'Create New Asset' : 'Edit Asset'}
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </CardTitle>
          <CardDescription>
            {mode === 'create' 
              ? 'Add a new asset to the inventory system' 
              : 'Update asset information and details'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset Tag */}
              <div className="space-y-2">
                <Label htmlFor="assetTag">Asset Tag *</Label>
                <div className="flex gap-2">
                  <Input
                    id="assetTag"
                    {...form.register('assetTag')}
                    placeholder="IT-0001"
                    className={form.formState.errors.assetTag ? 'border-red-500' : ''}
                  />
                  {mode === 'create' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateAssetTag}
                      disabled={isGeneratingTag}
                    >
                      {isGeneratingTag ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                {form.formState.errors.assetTag && (
                  <p className="text-sm text-red-500">{form.formState.errors.assetTag.message}</p>
                )}
              </div>

              {/* Asset Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Asset Name *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Dell Latitude 5520"
                  className={form.formState.errors.name ? 'border-red-500' : ''}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={form.watch('category')}
                  onValueChange={(value) => form.setValue('category', value as any)}
                >
                  <SelectTrigger className={form.formState.errors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {['laptop', 'desktop', 'monitor', 'printer', 'phone', 'tablet', 'server', 'network_device', 'software_license', 'toner', 'other'].map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <p className="text-sm text-red-500">{form.formState.errors.category.message}</p>
                )}
              </div>

              {/* Subcategory */}
              <div className="space-y-2">
                <Label htmlFor="subcategory">Subcategory</Label>
                <Input
                  id="subcategory"
                  {...form.register('subcategory')}
                  placeholder="Business laptop, Gaming desktop, etc."
                />
              </div>
            </div>
          </div>

          {/* Technical Specifications Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Technical Specifications</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Serial Number */}
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  {...form.register('serialNumber')}
                  placeholder="SN123456789"
                />
              </div>

              {/* Model */}
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  {...form.register('model')}
                  placeholder="Latitude 5520"
                />
              </div>

              {/* Manufacturer */}
              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  {...form.register('manufacturer')}
                  placeholder="Dell, HP, Lenovo, etc."
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {['available', 'assigned', 'maintenance', 'repair', 'retired', 'lost', 'stolen'].map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Condition */}
              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={form.watch('condition')}
                  onValueChange={(value) => form.setValue('condition', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    {['new', 'excellent', 'good', 'fair', 'poor', 'damaged'].map((condition) => (
                      <SelectItem key={condition} value={condition}>
                        {condition.charAt(0).toUpperCase() + condition.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Financial Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Financial Information</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purchase Date */}
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  {...form.register('purchaseDate')}
                  className={form.formState.errors.purchaseDate ? 'border-red-500' : ''}
                />
                {form.formState.errors.purchaseDate && (
                  <p className="text-sm text-red-500">{form.formState.errors.purchaseDate.message}</p>
                )}
              </div>

              {/* Purchase Price */}
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price (SAR)</Label>
                <Input
                  id="purchasePrice"
                  {...form.register('purchasePrice')}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  className={form.formState.errors.purchasePrice ? 'border-red-500' : ''}
                />
                {form.formState.errors.purchasePrice && (
                  <p className="text-sm text-red-500">{form.formState.errors.purchasePrice.message}</p>
                )}
              </div>

              {/* Current Value */}
              <div className="space-y-2">
                <Label htmlFor="currentValue">Current Value (SAR)</Label>
                <Input
                  id="currentValue"
                  {...form.register('currentValue')}
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0"
                  className={form.formState.errors.currentValue ? 'border-red-500' : ''}
                />
                {form.formState.errors.currentValue && (
                  <p className="text-sm text-red-500">{form.formState.errors.currentValue.message}</p>
                )}
              </div>

              {/* Warranty Expiry */}
              <div className="space-y-2">
                <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                <Input
                  id="warrantyExpiry"
                  type="date"
                  {...form.register('warrantyExpiry')}
                  className={form.formState.errors.warrantyExpiry ? 'border-red-500' : ''}
                />
                {form.formState.errors.warrantyExpiry && (
                  <p className="text-sm text-red-500">{form.formState.errors.warrantyExpiry.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location Information</h3>
            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Building */}
              <div className="space-y-2">
                <Label htmlFor="building">Building</Label>
                <Input
                  id="building"
                  {...form.register('building')}
                  placeholder="Main Building, Annex, etc."
                />
              </div>

              {/* Floor */}
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  {...form.register('floor')}
                  placeholder="1st, 2nd, Ground, etc."
                />
              </div>

              {/* Room */}
              <div className="space-y-2">
                <Label htmlFor="room">Room</Label>
                <Input
                  id="room"
                  {...form.register('room')}
                  placeholder="101, Conference Room, etc."
                />
              </div>

              {/* Desk */}
              <div className="space-y-2">
                <Label htmlFor="desk">Desk/Station</Label>
                <Input
                  id="desk"
                  {...form.register('desk')}
                  placeholder="A1, B2, Workstation 1, etc."
                />
              </div>
            </div>

            {/* Location Notes */}
            <div className="space-y-2">
              <Label htmlFor="locationNotes">Location Notes</Label>
              <Textarea
                id="locationNotes"
                {...form.register('locationNotes')}
                placeholder="Additional location details or instructions"
                rows={2}
              />
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>
            <Separator />
            
            <div className="space-y-4">
              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...form.register('description')}
                  placeholder="Detailed description of the asset"
                  rows={3}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  {...form.register('notes')}
                  placeholder="Additional notes, special instructions, or comments"
                  rows={3}
                />
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
          {isLoading ? 'Saving...' : mode === 'create' ? 'Create Asset' : 'Update Asset'}
        </Button>
      </div>
    </form>
  )
} 