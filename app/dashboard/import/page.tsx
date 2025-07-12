import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { BulkImportForm } from '@/components/forms/bulk-import-form'
import { processBulkImport } from '@/actions/import'

export default async function ImportPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user has permission to perform bulk imports
  const userRole = session.user.role
  if (!['super_admin', 'admin'].includes(userRole)) {
    redirect('/dashboard')
  }

  /**
   * Handles bulk import processing with file parsing and validation
   */
  const handleBulkImport = async (data: any) => {
    'use server'
    
    try {
      const result = await processBulkImport(data, session.user.id)
      return result
    } catch (error) {
      console.error('Bulk import error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to process import')
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bulk Import</h1>
          <p className="text-muted-foreground">
            Import multiple records from CSV or Excel files
          </p>
        </div>
      </div>

      <BulkImportForm
        onSubmit={handleBulkImport}
      />
    </div>
  )
} 