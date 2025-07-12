import { NextRequest, NextResponse } from 'next/server'
import { auth, getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { assets, user, assetAssignments } from '@/lib/db/schema'
import { createAssetSchema, createUserSchema, createAssignmentSchema } from '@/lib/validations'
import { z } from 'zod'

// Import validation schemas
const importRequestSchema = z.object({
  importType: z.enum(['assets', 'users', 'assignments']),
  hasHeaders: z.boolean(),
  skipErrors: z.boolean(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    const currentUser = await getCurrentUser()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - admins+ can import data
    const userRole = currentUser?.role || session.user.role || 'user'
    const canImportData = userRole === 'admin' || userRole === 'super_admin'
    
    if (!canImportData) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const importType = formData.get('importType') as string
    const hasHeaders = formData.get('hasHeaders') === 'true'
    const skipErrors = formData.get('skipErrors') === 'true'
    const notes = formData.get('notes') as string

    // Validate request
    const validatedData = importRequestSchema.parse({
      importType,
      hasHeaders,
      skipErrors,
      notes,
    })

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Read and parse file
    const fileContent = await file.text()
    const lines = fileContent.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 })
    }

    // Remove headers if specified
    const dataLines = hasHeaders ? lines.slice(1) : lines
    const totalRows = dataLines.length

    let importedRows = 0
    let failedRows = 0
    const errors: string[] = []

    // Process based on import type
    switch (validatedData.importType) {
      case 'assets':
        for (let i = 0; i < dataLines.length; i++) {
          try {
            const row = dataLines[i]
            const columns = row.split(',').map(col => col.trim())
            
            // Map CSV columns to asset fields
            const assetData = {
              assetTag: columns[0] || '',
              name: columns[1] || '',
              category: columns[2] || 'other',
              subcategory: columns[3] || null,
              serialNumber: columns[4] || null,
              model: columns[5] || null,
              manufacturer: columns[6] || null,
              purchaseDate: columns[7] ? new Date(columns[7]) : null,
              purchasePrice: columns[8] || null,
              currentValue: columns[9] || null,
              status: columns[10] || 'available',
              condition: columns[11] || 'good',
              building: columns[12] || null,
              floor: columns[13] || null,
              room: columns[14] || null,
              desk: columns[15] || null,
              description: columns[16] || null,
              notes: columns[17] || null,
            }

            // Validate asset data
            const validatedAsset = createAssetSchema.parse(assetData)
            
            // Insert asset
            await db.insert(assets).values(validatedAsset)
            importedRows++
          } catch (error: any) {
            failedRows++
            errors.push(`Row ${i + 1}: ${error.message}`)
            if (!skipErrors) break
          }
        }
        break

      case 'users':
        for (let i = 0; i < dataLines.length; i++) {
          try {
            const row = dataLines[i]
            const columns = row.split(',').map(col => col.trim())
            
            // Map CSV columns to user fields
            const userData = {
              id: `import-${Date.now()}-${i}`, // Generate unique ID for import
              name: columns[0] || '',
              email: columns[1] || '',
              department: columns[2] || null,
              jobTitle: columns[3] || null,
              employeeId: columns[4] || null,
              phone: columns[5] || null,
              role: (columns[6] as any) || 'user',
              isActive: columns[7] === 'true',
            }

            // Validate user data (without id for validation)
            const { id, ...userDataForValidation } = userData
            const validatedUser = createUserSchema.parse(userDataForValidation)
            
            // Insert user with generated id
            await db.insert(user).values(userData)
            importedRows++
          } catch (error: any) {
            failedRows++
            errors.push(`Row ${i + 1}: ${error.message}`)
            if (!skipErrors) break
          }
        }
        break

      case 'assignments':
        for (let i = 0; i < dataLines.length; i++) {
          try {
            const row = dataLines[i]
            const columns = row.split(',').map(col => col.trim())
            
            // Map CSV columns to assignment fields
            const assignmentData = {
              assetId: parseInt(columns[0]) || 0,
              userId: columns[1] || '',
              purpose: columns[2] || null,
              expectedReturnAt: columns[3] ? new Date(columns[3]) : null,
              notes: columns[4] || null,
            }

            // Validate assignment data
            const validatedAssignment = createAssignmentSchema.parse(assignmentData)
            
            // Insert assignment
            await db.insert(assetAssignments).values(validatedAssignment)
            importedRows++
          } catch (error: any) {
            failedRows++
            errors.push(`Row ${i + 1}: ${error.message}`)
            if (!skipErrors) break
          }
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid import type' }, { status: 400 })
    }

    const success = failedRows === 0 || (skipErrors && importedRows > 0)

    return NextResponse.json({
      success,
      message: `Import completed. ${importedRows} records imported, ${failedRows} failed.`,
      totalRows,
      importedRows,
      failedRows,
      errors: errors.slice(0, 10), // Limit error messages
    })

  } catch (error: any) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error.message || 'Import failed' },
      { status: 500 }
    )
  }
} 