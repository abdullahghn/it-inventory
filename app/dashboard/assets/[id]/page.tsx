import Link from 'next/link'
import { db } from '@/lib/db'
import { assets, assetAssignments, user, maintenanceRecords } from '@/lib/db/schema'
import { eq, and, desc, isNull } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { auth, getCurrentUser, hasRole } from '@/lib/auth'
import DeleteAssetButton from '@/components/ui/DeleteAssetButton'
import AssetAssignmentHistory from '@/components/dashboard/AssetAssignmentHistory'
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  UserPlus, 
  Calendar, 
  MapPin, 
  DollarSign,
  Shield,
  Wrench,
  FileText,
  History,
  Settings,
  AlertTriangle
} from 'lucide-react'

interface AssetDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { id } = await params
  const assetId = parseInt(id)

  // Get current user and check permissions
  const session = await auth()
  const currentUser = await getCurrentUser()
  
  if (!session?.user || !currentUser) {
    notFound()
  }

  // Check permissions
  const userRole = currentUser.role || session.user.role || 'user'
  const canViewAllAssets = userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin'
  const canAssignAssets = userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin'
  const canEditAssets = userRole === 'admin' || userRole === 'super_admin'
  const canDeleteAssets = userRole === 'admin' || userRole === 'super_admin'
  const canViewMaintenance = userRole === 'manager' || userRole === 'admin' || userRole === 'super_admin'

  // Fetch asset details with RBAC
  let assetData: any = null

  if (canViewAllAssets) {
    // Managers+ can view any asset
    const asset = await db.select().from(assets).where(eq(assets.id, assetId))
    assetData = asset[0]
  } else {
    // Users can only view assets assigned to them
    const asset = await db
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
          eq(assets.id, assetId),
          eq(assetAssignments.userId, currentUser.id),
          eq(assets.isDeleted, false),
          eq(assetAssignments.isActive, true)
        )
      )
      .limit(1)
    
    assetData = asset[0]
  }
  
  if (!assetData) {
    notFound()
  }

  // Fetch assignment history for this asset
  const assignmentHistory = await db
    .select({
      id: assetAssignments.id,
      userId: assetAssignments.userId,
      userName: user.name,
      userEmail: user.email,
      status: assetAssignments.status,
      assignedAt: assetAssignments.assignedAt,
      expectedReturnAt: assetAssignments.expectedReturnAt,
      returnedAt: assetAssignments.returnedAt,
      purpose: assetAssignments.purpose,
      notes: assetAssignments.notes,
      returnNotes: assetAssignments.returnNotes,
      assignedBy: assetAssignments.assignedBy,
      returnedBy: assetAssignments.returnedBy,
      actualReturnCondition: assetAssignments.actualReturnCondition,
    })
    .from(assetAssignments)
    .leftJoin(user, eq(assetAssignments.userId, user.id))
    .where(eq(assetAssignments.assetId, assetId))
    .orderBy(desc(assetAssignments.assignedAt))

  // Fetch maintenance records
  const maintenanceHistory = canViewMaintenance ? await db
    .select({
      id: maintenanceRecords.id,
      type: maintenanceRecords.type,
      title: maintenanceRecords.title,
      description: maintenanceRecords.description,
      priority: maintenanceRecords.priority,
      performedBy: maintenanceRecords.performedBy,
      scheduledAt: maintenanceRecords.scheduledAt,
      startedAt: maintenanceRecords.startedAt,
      completedAt: maintenanceRecords.completedAt,
      isCompleted: maintenanceRecords.isCompleted,
      conditionBefore: maintenanceRecords.conditionBefore,
      conditionAfter: maintenanceRecords.conditionAfter,
      createdAt: maintenanceRecords.createdAt,
    })
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.assetId, assetId))
    .orderBy(desc(maintenanceRecords.createdAt)) : []

  // Get current assignment
  const currentAssignment = assignmentHistory.find(a => !a.returnedAt)

  // Calculate warranty status
  const now = new Date()
  const warrantyExpiry = assetData.warrantyExpiry ? new Date(assetData.warrantyExpiry) : null
  const isWarrantyExpiring = warrantyExpiry && warrantyExpiry > now && warrantyExpiry <= new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  const isWarrantyExpired = warrantyExpiry && warrantyExpiry <= now

  // Calculate depreciation
  const purchaseDate = assetData.purchaseDate ? new Date(assetData.purchaseDate) : null
  const depreciationRate = assetData.depreciationRate ? parseFloat(assetData.depreciationRate.toString()) : 0
  const currentValue = assetData.currentValue ? parseFloat(assetData.currentValue.toString()) : 0
  const purchasePrice = assetData.purchasePrice ? parseFloat(assetData.purchasePrice.toString()) : 0

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard/assets"
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Assets
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{assetData.name}</h1>
              <p className="text-gray-600">Asset Tag: {assetData.assetTag}</p>
            </div>
          </div>
          <div className="flex space-x-3">
            {canEditAssets && (
              <Link
                href={`/dashboard/assets/${assetData.id}/edit`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            )}
            {canAssignAssets && assetData.status === 'available' && (
              <Link
                href={`/dashboard/assignments/new?assetId=${assetData.id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Assign
              </Link>
            )}
            {canDeleteAssets && assetData.status !== 'assigned' && (
              <DeleteAssetButton 
                assetId={assetData.id} 
                assetName={assetData.name} 
              />
            )}
          </div>
        </div>
      </div>

      {/* Status and Alerts */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            assetData.status === 'available' ? 'bg-green-100 text-green-800' :
            assetData.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
            assetData.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {assetData.status.charAt(0).toUpperCase() + assetData.status.slice(1)}
          </span>
          
          {isWarrantyExpiring && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Warranty Expiring Soon
            </span>
          )}
          
          {isWarrantyExpired && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Warranty Expired
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Asset Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <p className="text-lg font-medium text-gray-900">{assetData.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Asset Tag</label>
                <p className="text-gray-900">{assetData.assetTag || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <p className="text-gray-900">{assetData.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory</label>
                <p className="text-gray-900">{assetData.subcategory || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number</label>
                <p className="text-gray-900">{assetData.serialNumber || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                <p className="text-gray-900">{assetData.model || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                <p className="text-gray-900">{assetData.manufacturer || 'N/A'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  assetData.condition === 'new' ? 'bg-green-100 text-green-800' :
                  assetData.condition === 'excellent' ? 'bg-blue-100 text-blue-800' :
                  assetData.condition === 'good' ? 'bg-yellow-100 text-yellow-800' :
                  assetData.condition === 'fair' ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {assetData.condition}
                </span>
              </div>
            </div>
          </div>

          {/* Assignment History */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <History className="h-5 w-5 mr-2" />
              Assignment History
            </h2>
            <AssetAssignmentHistory 
              assetId={assetId}
              assignments={assignmentHistory}
            />
          </div>

          {/* Maintenance History */}
          {canViewMaintenance && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Maintenance History
              </h2>
              {maintenanceHistory.length === 0 ? (
                <p className="text-gray-500">No maintenance records found.</p>
              ) : (
                <div className="space-y-4">
                  {maintenanceHistory.map((record) => (
                    <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{record.title}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.priority === 'high' ? 'bg-red-100 text-red-800' :
                          record.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {record.priority}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{record.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Type: {record.type}</span>
                        <span>Status: {record.isCompleted ? 'Completed' : 'Pending'}</span>
                        <span>{record.createdAt?.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Assignment */}
          {currentAssignment && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <UserPlus className="h-5 w-5 mr-2" />
                Current Assignment
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                  <p className="text-gray-900">{currentAssignment.userName}</p>
                  <p className="text-sm text-gray-500">{currentAssignment.userEmail}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned Date</label>
                  <p className="text-gray-900">{currentAssignment.assignedAt?.toLocaleDateString()}</p>
                </div>
                {currentAssignment.expectedReturnAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expected Return</label>
                    <p className="text-gray-900">{currentAssignment.expectedReturnAt.toLocaleDateString()}</p>
                  </div>
                )}
                {currentAssignment.purpose && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Purpose</label>
                    <p className="text-gray-900">{currentAssignment.purpose}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Financial Information
            </h3>
            <div className="space-y-3">
              {purchasePrice > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Price</label>
                  <p className="text-gray-900">${purchasePrice.toFixed(2)}</p>
                </div>
              )}
              {currentValue > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Value</label>
                  <p className="text-gray-900">${currentValue.toFixed(2)}</p>
                </div>
              )}
              {depreciationRate > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Depreciation Rate</label>
                  <p className="text-gray-900">{depreciationRate}% per year</p>
                </div>
              )}
              {purchaseDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Purchase Date</label>
                  <p className="text-gray-900">{purchaseDate.toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>

          {/* Location Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location
            </h3>
            <div className="space-y-3">
              {assetData.building && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Building</label>
                  <p className="text-gray-900">{assetData.building}</p>
                </div>
              )}
              {assetData.floor && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Floor</label>
                  <p className="text-gray-900">{assetData.floor}</p>
                </div>
              )}
              {assetData.room && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <p className="text-gray-900">{assetData.room}</p>
                </div>
              )}
              {assetData.desk && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Desk</label>
                  <p className="text-gray-900">{assetData.desk}</p>
                </div>
              )}
              {assetData.locationNotes && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location Notes</label>
                  <p className="text-gray-900">{assetData.locationNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Warranty Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Warranty
            </h3>
            <div className="space-y-3">
              {warrantyExpiry ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                    <p className={`font-medium ${
                      isWarrantyExpired ? 'text-red-600' :
                      isWarrantyExpiring ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {warrantyExpiry.toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      isWarrantyExpired ? 'bg-red-100 text-red-800' :
                      isWarrantyExpiring ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {isWarrantyExpired ? 'Expired' :
                       isWarrantyExpiring ? 'Expiring Soon' :
                       'Active'}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">No warranty information available</p>
              )}
            </div>
          </div>

          {/* Notes */}
          {assetData.notes && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Notes
              </h3>
              <p className="text-gray-900">{assetData.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 