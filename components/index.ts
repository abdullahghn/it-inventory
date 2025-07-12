// UI Components
export { Button, buttonVariants } from './ui/button'
export { Input } from './ui/input'
export { Label } from './ui/label'
export { Badge, badgeVariants } from './ui/badge'
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './ui/card'
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from './ui/table'
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from './ui/dropdown-menu'
export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'

// Data Table Components
export { DataTable, DataTableColumnHeader } from './ui/data-table'

// Form Components
export {
  FormField,
  FormInput,
  FormSelect,
  FormDatePicker,
  FormTextarea,
  FormCheckbox,
  FormRadioGroup,
} from './forms/form-field'

// Modal Components
export {
  Modal,
  ConfirmationModal,
  DeleteConfirmationModal,
  FormModal,
  AssetAssignmentModal,
  BulkActionModal,
} from './ui/modal'

// Loading States
export {
  LoadingSpinner,
  PageLoading,
  InlineLoading,
  TableSkeleton,
  CardSkeleton,
  FormSkeleton,
  LoadingOverlay,
  ProgressIndicator,
  StatusIndicator,
  EmptyState,
} from './ui/loading'

// Error Boundaries
export {
  ErrorBoundary,
  useErrorBoundary,
  PageErrorFallback,
  DataErrorFallback,
  FormErrorFallback,
  ErrorBoundaryWrapper,
} from './ui/error-boundary'

// RBAC Components
export {
  RoleGuard,
  RequireRole,
  RequireAnyRole,
  RequireAdmin,
  RequireManager,
  RoleBadge,
  PermissionGate,
  useUserRole,
  useHasPermission,
  useIsAdmin,
  useIsManager,
  useCanManageUsers,
  useCanManageAssets,
  useCanAssignAssets,
  hasPermission,
  hasDepartmentAccess,
} from './auth/RoleGuard'
export type { UserRole } from './auth/RoleGuard'

// Toast System
export {
  ToastProvider,
  useToast,
  useInventoryToasts,
} from './ui/toast'
export type { Toast, ToastType } from './ui/toast'

// Role Selector Components
export {
  RoleSelector,
  RoleSelectorDropdown,
  RoleSelectorRadio,
  RoleSelectorSelect,
  ROLE_CONFIG,
} from './ui/role-selector'

// User Asset History Components
export {
  UserAssetHistory,
  ProtectedUserAssetHistory,
} from './ui/user-asset-history'
export type { AssetAssignment } from './ui/user-asset-history' 