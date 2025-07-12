import { z } from 'zod'

// ============================================================================
// ENUM VALIDATION SCHEMAS - Matching TypeScript types exactly
// ============================================================================

export const userRoleSchema = z.enum(['super_admin', 'admin', 'manager', 'user', 'viewer'])

export const assetStatusSchema = z.enum(['available', 'assigned', 'maintenance', 'repair', 'retired', 'lost', 'stolen'])

export const assetCategorySchema = z.enum(['laptop', 'desktop', 'monitor', 'printer', 'phone', 'tablet', 'server', 'network_device', 'software_license', 'toner', 'other'])

export const assetConditionSchema = z.enum(['new', 'excellent', 'good', 'fair', 'poor', 'damaged'])

export const maintenanceTypeSchema = z.enum(['preventive', 'corrective', 'upgrade', 'repair', 'inspection', 'emergency'])

export const maintenancePrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

export const auditActionSchema = z.enum(['create', 'update', 'delete', 'assign', 'return', 'maintenance', 'login', 'logout'])

export const assignmentStatusSchema = z.enum(['active', 'returned', 'overdue', 'lost'])

// ============================================================================
// CORE ENTITY VALIDATION SCHEMAS
// ============================================================================

// User validation schemas
export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  department: z.string().max(100).optional().nullable(),
  jobTitle: z.string().max(100).optional().nullable(),
  employeeId: z.string().max(50).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  role: userRoleSchema.default('user'),
  isActive: z.boolean().default(true),
})

export const updateUserSchema = createUserSchema.partial().extend({
  id: z.string().min(1, 'User ID is required'),
}).omit({ email: true })

// Asset validation schemas
export const createAssetSchema = z.object({
  assetTag: z.string().min(1, 'Asset tag is required').max(50),
  name: z.string().min(1, 'Asset name is required').max(255),
  category: assetCategorySchema,
  subcategory: z.string().max(100).optional().nullable(),
  serialNumber: z.string().max(255).optional().nullable(),
  model: z.string().max(255).optional().nullable(),
  manufacturer: z.string().max(255).optional().nullable(),
  specifications: z.record(z.any()).optional().nullable(),
  
  // Financial fields - using string for decimal values
  purchaseDate: z.coerce.date().optional().nullable(),
  purchasePrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format').optional().nullable(),
  currentValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid value format').optional().nullable(),
  depreciationRate: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid rate format').optional().nullable(),
  warrantyExpiry: z.coerce.date().optional().nullable(),
  
  // Status and condition
  status: assetStatusSchema.default('available'),
  condition: assetConditionSchema.default('good'),
  
  // Structured location fields
  building: z.string().max(100).optional().nullable(),
  floor: z.string().max(20).optional().nullable(),
  room: z.string().max(50).optional().nullable(),
  desk: z.string().max(50).optional().nullable(),
  locationNotes: z.string().optional().nullable(),
  
  // Metadata
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateAssetSchema = createAssetSchema.partial().extend({
  id: z.number().positive('Asset ID is required'),
  assetTag: z.string().min(1, 'Asset tag is required').max(50), // Keep required
  name: z.string().min(1, 'Asset name is required').max(255), // Keep required
})

// Assignment validation schemas
export const createAssignmentSchema = z.object({
  assetId: z.number().positive('Asset ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  purpose: z.string().max(255).optional().nullable(),
  expectedReturnAt: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
})

export const updateAssignmentSchema = z.object({
  id: z.number().positive('Assignment ID is required'),
  status: assignmentStatusSchema.optional(),
  returnedAt: z.coerce.date().optional().nullable(),
  actualReturnCondition: assetConditionSchema.optional().nullable(),
  returnNotes: z.string().optional().nullable(),
  expectedReturnAt: z.coerce.date().optional().nullable(),
  notes: z.string().optional().nullable(),
  purpose: z.string().max(255).optional().nullable(),
})

export const returnAssignmentSchema = z.object({
  assignmentId: z.number().positive('Assignment ID is required'),
  returnedAt: z.coerce.date().default(() => new Date()),
  actualReturnCondition: assetConditionSchema.optional(),
  returnNotes: z.string().optional(),
})

// Maintenance validation schemas
export const createMaintenanceSchema = z.object({
  assetId: z.number().positive('Asset ID is required'),
  type: maintenanceTypeSchema,
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().min(1, 'Description is required'),
  priority: maintenancePrioritySchema.default('medium'),
  
  // Personnel
  performedBy: z.string().max(255).optional().nullable(),
  
  // Timing
  scheduledAt: z.coerce.date().optional().nullable(),
  startedAt: z.coerce.date().optional().nullable(),
  completedAt: z.coerce.date().optional().nullable(),
  nextScheduledAt: z.coerce.date().optional().nullable(),
  
  // Status and conditions
  isCompleted: z.boolean().default(false),
  conditionBefore: assetConditionSchema.optional().nullable(),
  conditionAfter: assetConditionSchema.optional().nullable(),
  
  // Documentation
  attachments: z.record(z.any()).optional().nullable(),
})

export const updateMaintenanceSchema = createMaintenanceSchema.partial().extend({
  id: z.number().positive('Maintenance ID is required'),
  title: z.string().min(1, 'Title is required').max(255), // Keep required
  description: z.string().min(1, 'Description is required'), // Keep required
})

// Location validation schemas
export const createLocationSchema = z.object({
  building: z.string().min(1, 'Building is required').max(100),
  floor: z.string().max(20).optional().nullable(),
  room: z.string().max(50).optional().nullable(),
  description: z.string().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  isActive: z.boolean().default(true),
})

export const updateLocationSchema = createLocationSchema.partial().extend({
  id: z.number().positive('Location ID is required'),
  building: z.string().min(1, 'Building is required').max(100), // Keep required
})

// ============================================================================
// SEARCH AND FILTER VALIDATION SCHEMAS
// ============================================================================

export const assetFiltersSchema = z.object({
  search: z.string().optional(),
  category: z.union([assetCategorySchema, z.array(assetCategorySchema)]).optional(),
  status: z.union([assetStatusSchema, z.array(assetStatusSchema)]).optional(),
  condition: z.union([assetConditionSchema, z.array(assetConditionSchema)]).optional(),
  manufacturer: z.string().optional(),
  
  // Location filters
  building: z.string().optional(),
  floor: z.string().optional(),
  room: z.string().optional(),
  
  // Date filters
  purchaseDateFrom: z.coerce.date().optional(),
  purchaseDateTo: z.coerce.date().optional(),
  warrantyExpiryFrom: z.coerce.date().optional(),
  warrantyExpiryTo: z.coerce.date().optional(),
  
  // Assignment filters
  assignedTo: z.string().optional(),
  isAssigned: z.boolean().optional(),
  
  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const userFiltersSchema = z.object({
  search: z.string().optional(),
  role: z.union([userRoleSchema, z.array(userRoleSchema)]).optional(),
  department: z.union([z.string(), z.array(z.string())]).optional(),
  isActive: z.boolean().optional(),
  
  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const assignmentFiltersSchema = z.object({
  userId: z.string().optional(),
  assetId: z.number().int().positive().optional(),
  status: z.union([assignmentStatusSchema, z.array(assignmentStatusSchema)]).optional(),
  assignedBy: z.string().optional(),
  
  // Date filters
  assignedFrom: z.coerce.date().optional(),
  assignedTo: z.coerce.date().optional(),
  expectedReturnFrom: z.coerce.date().optional(),
  expectedReturnTo: z.coerce.date().optional(),
  
  // Status filters
  isActive: z.boolean().optional(),
  isOverdue: z.boolean().optional(),
  
  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const maintenanceFiltersSchema = z.object({
  assetId: z.number().int().positive().optional(),
  type: z.union([maintenanceTypeSchema, z.array(maintenanceTypeSchema)]).optional(),
  priority: z.union([maintenancePrioritySchema, z.array(maintenancePrioritySchema)]).optional(),
  isCompleted: z.boolean().optional(),
  performedBy: z.string().optional(),
  
  // Date filters
  scheduledFrom: z.coerce.date().optional(),
  scheduledTo: z.coerce.date().optional(),
  completedFrom: z.coerce.date().optional(),
  completedTo: z.coerce.date().optional(),
  
  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// ============================================================================
// BULK OPERATION VALIDATION SCHEMAS
// ============================================================================

export const bulkOperationSchema = z.object({
  operation: z.enum(['create', 'update', 'delete', 'assign', 'return']),
  entityType: z.enum(['assets', 'users', 'assignments']),
  ids: z.array(z.union([z.string(), z.number()])).min(1, 'At least one item must be selected'),
  data: z.record(z.any()).optional(), // For update operations
})

// Bulk import validation schemas
export const bulkImportSchema = z.object({
  file: z.instanceof(File, { message: 'Please select a file' }),
  entityType: z.enum(['assets', 'users', 'assignments']),
  hasHeaders: z.boolean(),
  delimiter: z.enum([',', ';', '\t']),
  updateExisting: z.boolean(),
  skipErrors: z.boolean(),
})

// CSV/Excel row validation schemas
export const assetImportRowSchema = z.object({
  assetTag: z.string().min(1, 'Asset tag is required').max(50),
  name: z.string().min(1, 'Asset name is required').max(255),
  category: assetCategorySchema,
  subcategory: z.string().max(100).optional(),
  serialNumber: z.string().max(255).optional(),
  model: z.string().max(255).optional(),
  manufacturer: z.string().max(255).optional(),
  status: assetStatusSchema.default('available'),
  condition: assetConditionSchema.default('good'),
  purchaseDate: z.string().optional(), // Will be parsed as date
  purchasePrice: z.string().optional(), // Will be parsed as decimal
  warrantyExpiry: z.string().optional(), // Will be parsed as date
  building: z.string().max(100).optional(),
  floor: z.string().max(20).optional(),
  room: z.string().max(50).optional(),
  desk: z.string().max(50).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export const userImportRowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email address').max(255),
  department: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  employeeId: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  role: userRoleSchema.default('user'),
  isActive: z.boolean().default(true),
})

export const assignmentImportRowSchema = z.object({
  assetTag: z.string().min(1, 'Asset tag is required'),
  userEmail: z.string().email('Invalid user email'),
  purpose: z.string().max(255).optional(),
  expectedReturnAt: z.string().optional(), // Will be parsed as date
  notes: z.string().optional(),
})

// Import result validation
export const importResultSchema = z.object({
  success: z.boolean(),
  totalRows: z.number().int().positive(),
  processedRows: z.number().int().min(0),
  successRows: z.number().int().min(0),
  errorRows: z.number().int().min(0),
  errors: z.array(z.object({
    row: z.number().int().positive(),
    field: z.string().optional(),
    message: z.string(),
    data: z.record(z.any()).optional(),
  })).optional(),
  warnings: z.array(z.object({
    row: z.number().int().positive(),
    field: z.string().optional(),
    message: z.string(),
  })).optional(),
})

// ============================================================================
// EXPORT VALIDATION SCHEMAS
// ============================================================================

export const exportRequestSchema = z.object({
  format: z.enum(['csv', 'xlsx', 'pdf', 'json']),
  entityType: z.enum(['assets', 'users', 'assignments', 'maintenance']),
  filters: z.record(z.any()).optional(),
  columns: z.array(z.string()).optional(),
  fileName: z.string().optional(),
  options: z.object({
    includeHeaders: z.boolean().default(true),
    dateFormat: z.string().default('YYYY-MM-DD'),
    timezone: z.string().default('UTC'),
  }).optional(),
})

// ============================================================================
// API RESPONSE VALIDATION SCHEMAS
// ============================================================================

export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string(),
  errors: z.record(z.array(z.string())).optional(),
  timestamp: z.string(),
})

export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
  message: z.string(),
  timestamp: z.string(),
})

// ============================================================================
// FORM-SPECIFIC VALIDATION SCHEMAS
// ============================================================================

// Enhanced form schemas with better error messages and conditional validation
export const assetFormSchema = z.object({
  // Basic fields
  assetTag: z.string()
    .min(1, 'Asset tag is required')
    .max(50, 'Asset tag must be 50 characters or less')
    .regex(/^[A-Z]{2,3}-\d{4,}$/, 'Asset tag must follow format: IT-0001 or IT-00001'),
  
  name: z.string().min(1, 'Asset name is required').max(255),
  category: assetCategorySchema,
  subcategory: z.string().max(100).optional().nullable(),
  serialNumber: z.string().max(255).optional().nullable(),
  model: z.string().max(255).optional().nullable(),
  manufacturer: z.string().max(255).optional().nullable(),
  specifications: z.record(z.any()).optional().nullable(),
  
  // Status and condition
  status: assetStatusSchema,
  condition: assetConditionSchema,
  
  // Financial fields
  purchaseDate: z.coerce.date()
    .max(new Date(), 'Purchase date cannot be in the future')
    .optional()
    .nullable(),
  
  purchasePrice: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid number with up to 2 decimal places')
    .optional()
    .nullable(),
  
  currentValue: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Value must be a valid number with up to 2 decimal places')
    .optional()
    .nullable(),
  
  depreciationRate: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Rate must be a valid number with up to 2 decimal places')
    .optional()
    .nullable(),
  
  warrantyExpiry: z.coerce.date()
    .min(new Date(), 'Warranty expiry must be in the future')
    .optional()
    .nullable(),
  
  // Location fields
  building: z.string().max(100).optional().nullable(),
  floor: z.string().max(20).optional().nullable(),
  room: z.string().max(50).optional().nullable(),
  desk: z.string().max(50).optional().nullable(),
  locationNotes: z.string().optional().nullable(),
  
  // Metadata
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  
  // Conditional validation
}).refine((data) => {
  // If warranty expiry is set, purchase date should also be set
  if (data.warrantyExpiry && !data.purchaseDate) {
    return false
  }
  return true
}, {
  message: 'Purchase date is required when warranty expiry is set',
  path: ['purchaseDate']
}).refine((data) => {
  // If warranty expiry is set, it should be after purchase date
  if (data.warrantyExpiry && data.purchaseDate && data.warrantyExpiry <= data.purchaseDate) {
    return false
  }
  return true
}, {
  message: 'Warranty expiry must be after purchase date',
  path: ['warrantyExpiry']
})

export const userFormSchema = createUserSchema.extend({
  // Enhanced email validation
  email: z.string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be 255 characters or less')
    .toLowerCase(),
  
  // Required role field
  role: userRoleSchema,
  
  // Required isActive field
  isActive: z.boolean(),
  
  // Enhanced phone validation
  phone: z.string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number')
    .optional()
    .nullable(),
  
  // Enhanced employee ID validation
  employeeId: z.string()
    .regex(/^[A-Z0-9]{3,10}$/, 'Employee ID must be 3-10 alphanumeric characters')
    .optional()
    .nullable(),
  
  // Enhanced name validation
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be 255 characters or less')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
})

export const assignmentFormSchema = createAssignmentSchema.extend({
  // Enhanced purpose validation
  purpose: z.string()
    .min(10, 'Purpose must be at least 10 characters')
    .max(255, 'Purpose must be 255 characters or less')
    .optional()
    .nullable(),
  
  // Enhanced date validation
  expectedReturnAt: z.coerce.date()
    .min(new Date(), 'Expected return date must be in the future')
    .optional()
    .nullable(),
  
  // Enhanced notes validation
  notes: z.string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .nullable(),
})

export const maintenanceFormSchema = createMaintenanceSchema.extend({
  // Enhanced title validation
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(255, 'Title must be 255 characters or less'),
  
  // Enhanced description validation
  description: z.string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be 2000 characters or less'),
  
  // Enhanced date validation
  scheduledAt: z.coerce.date()
    .min(new Date(), 'Scheduled date must be in the future')
    .optional()
    .nullable(),
  
  completedAt: z.coerce.date()
    .max(new Date(), 'Completion date cannot be in the future')
    .optional()
    .nullable(),
  
  // Conditional validation
}).refine((data) => {
  // If completed, completion date should be set
  if (data.isCompleted && !data.completedAt) {
    return false
  }
  return true
}, {
  message: 'Completion date is required when marking as completed',
  path: ['completedAt']
}).refine((data) => {
  // If completed, completion date should be after start date
  if (data.isCompleted && data.completedAt && data.startedAt && data.completedAt < data.startedAt) {
    return false
  }
  return true
}, {
  message: 'Completion date must be after start date',
  path: ['completedAt']
})

// ============================================================================
// TYPE INFERENCE - Export inferred types from schemas
// ============================================================================

export type CreateUser = z.infer<typeof createUserSchema>
export type UpdateUser = z.infer<typeof updateUserSchema>
export type CreateAsset = z.infer<typeof createAssetSchema>
export type UpdateAsset = z.infer<typeof updateAssetSchema>
export type CreateAssignment = z.infer<typeof createAssignmentSchema>
export type UpdateAssignment = z.infer<typeof updateAssignmentSchema>
export type ReturnAssignment = z.infer<typeof returnAssignmentSchema>
export type CreateMaintenance = z.infer<typeof createMaintenanceSchema>
export type UpdateMaintenance = z.infer<typeof updateMaintenanceSchema>
export type CreateLocation = z.infer<typeof createLocationSchema>
export type UpdateLocation = z.infer<typeof updateLocationSchema>

// Filter types
export type AssetFilters = z.infer<typeof assetFiltersSchema>
export type UserFilters = z.infer<typeof userFiltersSchema>
export type AssignmentFilters = z.infer<typeof assignmentFiltersSchema>
export type MaintenanceFilters = z.infer<typeof maintenanceFiltersSchema>

// Form types
export type AssetFormData = z.infer<typeof assetFormSchema>
export type UserFormData = z.infer<typeof userFormSchema>
export type AssignmentFormData = z.infer<typeof assignmentFormSchema>
export type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>

// Bulk operation types
export type BulkOperation = z.infer<typeof bulkOperationSchema>
export type BulkImport = z.infer<typeof bulkImportSchema>
export type AssetImportRow = z.infer<typeof assetImportRowSchema>
export type UserImportRow = z.infer<typeof userImportRowSchema>
export type AssignmentImportRow = z.infer<typeof assignmentImportRowSchema>
export type ImportResult = z.infer<typeof importResultSchema>

// Export types
export type ExportRequest = z.infer<typeof exportRequestSchema>

// API response types
export type ApiResponseType = z.infer<typeof apiResponseSchema>
export type PaginatedResponseType = z.infer<typeof paginatedResponseSchema>

// ============================================================================
// UTILITY VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates that a date is not in the past (for warranty, maintenance scheduling)
 */
export const futureDateSchema = z.coerce.date().refine(
  (date) => date > new Date(),
  { message: 'Date must be in the future' }
)

/**
 * Validates that expected return date is after assignment date
 */
export const validateAssignmentDates = (data: { assignedAt?: Date; expectedReturnAt?: Date }) => {
  if (data.assignedAt && data.expectedReturnAt) {
    return data.expectedReturnAt > data.assignedAt
  }
  return true
}

/**
 * Validates that maintenance completion date is after start date
 */
export const validateMaintenanceDates = (data: { startedAt?: Date; completedAt?: Date }) => {
  if (data.startedAt && data.completedAt) {
    return data.completedAt > data.startedAt
  }
  return true
}

/**
 * Custom validation for asset tag format (configurable pattern)
 */
export const createAssetTagSchema = (pattern: RegExp = /^[A-Z]{2,3}-\d{6,}$/) => 
  z.string().regex(pattern, 'Invalid asset tag format')

/**
 * Custom validation for employee ID format
 */
export const employeeIdSchema = z.string().regex(
  /^[A-Z0-9]{4,10}$/,
  'Employee ID must be 4-10 alphanumeric characters'
)

/**
 * Custom validation for phone numbers (international format)
 */
export const phoneSchema = z.string().regex(
  /^\+?[\d\s\-\(\)]+$/,
  'Invalid phone number format'
).optional().nullable()

/**
 * Validates currency amounts (supports different currencies)
 */
export const currencySchema = (currency: string = 'SAR') => 
  z.string().regex(
    /^\d+(\.\d{1,2})?$/,
    `Invalid ${currency} amount format`
  )

/**
 * Schema for validating IP addresses (for audit logs)
 */
export const ipAddressSchema = z.string().regex(
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
  'Invalid IP address format'
).optional().nullable() 