'use server'

import { db } from '@/lib/db'
import { assets } from '@/lib/db/schema'
import { createAssetSchema, updateAssetSchema } from '@/lib/validations'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, count } from 'drizzle-orm'
import { 
  dbUtils, 
  dbTransaction, 
  DatabaseError, 
  NotFoundError,
  DuplicateError,
  formatConstraintError 
} from '@/lib/db/utils'
import { requireRole } from '@/lib/auth'

function generateAssetTag(): string {
  const timestamp = Date.now().toString()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `AST-${timestamp.slice(-6)}${random}`
}

export async function createAsset(formData: FormData) {
  try {
    // Check permissions - only admin and above can create assets
    await requireRole('admin')
    
    console.log('Form data received:', Object.fromEntries(formData))
    
    // Get and process form data
    const assetTagInput = formData.get('assetTag') as string
    const nameInput = formData.get('name') as string
    const categoryInput = formData.get('category') as string
    
    // Validate required fields
    if (!nameInput || nameInput.trim() === '') {
      throw new Error('Asset name is required')
    }
    
    if (!categoryInput || categoryInput.trim() === '') {
      throw new Error('Asset category is required')
    }
    
    const data = {
      assetTag: assetTagInput && assetTagInput.trim() !== '' 
        ? assetTagInput.trim() 
        : generateAssetTag(),
      name: nameInput.trim(),
      category: categoryInput,
      subcategory: (formData.get('subcategory') as string)?.trim() || undefined,
      serialNumber: (formData.get('serialNumber') as string)?.trim() || undefined,
      model: (formData.get('model') as string)?.trim() || undefined,
      manufacturer: (formData.get('manufacturer') as string)?.trim() || undefined,
      status: (formData.get('status') as string) || 'available',
      condition: (formData.get('condition') as string) || 'good',
      
      // Location fields - structured
      building: (formData.get('building') as string)?.trim() || undefined,
      floor: (formData.get('floor') as string)?.trim() || undefined,
      room: (formData.get('room') as string)?.trim() || undefined,
      desk: (formData.get('desk') as string)?.trim() || undefined,
      locationNotes: (formData.get('locationNotes') as string)?.trim() || undefined,
      
      // Financial fields
      purchasePrice: (() => {
        const price = formData.get('purchasePrice') as string
        return price && price.trim() !== '' ? price.trim() : undefined
      })(),
      currentValue: undefined, // Not in form yet
      
      // Metadata
      description: (formData.get('description') as string)?.trim() || undefined,
      notes: (formData.get('notes') as string)?.trim() || undefined,
    }

    console.log('Processed data:', data)
    
    // Validate the data
    const validatedData = createAssetSchema.parse(data)
    console.log('Validated data:', validatedData)

    // Use enhanced database utilities
    const result = await dbUtils.create(
      () => db.insert(assets).values(validatedData).returning(),
      'Asset'
    )
    
    console.log('Insert result:', result)

    revalidatePath('/dashboard/assets')
  } catch (error) {
    console.error('Failed to create asset:', error)
    
    // Handle specific database errors
    if (error instanceof DuplicateError) {
      throw new Error('Asset tag or serial number already exists')
    }
    
    if (error instanceof DatabaseError) {
      throw new Error(formatConstraintError(error))
    }
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      if (error.name === 'ZodError') {
        console.error('Validation errors:', JSON.stringify(error, null, 2))
      }
    }
    
    throw new Error(`Failed to create asset: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  redirect('/dashboard/assets')
}

export async function updateAsset(id: number, formData: FormData) {
  try {
    // Check permissions - only admin and above can update assets
    await requireRole('admin')
    
    console.log('Updating asset ID:', id)
    console.log('Form data received:', Object.fromEntries(formData))
    
    const data = {
      assetTag: (formData.get('assetTag') as string)?.trim() || undefined,
      name: (formData.get('name') as string)?.trim(),
      category: formData.get('category') as string,
      subcategory: (formData.get('subcategory') as string)?.trim() || undefined,
      serialNumber: (formData.get('serialNumber') as string)?.trim() || undefined,
      model: (formData.get('model') as string)?.trim() || undefined,
      manufacturer: (formData.get('manufacturer') as string)?.trim() || undefined,
      status: formData.get('status') as string,
      condition: formData.get('condition') as string,
      
      // Location fields - structured
      building: (formData.get('building') as string)?.trim() || undefined,
      floor: (formData.get('floor') as string)?.trim() || undefined,
      room: (formData.get('room') as string)?.trim() || undefined,
      desk: (formData.get('desk') as string)?.trim() || undefined,
      locationNotes: (formData.get('locationNotes') as string)?.trim() || undefined,
      
      // Financial fields
      purchasePrice: (() => {
        const price = formData.get('purchasePrice') as string
        return price && price.trim() !== '' ? price.trim() : undefined
      })(),
      currentValue: (() => {
        const value = formData.get('currentValue') as string
        return value && value.trim() !== '' ? value.trim() : undefined
      })(),
      
      // Metadata
      description: (formData.get('description') as string)?.trim() || undefined,
      notes: (formData.get('notes') as string)?.trim() || undefined,
    }

    console.log('Processed data:', data)

    // Validate required fields
    if (!data.name || data.name.trim() === '') {
      throw new Error('Asset name is required')
    }

    const validatedData = updateAssetSchema.parse({ ...data, id })
    console.log('Validated data:', validatedData)

    // Remove id from update data (it's used for validation only)
    const { id: _, ...updateData } = validatedData

    // Use enhanced database utilities
    const result = await dbUtils.update(
      () => db.update(assets).set({ ...updateData, updatedAt: new Date() }).where(eq(assets.id, id)).returning(),
      'Asset',
      id
    )
    
    console.log('Update result:', result)

    revalidatePath('/dashboard/assets')
    revalidatePath(`/dashboard/assets/${id}`)
  } catch (error) {
    console.error('Failed to update asset:', error)
    
    if (error instanceof NotFoundError) {
      throw new Error(`Asset with ID ${id} not found`)
    }
    
    if (error instanceof DuplicateError) {
      throw new Error('Asset tag or serial number already exists')
    }
    
    if (error instanceof DatabaseError) {
      throw new Error(formatConstraintError(error))
    }
    
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      if (error.name === 'ZodError') {
        console.error('Validation errors:', JSON.stringify(error, null, 2))
      }
    }
    
    throw new Error(`Failed to update asset: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  // Redirect to asset detail page after successful update
  redirect(`/dashboard/assets/${id}`)
}

export async function deleteAsset(id: number) {
  try {
    // Check permissions - only admin and above can delete assets
    await requireRole('admin')
    
    // Use enhanced database utilities with soft delete
    await dbUtils.update(
      () => db.update(assets).set({ isDeleted: true, updatedAt: new Date() }).where(eq(assets.id, id)).returning(),
      'Asset',
      id
    )

    revalidatePath('/dashboard/assets')
  } catch (error) {
    console.error('Failed to delete asset:', error)
    
    if (error instanceof NotFoundError) {
      throw new Error(`Asset with ID ${id} not found`)
    }
    
    throw new Error('Failed to delete asset')
  }
  
  redirect('/dashboard/assets')
}

export async function getAssets() {
  try {
    // Use enhanced database utilities
    return await dbUtils.findMany(
      () => db.select().from(assets).where(eq(assets.isDeleted, false)),
      'Failed to fetch assets'
    )
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return []
  }
}

export async function getAssetById(id: number) {
  try {
    // Use enhanced database utilities
    return await dbUtils.findOne(
      () => db.select().from(assets).where(eq(assets.id, id)),
      'Asset',
      id
    )
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null
    }
    console.error('Failed to fetch asset:', error)
    return null
  }
}

// Example: Get assets with pagination
export async function getAssetsPaginated(page: number = 1, limit: number = 20) {
  try {
    return await dbUtils.paginate(
      (limit, offset) => db.select().from(assets)
        .where(eq(assets.isDeleted, false))
        .limit(limit)
        .offset(offset),
      () => db.select({ count: count() }).from(assets).where(eq(assets.isDeleted, false)),
      page,
      limit
    )
  } catch (error) {
    console.error('Failed to fetch paginated assets:', error)
    return {
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false
      }
    }
  }
} 