# IT Inventory Management System

A comprehensive IT asset management system built with Next.js 15, React, TypeScript, PostgreSQL, Drizzle ORM, and NextAuth.js.

## 🚀 Features

### Core Functionality
- **Asset Management**: Complete lifecycle management of IT assets
- **User Management**: Role-based user administration
- **Assignment Tracking**: Asset assignment and return workflows
- **Maintenance Records**: Preventive and corrective maintenance tracking
- **Reporting & Analytics**: Comprehensive reporting dashboard
- **Bulk Import/Export**: CSV/Excel data import and export capabilities
- **Audit Trail**: Complete audit logging for compliance

### Role-Based Access Control
- **Super Admin**: Full system access and configuration
- **Admin**: Asset and user management, assignment oversight
- **Manager**: Department asset oversight, assignment approvals
- **User**: View assigned assets, submit maintenance requests
- **Viewer**: Read-only access to system data

## 🛠 Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Validation**: Zod schema validation
- **Forms**: React Hook Form with Zod resolver
- **State Management**: React hooks and server actions
- **Testing**: Vitest, Playwright
- **Deployment**: Vercel-ready configuration

## 📋 Form Pages & Data Entry

### Asset Management Forms

#### Create New Asset (`/dashboard/assets/new`)
- **Purpose**: Add new assets to the inventory system
- **Features**:
  - Auto-generated asset tags (format: CAT-YYYYMMDD-XXXX)
  - Comprehensive asset details (technical specs, financial info, location)
  - Real-time validation with Zod schemas
  - Conditional field validation (warranty expiry requires purchase date)
  - Role-based access control (admin, manager, super_admin)

#### Edit Asset (`/dashboard/assets/[id]/edit`)
- **Purpose**: Update existing asset information
- **Features**:
  - Pre-populated form with current asset data
  - Validation of asset tag uniqueness
  - Audit trail for all changes
  - Permission checks for editing rights

**Asset Form Fields**:
- Basic Information: Asset tag, name, category, subcategory
- Technical Specs: Serial number, model, manufacturer, status, condition
- Financial Data: Purchase date/price, current value, warranty expiry
- Location: Building, floor, room, desk, location notes
- Metadata: Description, notes

### User Management Forms

#### Create New User (`/dashboard/users/new`)
- **Purpose**: Register new users with role assignments
- **Features**:
  - Email validation and uniqueness checking
  - Role-based permission system
  - Employee ID validation
  - Phone number format validation
  - Department and job title tracking

#### Edit User Profile (`/dashboard/users/[id]/edit`)
- **Purpose**: Update user information and roles
- **Features**:
  - Role permission validation
  - Account status management
  - Audit trail for role changes
  - Prevention of self-deletion

**User Form Fields**:
- Personal Info: Name, email, phone, employee ID
- Professional: Department, job title
- System Access: Role, account status
- Role Descriptions: Clear permission explanations

### Assignment Management Forms

#### Create Assignment (`/dashboard/assignments/new`)
- **Purpose**: Assign assets to users with purpose and return dates
- **Features**:
  - Searchable asset and user selection
  - Real-time availability checking
  - Purpose and return date validation
  - Current assignment warnings
  - Automatic asset status updates

**Assignment Form Features**:
- Asset Search: Filter by tag, name, manufacturer, model
- User Search: Filter by name, email, department
- Assignment Details: Purpose, expected return date, notes
- Validation: Prevents double assignments, validates dates

### Bulk Import System

#### Import Page (`/dashboard/import`)
- **Purpose**: Bulk import data from CSV/Excel files
- **Features**:
  - Multiple entity types (assets, users, assignments)
  - File validation and parsing
  - Progress tracking and error reporting
  - Template downloads
  - Update existing vs. create new options

**Import Capabilities**:
- **Assets**: Complete asset information import
- **Users**: User registration with roles
- **Assignments**: Asset-user assignments with validation
- **Error Handling**: Detailed error reporting with row numbers
- **Validation**: Server-side validation with rollback on errors

## 🔧 Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Google OAuth credentials (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd it-inventory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env.local` file:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/it_inventory"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Database Setup**
   ```bash
   # Generate and run migrations
   npm run db:generate
   npm run db:migrate
   
   # Seed initial data (optional)
   npm run db:seed
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### Database Schema

The system uses a comprehensive PostgreSQL schema with:
- **Users**: Authentication and role management
- **Assets**: Complete asset information and tracking
- **Assignments**: Asset-user assignment history
- **Maintenance**: Maintenance records and scheduling
- **Audit Logs**: Complete audit trail for compliance
- **Locations**: Physical location management

### Validation System

All forms use Zod schemas for validation:

```typescript
// Example: Asset validation schema
export const assetFormSchema = createAssetSchema.extend({
  assetTag: z.string()
    .regex(/^[A-Z]{2,3}-\d{4,}$/, 'Invalid asset tag format'),
  purchasePrice: z.string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid price format'),
  // ... more validation rules
})
```

### API Endpoints

The system provides RESTful API endpoints for all operations:
- `POST /api/assets` - Create asset
- `PUT /api/assets/[id]` - Update asset
- `DELETE /api/assets/[id]` - Delete asset
- `POST /api/users` - Create user
- `POST /api/assignments` - Create assignment
- `POST /api/import` - Bulk import

## 🎨 UI/UX Features

### Modern Design
- Clean, professional interface using shadcn/ui components
- Responsive design for all screen sizes
- Dark/light mode support
- Loading states and error handling
- Toast notifications for user feedback

### Form Enhancements
- Real-time validation with error messages
- Auto-completion and suggestions
- File upload with progress tracking
- Searchable dropdowns and selectors
- Conditional field display

### Data Visualization
- Interactive charts and graphs
- Filterable data tables
- Export capabilities (CSV, Excel)
- Dashboard widgets and metrics

## 🔒 Security Features

### Authentication & Authorization
- Google OAuth integration
- Role-based access control
- Session management
- CSRF protection

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Audit trail for all changes

### API Security
- Rate limiting
- Request validation
- Error handling without data leakage
- Secure file upload validation

## 📊 Reporting & Analytics

### Dashboard Metrics
- Asset utilization rates
- Assignment statistics
- Maintenance schedules
- User activity tracking

### Export Capabilities
- CSV/Excel export for all data
- Custom report generation
- Scheduled report delivery
- Data visualization exports

## 🧪 Testing

### Test Coverage
```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

### Testing Strategy
- Unit tests for validation schemas
- Integration tests for API endpoints
- E2E tests for critical user flows
- Performance testing for bulk operations

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all production environment variables are set:
- Database connection string
- OAuth credentials
- Secret keys
- API endpoints

### Database Migration
```bash
npm run db:migrate:prod
```

## 📝 API Documentation

### Authentication
All API endpoints require authentication via NextAuth.js session.

### Rate Limiting
- 100 requests per minute per user
- Bulk operations: 10 requests per minute

### Error Handling
All endpoints return consistent error responses:
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {}
}
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the audit logs for troubleshooting

---

**Built with ❤️ using modern web technologies** 