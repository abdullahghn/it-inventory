import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { assets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { AssetForm } from '@/components/forms/asset-form'
import { notFound } from 'next/navigation'

interface EditAssetPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditAssetPage({ params }: EditAssetPageProps) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user has permission to edit assets
  const userRole = session.user.role
  if (!['super_admin', 'admin', 'manager'].includes(userRole)) {
    redirect('/dashboard')
  }

  // Fetch the asset data
  const resolvedParams = await params
  const assetId = parseInt(resolvedParams.id)
  if (isNaN(assetId)) {
    notFound()
  }

  const asset = await db.query.assets.findFirst({
    where: eq(assets.id, assetId),
  })

  if (!asset) {
    notFound()
  }

  // Check if user can edit this asset (admin/super_admin can edit all, manager can edit their department)
  if (userRole === 'manager') {
    // TODO: Add department-based permission check
    // For now, allow managers to edit all assets
  }

  // Prepare initial data for the form
  const initialData = {
    id: assetId,
    assetTag: asset.assetTag,
    name: asset.name,
    category: asset.category,
    subcategory: asset.subcategory || '',
    serialNumber: asset.serialNumber || '',
    model: asset.model || '',
    manufacturer: asset.manufacturer || '',
    status: asset.status,
    condition: asset.condition,
    purchaseDate: asset.purchaseDate,
    purchasePrice: asset.purchasePrice?.toString() || '',
    currentValue: asset.currentValue?.toString() || '',
    depreciationRate: asset.depreciationRate?.toString() || '',
    warrantyExpiry: asset.warrantyExpiry,
    building: asset.building || '',
    floor: asset.floor || '',
    room: asset.room || '',
    desk: asset.desk || '',
    locationNotes: asset.locationNotes || '',
    description: asset.description || '',
    notes: asset.notes || '',
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Asset</h1>
          <p className="text-muted-foreground">
            Update asset information and details
          </p>
        </div>
      </div>

      <AssetForm
        initialData={initialData}
        mode="edit"
      />
    </div>
  )
} 