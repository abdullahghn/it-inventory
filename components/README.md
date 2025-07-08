# IT Inventory System - UI Component Library

A comprehensive, reusable component library built with Shadcn/ui and Tailwind CSS for the IT Inventory Management System.

## 🚀 Quick Start

```tsx
import { DataTable, FormInput, RoleGuard, useInventoryToasts } from '@/components'
```

## 📋 Components Overview

### 1. **Data Table Component**
Advanced data table with sorting, filtering, pagination, and row selection.

```tsx
import { DataTable, DataTableColumnHeader } from '@/components'

const columns = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Asset Name" />
    ),
  },
  // ... more columns
]

<DataTable
  columns={columns}
  data={assets}
  searchKey="name"
  searchPlaceholder="Search assets..."
  enableColumnFilter
  enableRefresh
  onRefresh={refetchData}
/>
```

**Features:**
- ✅ Sorting & filtering
- ✅ Pagination 
- ✅ Column visibility toggle
- ✅ Row selection
- ✅ Loading states
- ✅ Export functionality

### 2. **Form Components**
Comprehensive form components with validation states.

```tsx
import { FormInput, FormSelect, FormDatePicker, FormTextarea } from '@/components'

<FormInput
  label="Asset Name"
  placeholder="Enter asset name"
  required
  error={errors.name}
  icon={<Package className="h-4 w-4" />}
/>

<FormSelect
  label="Category"
  options={[
    { value: 'laptop', label: 'Laptop' },
    { value: 'desktop', label: 'Desktop' },
  ]}
  required
/>

<FormDatePicker
  label="Purchase Date"
  value={purchaseDate}
  onChange={setPurchaseDate}
/>
```

**Available Components:**
- `FormInput` - Enhanced input with icons, validation
- `FormSelect` - Dropdown with search/filter
- `FormDatePicker` - Date selection
- `FormTextarea` - Multi-line text input
- `FormCheckbox` - Checkbox with labels
- `FormRadioGroup` - Radio button groups

### 3. **Modal/Dialog Components**
Specialized modals for different use cases.

```tsx
import { ConfirmationModal, FormModal, AssetAssignmentModal } from '@/components'

// Confirmation Dialog
<ConfirmationModal
  isOpen={showDeleteModal}
  onClose={() => setShowDeleteModal(false)}
  onConfirm={handleDelete}
  title="Delete Asset"
  message="Are you sure you want to delete this asset?"
  variant="danger"
/>

// Asset Assignment
<AssetAssignmentModal
  isOpen={showAssignModal}
  onClose={() => setShowAssignModal(false)}
  onAssign={handleAssign}
  assetName="MacBook Pro 2023"
  availableUsers={users}
/>
```

**Modal Types:**
- `Modal` - Base modal component
- `ConfirmationModal` - Yes/No confirmations
- `DeleteConfirmationModal` - Specialized for deletions
- `FormModal` - Create/edit forms
- `AssetAssignmentModal` - Asset assignment workflow
- `BulkActionModal` - Bulk operations

### 4. **Loading States**
Professional loading indicators and skeletons.

```tsx
import { LoadingSpinner, PageLoading, TableSkeleton, LoadingOverlay } from '@/components'

// Page-level loading
<PageLoading message="Loading dashboard..." />

// Table placeholder
<TableSkeleton rows={10} columns={5} />

// Loading overlay
<LoadingOverlay isLoading={isSubmitting}>
  <MyForm />
</LoadingOverlay>
```

### 5. **Error Boundaries**
Robust error handling with recovery options.

```tsx
import { ErrorBoundaryWrapper, useErrorBoundary } from '@/components'

// Wrap components
<ErrorBoundaryWrapper type="data" fallbackProps={{ type: 'assets' }}>
  <AssetsList />
</ErrorBoundaryWrapper>

// Use in components
function MyComponent() {
  const { captureError } = useErrorBoundary()
  
  const handleAction = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      captureError(error)
    }
  }
}
```

### 6. **Role-Based Access Control (RBAC)**
Comprehensive permission system based on user roles.

```tsx
import { RoleGuard, RequireAdmin, RoleBadge, useCanManageAssets } from '@/components'

// Component-level protection
<RoleGuard requiredRole="admin">
  <AdminPanel />
</RoleGuard>

// Multiple role requirements
<RequireAnyRole roles={['admin', 'it_staff']}>
  <AssetManagement />
</RequireAnyRole>

// Hook-based permissions
function AssetActions() {
  const canManage = useCanManageAssets()
  
  return (
    <div>
      {canManage && <Button>Edit Asset</Button>}
    </div>
  )
}

// Role display
<RoleBadge role="admin" showDescription />
```

**Role Hierarchy:**
1. `viewer` (1) - View-only access
2. `end_user` (2) - Personal assets only
3. `manager` (3) - Department oversight
4. `it_staff` (4) - IT operations
5. `admin` (5) - System administration
6. `super_admin` (6) - Full control

### 7. **Toast Notification System**
Contextual notifications for user feedback.

```tsx
import { ToastProvider, useInventoryToasts } from '@/components'

// Wrap your app
<ToastProvider>
  <App />
</ToastProvider>

// Use in components
function AssetForm() {
  const toasts = useInventoryToasts()
  
  const handleSubmit = async () => {
    try {
      await createAsset(data)
      toasts.assetCreated(data.name)
    } catch (error) {
      toasts.validationError(error.message)
    }
  }
}
```

**Pre-built Toast Types:**
- Asset operations (created, updated, assigned, etc.)
- User management
- Bulk operations
- Validation & network errors
- Maintenance notifications

## 🎨 Design System

### Color Variants
```tsx
// Button variants
<Button variant="default" />
<Button variant="destructive" />
<Button variant="outline" />
<Button variant="secondary" />
<Button variant="ghost" />

// Badge variants
<Badge variant="success" />
<Badge variant="warning" />
<Badge variant="info" />
<Badge variant="destructive" />
```

### Responsive Design
All components are mobile-first and fully responsive:
- `sm:` - 640px and up
- `md:` - 768px and up  
- `lg:` - 1024px and up
- `xl:` - 1280px and up

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader friendly
- High contrast mode support

## 🔧 Usage Examples

### Complete Asset Management Page
```tsx
import {
  DataTable,
  DataTableColumnHeader,
  FormModal,
  DeleteConfirmationModal,
  RequireAdmin,
  useInventoryToasts,
  LoadingOverlay
} from '@/components'

function AssetsPage() {
  const [assets, setAssets] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  
  const toasts = useInventoryToasts()

  const columns = [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Asset Name" />
      ),
    },
    {
      accessorKey: "category",
      header: "Category",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status")
        return <Badge variant={getStatusVariant(status)}>{status}</Badge>
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <RequireAdmin>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setSelectedAsset(row.original)
              setShowDeleteModal(true)
            }}
          >
            Delete
          </Button>
        </RequireAdmin>
      ),
    },
  ]

  const handleDelete = async () => {
    try {
      await deleteAsset(selectedAsset.id)
      toasts.assetDeleted(selectedAsset.name)
      fetchAssets() // Refresh data
    } catch (error) {
      toasts.networkError()
    }
    setShowDeleteModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Assets</h1>
        <RequireAdmin>
          <Button onClick={() => setShowCreateModal(true)}>
            Add Asset
          </Button>
        </RequireAdmin>
      </div>

      <LoadingOverlay isLoading={isLoading}>
        <DataTable
          columns={columns}
          data={assets}
          searchKey="name"
          searchPlaceholder="Search assets..."
          enableColumnFilter
          enableRefresh
          onRefresh={fetchAssets}
        />
      </LoadingOverlay>

      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Asset"
        type="create"
      >
        <AssetForm onSubmit={handleCreateAsset} />
      </FormModal>

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={selectedAsset?.name || ''}
        itemType="asset"
      />
    </div>
  )
}
```

## 📦 Dependencies

- React 18+
- Next.js 15+
- Tailwind CSS
- Radix UI primitives
- Lucide React icons
- NextAuth.js (for RBAC)
- TanStack Table (for DataTable)

## 🛠️ Development

All components are fully typed with TypeScript and follow consistent patterns:
- Props interfaces for all components
- Forward refs where appropriate
- Consistent naming conventions
- Comprehensive error handling

## 🎯 Best Practices

1. **Always wrap forms in error boundaries**
2. **Use role guards for sensitive operations**
3. **Provide loading states for async operations**
4. **Show user feedback with toasts**
5. **Follow the established design system**
6. **Test with different user roles**

This component library provides everything needed to build a professional, accessible, and secure IT inventory management system! 