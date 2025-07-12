import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AssetForm } from '@/components/forms/asset-form'
import { createAsset } from '@/actions/assets'

export default async function NewAssetPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user has permission to create assets
  const userRole = session.user.role
  if (!['super_admin', 'admin', 'manager'].includes(userRole)) {
    redirect('/dashboard')
  }

  /**
   * Handles asset creation with server-side validation
   */
  const handleCreateAsset = async (data: any) => {
    'use server'
    
    try {
      // Convert string values to appropriate types for database
      const assetData = {
        ...data,
        purchasePrice: data.purchasePrice ? parseFloat(data.purchasePrice) : null,
        currentValue: data.currentValue ? parseFloat(data.currentValue) : null,
        depreciationRate: data.depreciationRate ? parseFloat(data.depreciationRate) : null,
        createdBy: session.user.id,
      }

      await createAsset(assetData)
    } catch (error) {
      console.error('Asset creation error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to create asset')
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Asset</h1>
          <p className="text-muted-foreground">
            Add a new asset to the inventory system with complete details
          </p>
        </div>
      </div>

      <AssetForm
        onSubmit={handleCreateAsset}
        mode="create"
      />
    </div>
  )
} 