'use server'

import { db } from '@/lib/db'
import { maintenanceRecords, assets } from '@/lib/db/schema'
import { createMaintenanceSchema } from '@/lib/validations'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'

export async function createMaintenance(formData: FormData) {
  try {
    // Helper function to convert empty strings and null to undefined
    const processStringField = (value: string | null): string | undefined => {
      if (!value || value.trim() === '') return undefined
      return value.trim()
    }
    
    // Helper function for required string fields
    const processRequiredStringField = (value: string | null, fieldName: string): string => {
      if (!value || value.trim() === '') {
        throw new Error(`${fieldName} is required`)
      }
      return value.trim()
    }
    
    const rawData = {
      assetId: parseInt(formData.get('assetId') as string),
      type: formData.get('type') as string,
      title: processRequiredStringField(formData.get('title') as string, 'Title'),
      description: processRequiredStringField(formData.get('description') as string, 'Description'),
      priority: (formData.get('priority') as string) || 'medium',
      performedBy: processStringField(formData.get('performedBy') as string),
      nextScheduledAt: formData.get('nextScheduledAt') ? new Date(formData.get('nextScheduledAt') as string) : undefined,
    }

    console.log('Raw maintenance data before validation:', rawData)

    // Validate the data
    const validatedData = createMaintenanceSchema.parse(rawData)
    
    console.log('Validated maintenance data:', validatedData)

    // Insert the maintenance record with proper field mapping
    await db.insert(maintenanceRecords).values({
      assetId: validatedData.assetId,
      type: validatedData.type,
      title: validatedData.title,
      description: validatedData.description,
      priority: validatedData.priority,
      performedBy: validatedData.performedBy,
      nextScheduledAt: validatedData.nextScheduledAt,
      completedAt: new Date(),
      isCompleted: true,
    })

    console.log('Maintenance record created successfully')
  } catch (error) {
    console.error('Error creating maintenance record:', error)
    throw error
  }

  redirect('/dashboard/maintenance')
}

export async function updateMaintenance(formData: FormData) {
  try {
    const id = parseInt(formData.get('id') as string)
    
    // Helper function to convert empty strings and null to undefined
    const processStringField = (value: string | null): string | undefined => {
      if (!value || value.trim() === '') return undefined
      return value.trim()
    }
    
    // Helper function for required string fields
    const processRequiredStringField = (value: string | null, fieldName: string): string => {
      if (!value || value.trim() === '') {
        throw new Error(`${fieldName} is required`)
      }
      return value.trim()
    }
    
    const rawData = {
      assetId: parseInt(formData.get('assetId') as string),
      type: formData.get('type') as string,
      title: processRequiredStringField(formData.get('title') as string, 'Title'),
      description: processRequiredStringField(formData.get('description') as string, 'Description'),
      priority: (formData.get('priority') as string) || 'medium',
      performedBy: processStringField(formData.get('performedBy') as string),
      nextScheduledAt: formData.get('nextScheduledAt') ? new Date(formData.get('nextScheduledAt') as string) : undefined,
    }

    console.log('Raw maintenance data before validation:', rawData)
    
    // Validate the data
    const validatedData = createMaintenanceSchema.parse(rawData)
    
    console.log('Validated maintenance data:', validatedData)

    // Update the maintenance record with proper field mapping
    await db.update(maintenanceRecords)
      .set({
        assetId: validatedData.assetId,
        type: validatedData.type,
        title: validatedData.title,
        description: validatedData.description,
        priority: validatedData.priority,
        performedBy: validatedData.performedBy,
        nextScheduledAt: validatedData.nextScheduledAt,
        updatedAt: new Date()
      })
      .where(eq(maintenanceRecords.id, id))

    console.log('Maintenance record updated successfully')
  } catch (error) {
    console.error('Error updating maintenance record:', error)
    throw error
  }

  redirect('/dashboard/maintenance')
}

export async function getMaintenanceRecords() {
  try {
    return await db
      .select({
        id: maintenanceRecords.id,
        type: maintenanceRecords.type,
        title: maintenanceRecords.title,
        description: maintenanceRecords.description,
        priority: maintenanceRecords.priority,
        performedBy: maintenanceRecords.performedBy,
        completedAt: maintenanceRecords.completedAt,
        nextScheduledAt: maintenanceRecords.nextScheduledAt,
        isCompleted: maintenanceRecords.isCompleted,
        assetName: assets.name,
        assetCategory: assets.category,
        assetSerialNumber: assets.serialNumber,
      })
      .from(maintenanceRecords)
      .leftJoin(assets, eq(maintenanceRecords.assetId, assets.id))
      .orderBy(maintenanceRecords.completedAt)
  } catch (error) {
    console.error('Error fetching maintenance records:', error)
    return []
  }
}

export async function getMaintenanceRecord(id: number) {
  try {
    const result = await db
      .select({
        id: maintenanceRecords.id,
        type: maintenanceRecords.type,
        title: maintenanceRecords.title,
        description: maintenanceRecords.description,
        priority: maintenanceRecords.priority,
        performedBy: maintenanceRecords.performedBy,
        completedAt: maintenanceRecords.completedAt,
        nextScheduledAt: maintenanceRecords.nextScheduledAt,
        isCompleted: maintenanceRecords.isCompleted,
        assetId: assets.id,
        assetName: assets.name,
        assetCategory: assets.category,
        assetSerialNumber: assets.serialNumber,
      })
      .from(maintenanceRecords)
      .leftJoin(assets, eq(maintenanceRecords.assetId, assets.id))
      .where(eq(maintenanceRecords.id, id))

    return result[0] || null
  } catch (error) {
    console.error('Error fetching maintenance record:', error)
    return null
  }
} 