import Link from 'next/link'
import { db } from '@/lib/db'
import { assets, assetAssignments, user } from '@/lib/db/schema'
import { hasRole, auth, getCurrentUser } from '@/lib/auth'
import { eq, and } from 'drizzle-orm'
import { AssetsClient } from './components/AssetsClient'

export default async function AssetsPage() {
  // Get current user and check permissions
  const session = await auth()
  const currentUser = await getCurrentUser()
  
  if (!session?.user) {
    return <div>Access denied</div>
  }

  // Check permissions - fall back to session role if currentUser is null
  const userRole = currentUser?.role || session.user.role || 'user'
  const canCreateAssets = await hasRole('admin')
  const canAssignAssets = await hasRole('manager') 
  const canViewAllAssets = await hasRole('manager') || userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin'

  // Fetch assets based on user role
  let assetList: any[] = []
  
  try {
    if (canViewAllAssets) {
      // Managers+ can see all assets
      assetList = await db
        .select({
          id: assets.id,
          assetTag: assets.assetTag,
          name: assets.name,
          category: assets.category,
          subcategory: assets.subcategory,
          status: assets.status,
          condition: assets.condition,
          serialNumber: assets.serialNumber,
          model: assets.model,
          manufacturer: assets.manufacturer,
          specifications: assets.specifications,
          purchaseDate: assets.purchaseDate,
          purchasePrice: assets.purchasePrice,
          currentValue: assets.currentValue,
          depreciationRate: assets.depreciationRate,
          warrantyExpiry: assets.warrantyExpiry,
          building: assets.building,
          floor: assets.floor,
          room: assets.room,
          desk: assets.desk,
          locationNotes: assets.locationNotes,
          description: assets.description,
          notes: assets.notes,
          isDeleted: assets.isDeleted,
          createdBy: assets.createdBy,
          createdAt: assets.createdAt,
          updatedAt: assets.updatedAt,
        })
        .from(assets)
        .where(eq(assets.isDeleted, false))
    } else {
      // Users can only see assets assigned to them
      assetList = await db
        .select({
          id: assets.id,
          assetTag: assets.assetTag,
          name: assets.name,
          category: assets.category,
          subcategory: assets.subcategory,
          status: assets.status,
          condition: assets.condition,
          serialNumber: assets.serialNumber,
          model: assets.model,
          manufacturer: assets.manufacturer,
          specifications: assets.specifications,
          purchaseDate: assets.purchaseDate,
          purchasePrice: assets.purchasePrice,
          currentValue: assets.currentValue,
          depreciationRate: assets.depreciationRate,
          warrantyExpiry: assets.warrantyExpiry,
          building: assets.building,
          floor: assets.floor,
          room: assets.room,
          desk: assets.desk,
          locationNotes: assets.locationNotes,
          description: assets.description,
          notes: assets.notes,
          isDeleted: assets.isDeleted,
          createdBy: assets.createdBy,
          createdAt: assets.createdAt,
          updatedAt: assets.updatedAt,
        })
        .from(assets)
        .innerJoin(assetAssignments, eq(assets.id, assetAssignments.assetId))
        .where(
          and(
            eq(assetAssignments.userId, currentUser?.id || session.user.id),
            eq(assets.isDeleted, false),
            eq(assetAssignments.isActive, true)
          )
        )
    }
  } catch (error) {
    console.error('Database error:', error)
    assetList = []
  }

  return (
    <AssetsClient 
      initialAssets={assetList}
      canCreateAssets={canCreateAssets}
      canAssignAssets={canAssignAssets}
      canViewAllAssets={canViewAllAssets}
    />
  )
} 