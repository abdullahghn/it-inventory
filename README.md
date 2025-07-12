# IT Inventory Management System

A comprehensive web application for IT asset lifecycle management with role-based access, automated workflows, and real-time analytics.

## 🚀 Features

### Core Features
- **Asset Management**: Complete CRUD operations with auto-generated asset tags
- **User Management**: Role-based access control with 5 distinct user roles
- **Assignment Tracking**: Comprehensive asset assignment and return workflows
- **Maintenance Records**: Scheduled and ad-hoc maintenance tracking
- **Reporting & Analytics**: Real-time dashboards with export capabilities
- **Audit Trail**: Complete tracking for compliance and security

### 🔍 Advanced Search & Filtering (NEW)
- **Global Search**: Cross-entity search with auto-complete and real-time suggestions
- **Advanced Filters**: Multi-criteria filtering for assets and users
- **Saved Searches**: Save and reuse complex filter combinations
- **Search Persistence**: Filters and search states persist across sessions
- **Real-time Search**: Debounced search with instant results
- **Search History**: Recent searches and popular terms

#### Search Features Details:
- **Global Search Component**: Search across assets, users, and assignments simultaneously
- **Auto-complete**: Smart suggestions based on search history and popular terms
- **Advanced Asset Filters**: Category, status, condition, location, warranty, price range
- **Advanced User Filters**: Role, department, activity status, assignment history
- **Saved Filter Management**: Create, edit, delete, and set default filters
- **Search Preferences**: Customizable debounce delay, default views, auto-save settings
- **Mobile Responsive**: Optimized search experience across all devices

## 🛠 Technology Stack

- **Framework**: Next.js 15 (App Router) + React 18 + TypeScript
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Authentication**: NextAuth.js v5 + Google OAuth
- **Styling**: Tailwind CSS + Shadcn/ui components
- **State Management**: React Context + Custom hooks
- **Validation**: Zod schema validation
- **Testing**: Vitest + React Testing Library

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd it-inventory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/it_inventory"
   
   # Authentication
   NEXTAUTH_SECRET="your-secret-key"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Set up the database**
   ```bash
   # Generate and run migrations
   npm run db:generate
   npm run db:migrate
   
   # Or push schema directly (development)
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run test` - Run tests
- `npm run db:studio` - Open Drizzle Studio

### Project Structure
```
it-inventory/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard pages
│   └── auth/              # Authentication pages
├── components/            # React components
│   ├── ui/               # Shadcn/ui components
│   ├── search/           # Search and filter components
│   ├── forms/            # Form components
│   └── dashboard/        # Dashboard-specific components
├── contexts/             # React contexts
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
│   ├── db/              # Database schema and utilities
│   └── auth.ts          # Authentication configuration
└── types/               # TypeScript type definitions
```

## 🔍 Search & Filtering System

### Global Search
The global search component provides cross-entity search functionality:

```tsx
import { GlobalSearch } from '@/components/search/GlobalSearch'

<GlobalSearch 
  placeholder="Search assets, users, assignments..."
  showSuggestions={true}
  maxResults={8}
/>
```

**Features:**
- Real-time search across assets, users, and assignments
- Auto-complete with recent searches and popular terms
- Keyboard navigation (arrow keys, enter, escape)
- Click-outside to close
- Search history persistence

### Advanced Filters

#### Asset Filters
```tsx
import { AdvancedAssetFilters } from '@/components/search/AdvancedAssetFilters'

<AdvancedAssetFilters 
  onFiltersChange={(filters) => {
    // Handle filter changes
  }}
  showSavedFilters={true}
/>
```

**Available Filters:**
- **Search**: Name, tag, serial number, manufacturer, model
- **Category**: Laptop, desktop, monitor, printer, etc.
- **Status**: Available, assigned, maintenance, repair, retired
- **Condition**: New, excellent, good, fair, poor, damaged
- **Location**: Building, floor, room
- **Assignment**: Assigned to specific user
- **Warranty**: Expiring soon, date range
- **Purchase**: Date range, price range
- **Switches**: Assigned assets only, warranty expiring

#### User Filters
```tsx
import { AdvancedUserFilters } from '@/components/search/AdvancedUserFilters'

<AdvancedUserFilters 
  onFiltersChange={(filters) => {
    // Handle filter changes
  }}
  showSavedFilters={true}
/>
```

**Available Filters:**
- **Search**: Name, email, employee ID, department
- **Role**: Super admin, admin, manager, user, viewer
- **Department**: IT, HR, Finance, Marketing, etc.
- **Status**: Active/inactive users
- **Assignment**: Users with/without asset assignments
- **Activity**: Last login date range, created date range

### Search Persistence

The system automatically persists search states and preferences:

```tsx
import { useEntitySearch, useSavedSearches } from '@/contexts/SearchContext'

// Use entity-specific search
const { currentSearch, updateSearch, clearSearch } = useEntitySearch('assets')

// Use saved searches
const { savedSearches, saveSearch, deleteSearch } = useSavedSearches('assets')
```

**Persistence Features:**
- Current search state per entity type
- Saved filter combinations with names
- Recent search terms (last 10)
- Search preferences (debounce delay, default view)
- Cross-session persistence using localStorage

### Search Hooks

#### useDebounce Hook
```tsx
import { useDebounce } from '@/hooks/use-debounce'

const debouncedValue = useDebounce(value, 300)
```

#### useDebouncedSearch Hook
```tsx
import { useDebouncedSearch } from '@/hooks/use-debounce'

const { debouncedSearchTerm, isSearching } = useDebouncedSearch(searchTerm, 300)
```

## 🔐 Authentication & Authorization

### User Roles
- **Super Admin**: Full system access
- **Admin**: System configuration and user management
- **Manager**: Department oversight and approval workflows
- **User**: Personal asset tracking and requests
- **Viewer**: Read-only access to assigned assets

### Role-Based Access
- Asset management permissions
- User management restrictions
- Department-specific data access
- Report generation permissions

## 📊 Reporting & Analytics

### Dashboard Metrics
- Total assets by status
- Utilization rates
- Warranty expiration alerts
- Recent activity summary
- Department-wise breakdown

### Export Capabilities
- CSV export for all reports
- Filtered data export
- Custom date ranges
- Role-based export permissions

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# Test with UI
npm run test:ui

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Component and utility function tests
- **Integration Tests**: API route and database operation tests
- **E2E Tests**: Full user workflow testing

## 🚀 Deployment

### Production Build
```bash
npm run build
npm run start
```

### Environment Setup
- Configure production database
- Set up environment variables
- Configure authentication providers
- Set up monitoring and logging

## 📝 API Documentation

### Asset Endpoints
- `GET /api/assets` - List assets with filtering
- `POST /api/assets` - Create new asset
- `GET /api/assets/[id]` - Get asset details
- `PUT /api/assets/[id]` - Update asset
- `DELETE /api/assets/[id]` - Delete asset

### User Endpoints
- `GET /api/users` - List users with filtering
- `POST /api/users` - Create new user
- `GET /api/users/[id]` - Get user details
- `PUT /api/users/[id]` - Update user

### Assignment Endpoints
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/[id]` - Update assignment

### Report Endpoints
- `GET /api/reports/dashboard` - Dashboard metrics
- `POST /api/reports/export` - Export reports

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting guide

---

**Built with ❤️ using Next.js, React, and TypeScript** 