import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assets, user, assetAssignments } from '@/lib/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { AssignmentForm } from '@/components/forms/assignment-form'
import { createAssignment } from '@/actions/assignments'

interface NewAssignmentPageProps {
  searchParams: Promise<{ assetId?: string }>
}

export default async function NewAssignmentPage({ searchParams }: NewAssignmentPageProps) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user has permission to create assignments
  const userRole = session.user.role
  if (!['super_admin', 'admin', 'manager'].includes(userRole)) {
    redirect('/dashboard')
  }

  // Get assetId from URL parameters
  const params = await searchParams
  const assetIdFromUrl = params.assetId ? parseInt(params.assetId) : null

  // If assetId is provided, fetch that specific asset
  let preSelectedAsset = null
  let assetError = null
  if (assetIdFromUrl && !isNaN(assetIdFromUrl)) {
    preSelectedAsset = await db.query.assets.findFirst({
      where: and(
        eq(assets.id, assetIdFromUrl),
        eq(assets.isDeleted, false),
        eq(assets.status, 'available')
      ),
      columns: {
        id: true,
        assetTag: true,
        name: true,
        category: true,
        status: true,
        condition: true,
        manufacturer: true,
        model: true,
      },
    })
    
    // If assetId was provided but asset not found or not available
    if (!preSelectedAsset) {
      const assetExists = await db.query.assets.findFirst({
        where: eq(assets.id, assetIdFromUrl),
        columns: { id: true, status: true, isDeleted: true }
      })
      
      if (!assetExists) {
        assetError = `Asset with ID ${assetIdFromUrl} not found.`
      } else if (assetExists.isDeleted) {
        assetError = `Asset with ID ${assetIdFromUrl} has been deleted.`
      } else if (assetExists.status !== 'available') {
        assetError = `Asset with ID ${assetIdFromUrl} is not available for assignment (status: ${assetExists.status}).`
      }
    }
  }

  // Fetch available assets (not assigned or available status)
  const availableAssets = await db.query.assets.findMany({
    where: and(
      eq(assets.isDeleted, false),
      eq(assets.status, 'available')
    ),
    columns: {
      id: true,
      assetTag: true,
      name: true,
      category: true,
      status: true,
      condition: true,
      manufacturer: true,
      model: true,
    },
    orderBy: assets.assetTag,
  })

  // Fetch active users
  const availableUsers = await db.query.user.findMany({
    where: eq(user.isActive, true),
    columns: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
      isActive: true,
    },
    orderBy: user.name,
  })

  // Filter out null values to match expected types
  const filteredAssets = availableAssets.filter(asset => 
    asset.name && asset.manufacturer !== null
  ) as any[]

  const filteredUsers = availableUsers.filter(user => 
    user.name !== null
  ) as any[]

  // Prepare initial data if asset is pre-selected
  const initialData = preSelectedAsset ? {
    assetId: preSelectedAsset.id,
  } : undefined

  /**
   * Handles assignment creation with server-side validation
   */
  const handleCreateAssignment = async (data: any) => {
    'use server'
    
    try {
      await createAssignment({
        ...data,
        assignedBy: session.user.id,
      })
    } catch (error) {
      console.error('Assignment creation error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to create assignment')
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assign Asset</h1>
          <p className="text-muted-foreground">
            Assign an asset to a user with purpose and return date
          </p>
        </div>
      </div>

      {assetError && (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h4 className="font-medium text-red-800 mb-2">Asset Error</h4>
          <p className="text-sm text-red-700">{assetError}</p>
          <p className="text-sm text-red-600 mt-2">
            You can still proceed to assign a different asset using the search below.
          </p>
        </div>
      )}

      <AssignmentForm
        onSubmit={handleCreateAssignment}
        mode="create"
        availableAssets={filteredAssets}
        availableUsers={filteredUsers}
        initialData={initialData}
        preSelectedAsset={preSelectedAsset ? {
          ...preSelectedAsset,
          manufacturer: preSelectedAsset.manufacturer || undefined,
          model: preSelectedAsset.model || undefined,
        } : null}
      />
    </div>
  )
} 