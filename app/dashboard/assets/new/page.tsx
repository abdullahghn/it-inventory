import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AssetForm } from '@/components/forms/asset-form'

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
        mode="create"
      />
    </div>
  )
} 