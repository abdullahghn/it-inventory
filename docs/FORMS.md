# Form Pages Documentation

This document provides comprehensive information about all form pages in the IT Inventory Management System, including setup, validation, and usage instructions.

## 📋 Table of Contents

1. [Asset Forms](#asset-forms)
2. [User Forms](#user-forms)
3. [Assignment Forms](#assignment-forms)
4. [Bulk Import Forms](#bulk-import-forms)
5. [Validation System](#validation-system)
6. [Form Components](#form-components)
7. [API Integration](#api-integration)
8. [Error Handling](#error-handling)
9. [Setup Instructions](#setup-instructions)

## 🖥️ Asset Forms

### Create New Asset (`/dashboard/assets/new`)

**Purpose**: Add new assets to the inventory system with comprehensive details.

**Access Control**: 
- Super Admin ✅
- Admin ✅
- Manager ✅
- User ❌
- Viewer ❌

**Features**:
- Auto-generated asset tags (format: `CAT-YYYYMMDD-XXXX`)
- Real-time validation with immediate feedback
- Conditional field validation
- File upload for specifications
- Location tracking with structured fields

**Form Fields**:

#### Basic Information
```typescript
{
  assetTag: string;        // Auto-generated or manual entry
  name: string;           // Asset name/description
  category: AssetCategory; // laptop, desktop, monitor, etc.
  subcategory: string;    // Optional subcategory
}
```

#### Technical Specifications
```typescript
{
  serialNumber: string;   // Unique serial number
  model: string;         // Model name
  manufacturer: string;  // Manufacturer name
  status: AssetStatus;   // available, assigned, maintenance, etc.
  condition: AssetCondition; // new, excellent, good, fair, poor, damaged
}
```

#### Financial Information
```typescript
{
  purchaseDate: Date;     // Date of purchase
  purchasePrice: number;  // Purchase price in SAR
  currentValue: number;   // Current market value
  depreciationRate: number; // Annual depreciation percentage
  warrantyExpiry: Date;   // Warranty expiration date
}
```

#### Location Information
```typescript
{
  building: string;       // Building name/number
  floor: string;         // Floor level
  room: string;          // Room number/name
  desk: string;          // Desk/station identifier
  locationNotes: string; // Additional location details
}
```

**Validation Rules**:
- Asset tag must follow format: `[A-Z]{2,3}-\d{4,}`
- Purchase price must be positive number with max 2 decimal places
- Warranty expiry must be after purchase date
- Serial number must be unique (if provided)

### Edit Asset (`/dashboard/assets/[id]/edit`)

**Purpose**: Update existing asset information with audit trail.

**Features**:
- Pre-populated form with current data
- Change tracking for audit purposes
- Permission validation
- Asset status management

**Additional Validation**:
- Asset tag uniqueness check
- Assignment status consideration
- Historical data preservation

## 👥 User Forms

### Create New User (`/dashboard/users/new`)

**Purpose**: Register new users with role-based permissions.

**Access Control**:
- Super Admin ✅
- Admin ✅
- Manager ❌
- User ❌
- Viewer ❌

**Features**:
- Email validation and uniqueness
- Role-based permission system
- Employee ID validation
- Phone number formatting
- Department assignment

**Form Fields**:

#### Personal Information
```typescript
{
  name: string;           // Full name
  email: string;         // Email address (unique)
  phone: string;         // Phone number
  employeeId: string;    // Employee identifier
}
```

#### Professional Information
```typescript
{
  department: string;    // Department name
  jobTitle: string;     // Job title/position
}
```

#### System Access
```typescript
{
  role: UserRole;        // super_admin, admin, manager, user, viewer
  isActive: boolean;     // Account status
}
```

**Validation Rules**:
- Email must be valid and unique
- Phone number format: `+966 50 123 4567`
- Employee ID format: `[A-Z0-9]{3,10}`
- Name must be 2-255 characters, letters only

### Edit User Profile (`/dashboard/users/[id]/edit`)

**Purpose**: Update user information and role assignments.

**Features**:
- Role permission validation
- Account status management
- Audit trail for changes
- Self-edit prevention

## 📦 Assignment Forms

### Create Assignment (`/dashboard/assignments/new`)

**Purpose**: Assign assets to users with purpose and return dates.

**Access Control**:
- Super Admin ✅
- Admin ✅
- Manager ✅
- User ❌
- Viewer ❌

**Features**:
- Searchable asset and user selection
- Real-time availability checking
- Purpose and return date validation
- Current assignment warnings

**Form Fields**:

#### Asset Selection
```typescript
{
  assetId: number;       // Selected asset ID
  // Auto-populated from selection:
  assetTag: string;      // Asset tag for display
  assetName: string;     // Asset name for display
  assetStatus: string;   // Current asset status
}
```

#### User Selection
```typescript
{
  userId: string;        // Selected user ID
  // Auto-populated from selection:
  userName: string;      // User name for display
  userEmail: string;     // User email for display
  userDepartment: string; // User department
}
```

#### Assignment Details
```typescript
{
  purpose: string;       // Assignment purpose (min 10 chars)
  expectedReturnAt: Date; // Expected return date
  notes: string;         // Additional notes (max 1000 chars)
}
```

**Search Features**:
- Asset search by tag, name, manufacturer, model
- User search by name, email, department
- Real-time filtering and results
- Availability status indicators

**Validation Rules**:
- Asset must be available for assignment
- User must be active
- Purpose must be at least 10 characters
- Expected return date must be in the future

## 📥 Bulk Import Forms

### Import Page (`/dashboard/import`)

**Purpose**: Bulk import data from CSV/Excel files with validation and error reporting.

**Access Control**:
- Super Admin ✅
- Admin ✅
- Manager ❌
- User ❌
- Viewer ❌

**Features**:
- Multiple entity type support
- File validation and parsing
- Progress tracking
- Error reporting with row details
- Template downloads

**Supported Entity Types**:

#### Asset Import
```csv
assetTag,name,category,subcategory,serialNumber,model,manufacturer,status,condition,purchaseDate,purchasePrice,warrantyExpiry,building,floor,room,desk,description,notes
IT-0001,Dell Latitude 5520,laptop,business,SN123456789,Latitude 5520,Dell,available,good,2024-01-15,3500.00,2027-01-15,Main Building,2nd,201,Desk A1,High-performance business laptop,Assigned to IT department
```

#### User Import
```csv
name,email,department,jobTitle,employeeId,phone,role,isActive
John Doe,john.doe@company.com,IT,Software Engineer,EMP001,+966501234567,user,true
```

#### Assignment Import
```csv
assetTag,userEmail,purpose,expectedReturnAt,notes
IT-0001,john.doe@company.com,Work from home setup,2024-12-31,WFH assignment for remote work
```

**Import Configuration**:
- File type: CSV, Excel (.xlsx, .xls)
- Maximum file size: 10MB
- Delimiters: Comma, semicolon, tab
- Headers: Optional first row
- Update existing: Toggle for updating vs. creating

**Error Handling**:
- Row-by-row validation
- Detailed error messages with row numbers
- Skip error rows option
- Rollback on critical errors

## ✅ Validation System

### Zod Schema Validation

All forms use Zod schemas for comprehensive validation:

```typescript
// Asset validation example
export const assetFormSchema = createAssetSchema.extend({
  assetTag: z.string()
    .min(1, 'Asset tag is required')
    .max(50, 'Asset tag must be 50 characters or less')
    .regex(/^[A-Z]{2,3}-\d{4,}$/, 'Asset tag must follow format: IT-0001'),
  
  purchasePrice: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Price must be a valid number with up to 2 decimal places')
    .optional()
    .nullable(),
  
  warrantyExpiry: z.coerce.date()
    .min(new Date(), 'Warranty expiry must be in the future')
    .optional()
    .nullable(),
}).refine((data) => {
  // Conditional validation
  if (data.warrantyExpiry && !data.purchaseDate) {
    return false
  }
  return true
}, {
  message: 'Purchase date is required when warranty expiry is set',
  path: ['purchaseDate']
})
```

### Client-Side Validation

- Real-time validation with React Hook Form
- Immediate error feedback
- Field-level validation
- Form-level validation

### Server-Side Validation

- Duplicate checking
- Business rule validation
- Database constraint validation
- Security validation

## 🧩 Form Components

### Reusable Components

#### FormField Component
```typescript
interface FormFieldProps {
  label: string;
  name: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  validation?: any;
  options?: Array<{ value: string; label: string }>;
}
```

#### SearchableSelect Component
```typescript
interface SearchableSelectProps {
  label: string;
  placeholder: string;
  data: Array<any>;
  searchFields: string[];
  onSelect: (item: any) => void;
  displayField: string;
  valueField: string;
}
```

### Form Layout

All forms follow a consistent layout pattern:
1. **Header**: Title, description, loading state
2. **Sections**: Grouped fields with separators
3. **Validation**: Real-time error display
4. **Actions**: Submit, cancel, secondary actions

## 🔌 API Integration

### Server Actions

All form submissions use Next.js server actions for type-safe API calls:

```typescript
// Example: Asset creation
export async function createAsset(data: any) {
  'use server'
  
  try {
    // Validate input
    const validatedData = createAssetSchema.parse(data)
    
    // Check permissions
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      throw new Error('Unauthorized')
    }
    
    // Database operation
    const [newAsset] = await db.insert(assets).values(assetData).returning()
    
    // Audit logging
    await logAuditTrail({...})
    
    // Cache invalidation
    revalidatePath('/dashboard/assets')
    
    return newAsset
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create asset')
  }
}
```

### Error Handling

- Consistent error response format
- User-friendly error messages
- Detailed logging for debugging
- Graceful degradation

## 🚨 Error Handling

### Form Error Types

1. **Validation Errors**: Field-level validation failures
2. **Business Logic Errors**: Duplicate entries, permission issues
3. **System Errors**: Database connection, network issues
4. **User Errors**: Invalid file formats, missing data

### Error Display

```typescript
// Field-level errors
{form.formState.errors.fieldName && (
  <p className="text-sm text-red-500">
    {form.formState.errors.fieldName.message}
  </p>
)}

// Form-level errors
{error && (
  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
    <p className="text-red-800">{error}</p>
  </div>
)}
```

### Error Recovery

- Form state preservation on error
- Retry mechanisms for network issues
- Clear error messages with resolution steps
- Fallback options for critical failures

## 🛠️ Setup Instructions

### Prerequisites

1. **Database Setup**
   ```bash
   npm run db:generate
   npm run db:migrate
   ```

2. **Environment Variables**
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_SECRET="..."
   GOOGLE_CLIENT_ID="..."
   GOOGLE_CLIENT_SECRET="..."
   ```

3. **Dependencies**
   ```bash
   npm install
   ```

### Form-Specific Setup

1. **Validation Schemas**
   - Ensure all Zod schemas are properly configured
   - Test validation rules with sample data
   - Verify error messages are user-friendly

2. **API Endpoints**
   - Test all server actions
   - Verify permission checks
   - Ensure audit logging is working

3. **File Upload**
   - Configure file size limits
   - Set up file type validation
   - Test bulk import functionality

### Testing Forms

```bash
# Run form-specific tests
npm run test:forms

# Run E2E tests for critical flows
npm run test:e2e:forms

# Test validation schemas
npm run test:validation
```

### Performance Optimization

1. **Form Loading**
   - Lazy load form components
   - Optimize validation schemas
   - Use debounced search inputs

2. **Data Fetching**
   - Implement proper caching
   - Use optimistic updates
   - Handle loading states

3. **File Processing**
   - Stream large file uploads
   - Process imports in background
   - Implement progress tracking

## 📚 Additional Resources

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Validation Documentation](https://zod.dev/)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions)
- [shadcn/ui Components](https://ui.shadcn.com/)

---

**For technical support or questions about form implementation, please refer to the main README or create an issue in the repository.** 