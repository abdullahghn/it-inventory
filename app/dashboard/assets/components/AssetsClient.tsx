'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { RequireRole } from '@/components/auth/RoleGuard'
import { EmptyState } from '@/components/ui/loading'
import { useToast } from '@/components/ui/toast'
import { DeleteConfirmationModal } from '@/components/ui/modal'
import { MoreHorizontal, Plus, Eye, UserPlus, Edit, Trash2, Download } from 'lucide-react'
import type { ColumnDef } from '@tanstack/react-table'

interface Asset {
  id: number
  assetTag: string
  name: string
  category: string
  subcategory: string | null
  status: string
  condition: string
  serialNumber: string | null
  model: string | null
  manufacturer: string | null
  specifications: any
  purchaseDate: string | null
  purchasePrice: string | null  // Decimal fields come as strings from DB
  currentValue: string | null   // Decimal fields come as strings from DB
  depreciationRate: string | null // Decimal fields come as strings from DB
  warrantyExpiry: string | null
  building: string | null
  floor: string | null
  room: string | null
  desk: string | null
  locationNotes: string | null
  description: string | null
  notes: string | null
  isDeleted: boolean
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

interface AssetsClientProps {
  initialAssets: Asset[]
  canCreateAssets: boolean
  canAssignAssets: boolean
  canViewAllAssets: boolean
}

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case 'available': return 'success'
    case 'assigned': return 'info' 
    case 'maintenance': return 'warning'
    case 'retired': return 'destructive'
    default: return 'secondary'
  }
}

const getConditionBadgeVariant = (condition: string) => {
  switch (condition) {
    case 'new': return 'default'
    case 'excellent': return 'success'
    case 'good': return 'info'
    case 'fair': return 'warning' 
    case 'poor': return 'destructive'
    case 'damaged': return 'destructive'
    default: return 'secondary'
  }
}

export function AssetsClient({ 
  initialAssets, 
  canCreateAssets, 
  canAssignAssets, 
  canViewAllAssets 
}: AssetsClientProps) {
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null)
  const { success, error: showError } = useToast()

  // Update assets when initialAssets change (e.g., after page refresh)
  React.useEffect(() => {
    setAssets(initialAssets)
  }, [initialAssets])

  const handleDelete = async (asset: Asset) => {
    try {
      const response = await fetch(`/api/assets/${asset.id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) throw new Error('Failed to delete asset')
      
      setAssets(prev => prev.filter(a => a.id !== asset.id))
      success('Asset deleted', `${asset.name} has been successfully deleted`)
      setDeleteModalOpen(false)
      setAssetToDelete(null)
    } catch (error) {
      showError('Failed to delete asset', 'Please try again later')
    }
  }

  const handleExport = () => {
    const csvContent = [
      'Asset Tag,Name,Category,Status,Serial Number,Manufacturer,Model',
      ...assets.map(asset => 
        `${asset.assetTag},${asset.name},${asset.category},${asset.status},${asset.serialNumber},${asset.manufacturer},${asset.model}`
      )
    ].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'assets.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const columns: ColumnDef<Asset>[] = [
    {
      accessorKey: 'assetTag',
      header: 'Asset Tag',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('assetTag')}</div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'category',
      header: 'Category',
    },
    {
      accessorKey: 'serialNumber',
      header: 'Serial Number',
      cell: ({ row }) => (
        <div className="font-mono text-sm">{row.getValue('serialNumber') || 'N/A'}</div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        return (
          <Badge variant={getStatusBadgeVariant(status)}>
            {status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'condition',
      header: 'Condition',
      cell: ({ row }) => {
        const condition = row.getValue('condition') as string
        return (
          <Badge variant={getConditionBadgeVariant(condition)}>
            {condition}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'manufacturer',
      header: 'Manufacturer',
    },
    {
      accessorKey: 'model',
      header: 'Model',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const asset = row.original
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/assets/${asset.id}`} className="flex items-center">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              
              <RequireRole role="manager">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/assets/${asset.id}/edit`} className="flex items-center">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Asset
                  </Link>
                </DropdownMenuItem>
              </RequireRole>

              {canAssignAssets && (
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/assignments/new?assetId=${asset.id}`} className="flex items-center">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign Asset
                  </Link>
                </DropdownMenuItem>
              )}

              <RequireRole role="admin">
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={() => {
                    setAssetToDelete(asset)
                    setDeleteModalOpen(true)
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Asset
                </DropdownMenuItem>
              </RequireRole>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600">
            {canViewAllAssets ? 'Manage your IT assets' : 'View your assigned assets'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          
          {canCreateAssets && (
            <Link href="/dashboard/assets/new">
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add Asset
              </Button>
            </Link>
          )}
        </div>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          title={canViewAllAssets ? 'No assets found' : 'No assets assigned to you'}
          description={canViewAllAssets 
            ? 'Start by adding your first asset' 
            : 'Contact your manager if you need access to assets'}
          action={canCreateAssets ? (
            <Link href="/dashboard/assets/new">
              <Button>Add First Asset</Button>
            </Link>
          ) : undefined}
        />
      ) : (
        <DataTable
          columns={columns}
          data={assets}
          searchKey="name"
          searchPlaceholder="Search assets..."
        />
      )}

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => assetToDelete && handleDelete(assetToDelete)}
        itemName={assetToDelete?.name || ''}
        itemType="asset"
      />
    </div>
  )
} 