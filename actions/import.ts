'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { assets, user, assetAssignments } from '@/lib/db/schema'
import { 
  bulkImportSchema, 
  assetImportRowSchema, 
  userImportRowSchema, 
  assignmentImportRowSchema,
  importResultSchema 
} from '@/lib/validations'
import { eq, and } from 'drizzle-orm'
import { auth } from '@/lib/auth'

/**
 * Processes bulk import with file parsing and validation
 */
export async function processBulkImport(data: any, userId: string) {
  try {
    // Validate import configuration
    const validatedData = bulkImportSchema.parse(data)
    
    // Get current user for audit trail
    const session = await auth()
    if (!session?.user) {
      throw new Error('Unauthorized')
    }

    // Parse file content
    const fileContent = await validatedData.file.text()
    const lines = fileContent.split('\n').filter(line => line.trim())
    
    // Skip header if specified
    const dataLines = validatedData.hasHeaders ? lines.slice(1) : lines
    const totalRows = dataLines.length

    if (totalRows === 0) {
      throw new Error('No data rows found in file')
    }

    // Initialize result tracking
    const result = {
      success: true,
      totalRows,
      processedRows: 0,
      successRows: 0,
      errorRows: 0,
      errors: [] as any[],
      warnings: [] as any[],
    }

    // Process based on entity type
    switch (validatedData.entityType) {
      case 'assets':
        await processAssetImport(dataLines, validatedData, result, session.user.id)
        break
      case 'users':
        await processUserImport(dataLines, validatedData, result, session.user.id)
        break
      case 'assignments':
        await processAssignmentImport(dataLines, validatedData, result, session.user.id)
        break
      default:
        throw new Error('Unsupported entity type')
    }

    // Validate final result
    const validatedResult = importResultSchema.parse(result)

    // Log audit trail
    await logAuditTrail({
      action: 'create',
      entityType: 'bulk_import',
      entityId: `import_${Date.now()}`,
      userId: session.user.id,
      userEmail: session.user.email,
      newValues: {
        entityType: validatedData.entityType,
        totalRows: result.totalRows,
        successRows: result.successRows,
        errorRows: result.errorRows,
      },
      description: `Bulk import of ${validatedData.entityType}: ${result.successRows} successful, ${result.errorRows} errors`,
    })

    // Revalidate cache
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/${validatedData.entityType}`)

    return validatedResult
  } catch (error) {
    console.error('Bulk import error:', error)
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Failed to process import')
  }
}

/**
 * Processes asset import with validation and database insertion
 */
async function processAssetImport(
  lines: string[], 
  config: any, 
  result: any, 
  createdBy: string
) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      result.processedRows++
      
      // Parse CSV line
      const values = parseCSVLine(line, config.delimiter)
      
      // Map values to schema fields
      const rowData = {
        assetTag: values[0]?.trim(),
        name: values[1]?.trim(),
        category: values[2]?.trim(),
        subcategory: values[3]?.trim() || null,
        serialNumber: values[4]?.trim() || null,
        model: values[5]?.trim() || null,
        manufacturer: values[6]?.trim() || null,
        status: values[7]?.trim() || 'available',
        condition: values[8]?.trim() || 'good',
        purchaseDate: values[9]?.trim() || null,
        purchasePrice: values[10]?.trim() || null,
        warrantyExpiry: values[11]?.trim() || null,
        building: values[12]?.trim() || null,
        floor: values[13]?.trim() || null,
        room: values[14]?.trim() || null,
        desk: values[15]?.trim() || null,
        description: values[16]?.trim() || null,
        notes: values[17]?.trim() || null,
      }

      // Validate row data
      const validatedRow = assetImportRowSchema.parse(rowData)

      // Check for duplicate asset tag
      const existingAsset = await db.query.assets.findFirst({
        where: eq(assets.assetTag, validatedRow.assetTag),
      })

      if (existingAsset) {
        if (config.updateExisting) {
          // Update existing asset
          await db
            .update(assets)
            .set({
              name: validatedRow.name,
              category: validatedRow.category,
              subcategory: validatedRow.subcategory,
              serialNumber: validatedRow.serialNumber,
              model: validatedRow.model,
              manufacturer: validatedRow.manufacturer,
              status: validatedRow.status,
              condition: validatedRow.condition,
              purchaseDate: validatedRow.purchaseDate ? new Date(validatedRow.purchaseDate) : null,
              purchasePrice: validatedRow.purchasePrice ? validatedRow.purchasePrice.toString() : null,
              warrantyExpiry: validatedRow.warrantyExpiry ? new Date(validatedRow.warrantyExpiry) : null,
              building: validatedRow.building,
              floor: validatedRow.floor,
              room: validatedRow.room,
              desk: validatedRow.desk,
              description: validatedRow.description,
              notes: validatedRow.notes,
              updatedAt: new Date(),
            })
            .where(eq(assets.id, existingAsset.id))
        } else {
          throw new Error('Asset tag already exists')
        }
      } else {
        // Create new asset
        await db.insert(assets).values({
          assetTag: validatedRow.assetTag,
          name: validatedRow.name,
          category: validatedRow.category,
          subcategory: validatedRow.subcategory,
          serialNumber: validatedRow.serialNumber,
          model: validatedRow.model,
          manufacturer: validatedRow.manufacturer,
          status: validatedRow.status,
          condition: validatedRow.condition,
          purchaseDate: validatedRow.purchaseDate ? new Date(validatedRow.purchaseDate) : null,
          purchasePrice: validatedRow.purchasePrice ? validatedRow.purchasePrice.toString() : null,
          warrantyExpiry: validatedRow.warrantyExpiry ? new Date(validatedRow.warrantyExpiry) : null,
          building: validatedRow.building,
          floor: validatedRow.floor,
          room: validatedRow.room,
          desk: validatedRow.desk,
          description: validatedRow.description,
          notes: validatedRow.notes,
          createdBy,
        })
      }

      result.successRows++
    } catch (error) {
      result.errorRows++
      result.errors.push({
        row: i + 1,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: lines[i],
      })

      if (!config.skipErrors) {
        throw error
      }
    }
  }
}

/**
 * Processes user import with validation and database insertion
 */
async function processUserImport(
  lines: string[], 
  config: any, 
  result: any, 
  createdBy: string
) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      result.processedRows++
      
      // Parse CSV line
      const values = parseCSVLine(line, config.delimiter)
      
      // Map values to schema fields
      const rowData = {
        name: values[0]?.trim(),
        email: values[1]?.trim(),
        department: values[2]?.trim() || null,
        jobTitle: values[3]?.trim() || null,
        employeeId: values[4]?.trim() || null,
        phone: values[5]?.trim() || null,
        role: values[6]?.trim() || 'user',
        isActive: values[7]?.trim() === 'true',
      }

      // Validate row data
      const validatedRow = userImportRowSchema.parse(rowData)

      // Check for duplicate email
      const existingUser = await db.query.user.findFirst({
        where: eq(user.email, validatedRow.email.toLowerCase()),
      })

      if (existingUser) {
        if (config.updateExisting) {
          // Update existing user
          await db
            .update(user)
            .set({
              name: validatedRow.name,
              department: validatedRow.department,
              jobTitle: validatedRow.jobTitle,
              employeeId: validatedRow.employeeId,
              phone: validatedRow.phone,
              role: validatedRow.role,
              isActive: validatedRow.isActive,
              updatedAt: new Date(),
            })
            .where(eq(user.id, existingUser.id))
        } else {
          throw new Error('Email already exists')
        }
      } else {
        // Create new user
        await db.insert(user).values({
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique ID
          ...validatedRow,
          email: validatedRow.email.toLowerCase(),
        })
      }

      result.successRows++
    } catch (error) {
      result.errorRows++
      result.errors.push({
        row: i + 1,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: lines[i],
      })

      if (!config.skipErrors) {
        throw error
      }
    }
  }
}

/**
 * Processes assignment import with validation and database insertion
 */
async function processAssignmentImport(
  lines: string[], 
  config: any, 
  result: any, 
  createdBy: string
) {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    try {
      result.processedRows++
      
      // Parse CSV line
      const values = parseCSVLine(line, config.delimiter)
      
      // Map values to schema fields
      const rowData = {
        assetTag: values[0]?.trim(),
        userEmail: values[1]?.trim(),
        purpose: values[2]?.trim() || null,
        expectedReturnAt: values[3]?.trim() || null,
        notes: values[4]?.trim() || null,
      }

      // Validate row data
      const validatedRow = assignmentImportRowSchema.parse(rowData)

      // Find asset by tag
      const asset = await db.query.assets.findFirst({
        where: eq(assets.assetTag, validatedRow.assetTag),
      })

      if (!asset) {
        throw new Error(`Asset with tag ${validatedRow.assetTag} not found`)
      }

      // Find user by email
      const assignedUser = await db.query.user.findFirst({
        where: eq(user.email, validatedRow.userEmail.toLowerCase()),
      })

      if (!assignedUser) {
        throw new Error(`User with email ${validatedRow.userEmail} not found`)
      }

      // Check if asset is available
      if (asset.status !== 'available') {
        throw new Error(`Asset ${validatedRow.assetTag} is not available`)
      }

      // Create assignment
      await db.insert(assetAssignments).values({
        assetId: asset.id,
        userId: assignedUser.id,
        purpose: validatedRow.purpose,
        expectedReturnAt: validatedRow.expectedReturnAt ? new Date(validatedRow.expectedReturnAt) : null,
        notes: validatedRow.notes,
        assignedBy: createdBy,
        status: 'active' as const,
        isActive: true,
      })

      // Update asset status
      await db
        .update(assets)
        .set({ 
          status: 'assigned',
          updatedAt: new Date() 
        })
        .where(eq(assets.id, asset.id))

      result.successRows++
    } catch (error) {
      result.errorRows++
      result.errors.push({
        row: i + 1,
        message: error instanceof Error ? error.message : 'Unknown error',
        data: lines[i],
      })

      if (!config.skipErrors) {
        throw error
      }
    }
  }
}

/**
 * Helper function to parse CSV line with proper delimiter handling
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  values.push(current.trim())
  return values
}

/**
 * Helper function to log audit trail
 */
async function logAuditTrail(data: {
  action: string
  entityType: string
  entityId: string
  userId: string
  userEmail?: string
  oldValues?: any
  newValues?: any
  changedFields?: string[]
  description: string
}) {
  try {
    // Import audit logs table
    const { auditLogs } = await import('@/lib/db/schema')
    
    await db.insert(auditLogs).values({
      action: data.action as any,
      entityType: data.entityType,
      entityId: data.entityId,
      userId: data.userId,
      userEmail: data.userEmail,
      oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
      newValues: data.newValues ? JSON.stringify(data.newValues) : null,
      changedFields: data.changedFields ? JSON.stringify(data.changedFields) : null,
      description: data.description,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error('Audit logging error:', error)
    // Don't throw error for audit logging failures
  }
} 