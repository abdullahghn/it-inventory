# IT Asset Inventory Management System

A comprehensive web application for managing IT assets with role-based access, automated workflows, and real-time analytics.

## 🚀 Features

### Core Asset Management
- **Asset Lifecycle Management**: Complete CRUD operations for IT assets
- **Auto-generated Asset Tags**: Unique identifiers (format: IT-CAT-0001)
- **Status Workflow**: In Stock → Deployed → In Repair → Retired
- **Asset Assignment System**: Track assignments with history and audit trails
- **Bulk Operations**: Import/export up to 100 assets with progress tracking

### User Management & Authentication
- **Role-based Access Control**: Super Admin, Admin, Manager, User, Viewer roles
- **Google OAuth Integration**: Secure authentication with Google accounts
- **Department-based Permissions**: Users can only access their department's data
- **Profile Management**: Users can view and edit their profiles

### Advanced Reporting & Analytics
- **Real-time Dashboard**: Live metrics and KPIs with role-based views
- **Interactive Charts**: Asset distribution, utilization rates, and trends using Recharts
- **Warranty Alerts**: Proactive notifications for expiring warranties (30/60/90 days)
- **Export Functionality**: Generate CSV reports for assets, assignments, warranty, utilization, and department data
- **Department Analytics**: Asset utilization by department with permission controls

### Assignment Management
- **Smart Assignment System**: Pre-select assets from asset lists or detail pages
- **Assignment History**: Complete audit trail of all asset movements
- **Return Processing**: Track asset returns with condition assessment
- **Expected Return Dates**: Set and monitor return deadlines

## 📊 Dashboard & Analytics

### Overview Tab
- **Key Metrics Cards**: Total assets, utilization rate, available assets, warranty alerts
- **Recent Activity**: Latest assignments and returns with timestamps
- **Department Overview**: Asset distribution across departments (manager+ only)
- **Quick Stats**: Real-time counters for various asset categories

### Analytics Tab
- **Asset Status Distribution**: Pie chart showing available, assigned, maintenance, retired
- **Category Breakdown**: Asset distribution by category (laptops, desktops, etc.)
- **Condition Overview**: Bar chart of asset conditions (excellent, good, fair, poor)
- **Department Utilization**: Utilization rates by department with interactive tooltips

### Warranty Alerts Tab
- **Critical Alerts**: Assets with warranty expiring in 30 days
- **Warning Alerts**: Assets with warranty expiring in 31-60 days
- **Info Alerts**: Assets with warranty expiring in 61-90 days
- **Actionable Items**: Direct links to asset details and export options

### Reports Tab
- **Report Types**: Assets, Assignments, Warranty, Utilization, Department reports
- **Export Formats**: CSV download with proper formatting and escaping
- **Filtering Options**: Date range, department, category, status, condition filters
- **Real-time Generation**: Server-side report generation with progress indicators

## 🛠 Technology Stack

### Frontend
- **Next.js 15**: App Router with React 18 and TypeScript
- **Tailwind CSS**: Utility-first styling with custom design system
- **Shadcn/ui**: High-quality React components built on Radix UI
- **Recharts**: Interactive charts and data visualizations
- **React Hook Form**: Form handling with Zod validation

### Backend
- **Next.js API Routes**: RESTful API endpoints
- **Server Actions**: Form processing and data mutations
- **Drizzle ORM**: Type-safe database queries with PostgreSQL
- **NextAuth.js v5**: Authentication with Google OAuth
- **Zod**: Runtime type validation for API requests

### Database & Infrastructure
- **PostgreSQL**: Primary database with Drizzle ORM
- **Drizzle Kit**: Database migrations and schema management
- **Role-based Security**: Row-level security and permission checks

## 📈 API Endpoints

### Dashboard Analytics
```
GET /api/reports/dashboard
```
Returns comprehensive dashboard metrics including:
- Asset counts and utilization rates
- Status and category breakdowns
- Warranty expiration alerts
- Recent activity data
- Department-specific metrics

### Report Export
```
POST /api/reports/export
```
Generates downloadable reports with filtering:
- Assets report: Complete inventory with details
- Assignments report: Assignment history and status
- Warranty report: Assets with expiring warranties
- Utilization report: Asset utilization by category
- Department report: Asset distribution by department

## �� Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Google OAuth credentials

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd it-inventory

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/it_inventory"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Database Setup
```bash
# Generate migration
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

## 🎯 Usage Examples

### Creating Asset Assignments
1. Navigate to Assets → Select an asset → Click "Assign Asset"
2. Asset is pre-selected in assignment form
3. Choose user and set assignment details
4. Submit to create assignment with audit trail

### Generating Reports
1. Go to Dashboard → Reports tab
2. Select report type (Assets, Assignments, etc.)
3. Configure filters (date range, department, etc.)
4. Click "Generate Report" to download CSV

### Monitoring Warranty Alerts
1. Dashboard → Warranty Alerts tab
2. View assets grouped by expiration urgency
3. Click "View" to see asset details
4. Export warranty report for action planning

## 🔒 Security Features

### Authentication & Authorization
- **Google OAuth**: Secure login with Google accounts
- **Role-based Access**: Different permissions for different user types
- **Session Management**: Secure session handling with NextAuth.js
- **CSRF Protection**: Built-in protection against cross-site request forgery

### Data Security
- **Row-level Security**: Users can only access their department's data
- **Input Validation**: All inputs validated with Zod schemas
- **SQL Injection Protection**: Parameterized queries with Drizzle ORM
- **XSS Prevention**: React's built-in XSS protection

## 📝 Development Notes

### Deviations from Original PRD
- **Excel Export**: Currently supports CSV only; Excel export planned for future
- **PDF Reports**: Not implemented in initial version
- **Historical Trends**: Placeholder for future implementation
- **Email Notifications**: Warranty alerts shown in UI only

### Performance Optimizations
- **Server-side Rendering**: Dashboard data fetched server-side
- **Caching**: API responses cached appropriately
- **Lazy Loading**: Charts and heavy components loaded on demand
- **Database Indexing**: Optimized queries with proper indexes

### Future Enhancements
- **Real-time Updates**: WebSocket integration for live data
- **Advanced Analytics**: Machine learning insights and predictions
- **Mobile App**: React Native companion app
- **Integration APIs**: Third-party system integrations
- **Audit Logging**: Comprehensive activity logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API documentation

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies** 