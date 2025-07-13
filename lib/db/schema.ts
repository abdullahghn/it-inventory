import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  timestamp, 
  boolean, 
  integer, 
  index, 
  pgEnum,
  decimal,
  jsonb
} from 'drizzle-orm/pg-core'

// ============================================================================
// ENUMS - Define all enum types for type safety and data integrity
// ============================================================================

export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'admin', 
  'manager',
  'user',
  'viewer'
])

export const assetStatusEnum = pgEnum('asset_status', [
  'available',
  'assigned', 
  'maintenance',
  'repair',
  'retired',
  'lost',
  'stolen'
])

export const assetCategoryEnum = pgEnum('asset_category', [
  'laptop',
  'desktop',
  'monitor',
  'printer',
  'phone',
  'tablet',
  'server',
  'network_device',
  'software_license',
  'toner',
  'other'
])

export const assetConditionEnum = pgEnum('asset_condition', [
  'new',
  'excellent',
  'good', 
  'fair',
  'poor',
  'damaged'
])

export const maintenanceTypeEnum = pgEnum('maintenance_type', [
  'preventive',
  'corrective',
  'upgrade',
  'repair',
  'inspection',
  'emergency'
])

export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update', 
  'delete',
  'assign',
  'return',
  'maintenance',
  'login',
  'logout'
])

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'active',
  'returned',
  'overdue',
  'lost'
])

// ============================================================================
// NEXTAUTH TABLES - Required for authentication (exact schema needed)
// ============================================================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: varchar('name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: varchar('image', { length: 255 }),
  // Enhanced user fields
  role: userRoleEnum('role').default('user').notNull(),
  department: varchar('department', { length: 100 }),
  jobTitle: varchar('job_title', { length: 100 }),
  employeeId: varchar('employee_id', { length: 50 }).unique(),
  phone: varchar('phone', { length: 20 }),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    emailIdx: index('user_email_idx').on(table.email),
    roleIdx: index('user_role_idx').on(table.role),
    employeeIdIdx: index('user_employee_id_idx').on(table.employeeId),
    departmentIdx: index('user_department_idx').on(table.department),
    isActiveIdx: index('user_is_active_idx').on(table.isActive),
  }
})

export const account = pgTable('account', {
  id: serial('id').primaryKey(),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 255 }).notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  providerAccountId: varchar('providerAccountId', { length: 255 }).notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: varchar('token_type', { length: 255 }),
  scope: varchar('scope', { length: 255 }),
  id_token: text('id_token'),
  session_state: varchar('session_state', { length: 255 }),
}, (table) => {
  return {
    userIdIdx: index('account_userId_idx').on(table.userId),
    providerIdx: index('account_provider_idx').on(table.provider),
  }
})

export const session = pgTable('session', {
  id: serial('id').primaryKey(),
  sessionToken: varchar('sessionToken', { length: 255 }).notNull().unique(),
  userId: text('userId').references(() => user.id, { onDelete: 'cascade' }).notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => {
  return {
    userIdIdx: index('session_userId_idx').on(table.userId),
    expiresIdx: index('session_expires_idx').on(table.expires),
  }
})

export const verificationToken = pgTable('verificationToken', {
  identifier: varchar('identifier', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
}, (table) => {
  return {
    tokenIdx: index('verificationToken_token_idx').on(table.token),
  }
})

// ============================================================================
// CORE BUSINESS TABLES - Enhanced with enums and proper structure
// ============================================================================

export const assets = pgTable('assets', {
  id: serial('id').primaryKey(),
  assetTag: varchar('asset_tag', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: assetCategoryEnum('category').notNull(),
  subcategory: varchar('subcategory', { length: 100 }),
  status: assetStatusEnum('status').default('available').notNull(),
  condition: assetConditionEnum('condition').default('good').notNull(),
  
  // Technical specifications
  serialNumber: varchar('serial_number', { length: 255 }).unique(),
  model: varchar('model', { length: 255 }),
  manufacturer: varchar('manufacturer', { length: 255 }),
  specifications: jsonb('specifications'), // Store flexible tech specs as JSON
  
  // Financial information
  purchaseDate: timestamp('purchase_date'),
  purchasePrice: decimal('purchase_price', { precision: 10, scale: 2 }),
  currentValue: decimal('current_value', { precision: 10, scale: 2 }),
  depreciationRate: decimal('depreciation_rate', { precision: 5, scale: 2 }), // Percentage
  warrantyExpiry: timestamp('warranty_expiry'),
  
  // Location information (structured)
  building: varchar('building', { length: 100 }),
  floor: varchar('floor', { length: 20 }),
  room: varchar('room', { length: 50 }),
  desk: varchar('desk', { length: 50 }),
  locationNotes: text('location_notes'),
  
  // Metadata
  description: text('description'),
  notes: text('notes'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  createdBy: text('created_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    assetTagIdx: index('assets_asset_tag_idx').on(table.assetTag),
    statusIdx: index('assets_status_idx').on(table.status),
    categoryIdx: index('assets_category_idx').on(table.category),
    serialNumberIdx: index('assets_serial_number_idx').on(table.serialNumber),
    nameIdx: index('assets_name_idx').on(table.name),
    buildingIdx: index('assets_building_idx').on(table.building),
    isDeletedIdx: index('assets_is_deleted_idx').on(table.isDeleted),
    createdByIdx: index('assets_created_by_idx').on(table.createdBy),
    warrantyExpiryIdx: index('assets_warranty_expiry_idx').on(table.warrantyExpiry),
  }
})

export const assetAssignments = pgTable('asset_assignments', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id, { onDelete: 'restrict' }).notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'restrict' }).notNull(),
  status: assignmentStatusEnum('status').default('active').notNull(),
  
  // Assignment details
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  expectedReturnAt: timestamp('expected_return_at'),
  returnedAt: timestamp('returned_at'),
  actualReturnCondition: assetConditionEnum('actual_return_condition'),
  
  // Assignment metadata
  purpose: varchar('purpose', { length: 255 }), // Work from home, project, replacement, etc.
  assignedBy: text('assigned_by').references(() => user.id),
  returnedBy: text('returned_by').references(() => user.id),
  notes: text('notes'),
  returnNotes: text('return_notes'),
  
  // Location information (for assignment-specific location)
  building: varchar('building', { length: 100 }),
  floor: varchar('floor', { length: 20 }),
  room: varchar('room', { length: 50 }),
  desk: varchar('desk', { length: 50 }),
  locationNotes: text('location_notes'),
  
  // Tracking
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    assetIdIdx: index('asset_assignments_asset_id_idx').on(table.assetId),
    userIdIdx: index('asset_assignments_user_id_idx').on(table.userId),
    statusIdx: index('asset_assignments_status_idx').on(table.status),
    isActiveIdx: index('asset_assignments_is_active_idx').on(table.isActive),
    assignedAtIdx: index('asset_assignments_assigned_at_idx').on(table.assignedAt),
    returnedAtIdx: index('asset_assignments_returned_at_idx').on(table.returnedAt),
    expectedReturnAtIdx: index('asset_assignments_expected_return_at_idx').on(table.expectedReturnAt),
    assignedByIdx: index('asset_assignments_assigned_by_idx').on(table.assignedBy),
    buildingIdx: index('asset_assignments_building_idx').on(table.building),
  }
})

export const maintenanceRecords = pgTable('maintenance_records', {
  id: serial('id').primaryKey(),
  assetId: integer('asset_id').references(() => assets.id, { onDelete: 'restrict' }).notNull(),
  type: maintenanceTypeEnum('type').notNull(),
  
  // Maintenance details
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  priority: varchar('priority', { length: 20 }).default('medium'), // low, medium, high, critical
  
  // Personnel information
  performedBy: varchar('performed_by', { length: 255 }),
  
  // Timing
  scheduledAt: timestamp('scheduled_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  nextScheduledAt: timestamp('next_scheduled_at'),
  
  // Status and condition
  isCompleted: boolean('is_completed').default(false).notNull(),
  conditionBefore: assetConditionEnum('condition_before'),
  conditionAfter: assetConditionEnum('condition_after'),
  
  // Documentation
  attachments: jsonb('attachments'), // Store file references as JSON
  
  // Metadata
  createdBy: text('created_by').references(() => user.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    assetIdIdx: index('maintenance_records_asset_id_idx').on(table.assetId),
    typeIdx: index('maintenance_records_type_idx').on(table.type),
    priorityIdx: index('maintenance_records_priority_idx').on(table.priority),
    scheduledAtIdx: index('maintenance_records_scheduled_at_idx').on(table.scheduledAt),
    completedAtIdx: index('maintenance_records_completed_at_idx').on(table.completedAt),
    nextScheduledAtIdx: index('maintenance_records_next_scheduled_at_idx').on(table.nextScheduledAt),
    isCompletedIdx: index('maintenance_records_is_completed_idx').on(table.isCompleted),
    createdByIdx: index('maintenance_records_created_by_idx').on(table.createdBy),
  }
})

// ============================================================================
// AUDIT LOGS - Complete tracking for compliance and security
// ============================================================================

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  
  // Action tracking
  action: auditActionEnum('action').notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'asset', 'user', 'assignment', etc.
  entityId: varchar('entity_id', { length: 255 }).notNull(),
  
  // User and session information
  userId: text('user_id').references(() => user.id),
  userEmail: varchar('user_email', { length: 255 }),
  sessionId: varchar('session_id', { length: 255 }),
  
  // Request details
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 compatible
  userAgent: text('user_agent'),
  
  // Change tracking
  oldValues: jsonb('old_values'), // Previous state as JSON
  newValues: jsonb('new_values'), // New state as JSON
  changedFields: jsonb('changed_fields'), // Array of field names that changed
  
  // Additional context
  description: text('description'),
  metadata: jsonb('metadata'), // Additional context as JSON
  
  // Timestamp
  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => {
  return {
    actionIdx: index('audit_logs_action_idx').on(table.action),
    entityTypeIdx: index('audit_logs_entity_type_idx').on(table.entityType),
    entityIdIdx: index('audit_logs_entity_id_idx').on(table.entityId),
    userIdIdx: index('audit_logs_user_id_idx').on(table.userId),
    timestampIdx: index('audit_logs_timestamp_idx').on(table.timestamp),
    ipAddressIdx: index('audit_logs_ip_address_idx').on(table.ipAddress),
    // Composite index for entity tracking
    entityCompositeIdx: index('audit_logs_entity_composite_idx').on(table.entityType, table.entityId),
  }
})

// ============================================================================
// ADDITIONAL SYSTEM TABLES
// ============================================================================

export const assetCounters = pgTable('asset_counters', {
  id: serial('id').primaryKey(),
  category: assetCategoryEnum('category').notNull().unique(),
  nextNumber: integer('next_number').default(1).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
}, (table) => {
  return {
    categoryIdx: index('asset_counters_category_idx').on(table.category),
  }
})

export const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  building: varchar('building', { length: 100 }).notNull(),
  floor: varchar('floor', { length: 20 }),
  room: varchar('room', { length: 50 }),
  description: text('description'),
  capacity: integer('capacity'), // How many assets can be placed here
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => {
  return {
    buildingIdx: index('locations_building_idx').on(table.building),
    roomIdx: index('locations_room_idx').on(table.room),
    isActiveIdx: index('locations_is_active_idx').on(table.isActive),
    // Composite index for location hierarchy
    locationCompositeIdx: index('locations_composite_idx').on(table.building, table.floor, table.room),
  }
})
