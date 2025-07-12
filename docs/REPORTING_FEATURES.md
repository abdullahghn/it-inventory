# Reporting & Analytics Features

This document provides comprehensive information about the reporting and analytics features implemented in the IT Asset Inventory Management System.

## 📊 Dashboard Analytics

### Overview

The dashboard provides real-time analytics and metrics through a tabbed interface with four main sections:

1. **Overview Tab**: Key metrics and recent activity
2. **Analytics Tab**: Interactive charts and visualizations
3. **Warranty Alerts Tab**: Proactive warranty monitoring
4. **Reports Tab**: Export functionality

### API Endpoint: `/api/reports/dashboard`

#### Request Parameters
- `dateRange` (optional): Number of days for activity metrics (default: 30)
- `department` (optional): Filter by specific department (manager+ only)

#### Response Structure
```typescript
{
  success: boolean,
  data: {
    summary: {
      totalAssets: number,
      assignedAssets: number,
      availableAssets: number,
      utilizationRate: number,
      dateRange: number
    },
    statusBreakdown: Array<{
      status: string,
      count: number,
      percentage: number
    }>,
    categoryBreakdown: Array<{
      category: string,
      count: number,
      percentage: number
    }>,
    conditionBreakdown: Array<{
      condition: string,
      count: number,
      percentage: number
    }>,
    warrantyAlerts: {
      expiring30Days: Array<Asset>,
      expiring60Days: Array<Asset>,
      expiring90Days: Array<Asset>,
      totalExpiring30Days: number,
      totalExpiring60Days: number,
      totalExpiring90Days: number
    },
    recentActivity: {
      assignments: Array<Assignment>,
      returns: Array<Assignment>
    },
    departmentMetrics: Array<{
      department: string,
      assetCount: number,
      assignedCount: number
    }>,
    metadata: {
      generatedAt: string,
      dateRange: number,
      department: string,
      userPermissions: {
        canViewAllDepartments: boolean,
        userDepartment: string
      }
    }
  }
}
```

## 📈 Interactive Charts

### Chart Components

#### DashboardCharts Component
Located at: `components/dashboard/DashboardCharts.tsx`

**Features:**
- **Pie Charts**: Asset status and category distribution
- **Bar Charts**: Asset condition and department utilization
- **Responsive Design**: Adapts to different screen sizes
- **Interactive Tooltips**: Detailed information on hover
- **Color-coded Data**: Consistent color scheme across charts

**Chart Types:**
1. **Asset Status Distribution**: Pie chart showing available, assigned, maintenance, retired
2. **Asset Category Distribution**: Pie chart of laptops, desktops, peripherals, etc.
3. **Asset Condition Overview**: Bar chart of excellent, good, fair, poor conditions
4. **Department Utilization**: Bar chart showing utilization rates by department

#### Color Palette
```typescript
const COLORS = {
  status: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'],
  category: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
  condition: ['#10b981', '#3b82f6', '#f59e0b', '#f97316', '#ef4444'],
  department: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316']
}
```

## 🚨 Warranty Alerts System

### Overview
Proactive monitoring system for assets with expiring warranties, categorized by urgency levels.

### Alert Levels
1. **Critical (≤30 days)**: Red alerts requiring immediate attention
2. **Warning (31-60 days)**: Yellow alerts for planning purposes
3. **Info (61-90 days)**: Blue alerts for awareness

### WarrantyAlerts Component
Located at: `components/dashboard/WarrantyAlerts.tsx`

**Features:**
- **Summary Cards**: Quick overview of alert counts by urgency
- **Detailed Lists**: Asset details with days until expiry
- **Direct Links**: Quick access to asset details
- **Export Options**: Generate warranty reports
- **Empty State**: Friendly message when no alerts exist

### Alert Data Structure
```typescript
interface WarrantyAlert {
  id: number,
  assetTag: string,
  name: string,
  warrantyExpiry: string,
  category: string
}
```

## 📋 Report Export System

### API Endpoint: `/api/reports/export`

#### Request Body
```typescript
{
  reportType: 'assets' | 'assignments' | 'warranty' | 'utilization' | 'department',
  format: 'csv' | 'excel' | 'pdf',
  filters: {
    department?: string,
    category?: string,
    status?: string,
    condition?: string,
    dateRange?: number
  }
}
```

#### Report Types

##### 1. Assets Report
**Content:**
- Asset tag, name, category, status, condition
- Manufacturer, model, serial number
- Purchase date, price, warranty expiry
- Location (building, floor, room)
- Assignment details (if assigned)
- Creation date

**Use Cases:**
- Complete inventory audit
- Asset valuation reports
- Insurance documentation
- Compliance reporting

##### 2. Assignments Report
**Content:**
- Assignment ID, asset details
- Assigned user and assigner
- Assignment and return dates
- Expected return date
- Return condition and purpose
- Assignment status

**Use Cases:**
- Assignment history analysis
- User accountability tracking
- Return compliance monitoring
- Assignment pattern analysis

##### 3. Warranty Report
**Content:**
- Asset details and warranty expiry
- Days until expiry calculation
- Alert level classification
- Current assignment status

**Use Cases:**
- Warranty renewal planning
- Budget forecasting
- Replacement scheduling
- Vendor management

##### 4. Utilization Report
**Content:**
- Asset category breakdown
- Status distribution (assigned, available, maintenance, retired)
- Utilization rate calculations
- Department-specific metrics

**Use Cases:**
- Asset efficiency analysis
- Capacity planning
- Budget optimization
- Performance metrics

##### 5. Department Report
**Content:**
- Department-wise asset distribution
- Assignment counts and utilization rates
- Average assets per user
- Department performance metrics

**Use Cases:**
- Department resource allocation
- Cross-department comparisons
- Budget distribution analysis
- Resource planning

### ReportsExport Component
Located at: `components/dashboard/ReportsExport.tsx`

**Features:**
- **Visual Report Selection**: Icon-based report type selection
- **Filter Configuration**: Comprehensive filtering options
- **Format Selection**: Export format choice (CSV currently supported)
- **Real-time Generation**: Server-side report generation
- **Download Management**: Automatic file download with proper naming

## 🔧 Technical Implementation

### Dependencies
```json
{
  "recharts": "^2.8.0",
  "@radix-ui/react-tabs": "^1.0.4"
}
```

### Database Queries
The reporting system uses optimized SQL queries with:
- **Aggregation Functions**: COUNT, SUM, AVG for metrics
- **Window Functions**: For ranking and cumulative calculations
- **Date Functions**: For warranty expiry calculations
- **Conditional Logic**: CASE statements for status-based counting

### Performance Optimizations
1. **Server-side Rendering**: Dashboard data fetched server-side
2. **Caching**: API responses cached appropriately
3. **Lazy Loading**: Charts loaded on demand
4. **Database Indexing**: Optimized queries with proper indexes
5. **Pagination**: Large datasets handled with pagination

### Security Considerations
1. **Role-based Access**: Users can only see their department's data
2. **Input Validation**: All parameters validated with Zod
3. **SQL Injection Protection**: Parameterized queries with Drizzle ORM
4. **File Download Security**: Proper content disposition headers

## 🎯 Usage Examples

### Dashboard Navigation
```typescript
// Navigate to different dashboard tabs
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="analytics">Analytics</TabsTrigger>
    <TabsTrigger value="warranty">Warranty Alerts</TabsTrigger>
    <TabsTrigger value="reports">Reports</TabsTrigger>
  </TabsList>
</Tabs>
```

### Chart Integration
```typescript
// Use charts in components
<DashboardCharts 
  statusBreakdown={dashboardData.statusBreakdown}
  categoryBreakdown={dashboardData.categoryBreakdown}
  conditionBreakdown={dashboardData.conditionBreakdown}
  departmentMetrics={dashboardData.departmentMetrics}
/>
```

### Report Generation
```typescript
// Generate and download report
const generateReport = async () => {
  const response = await fetch('/api/reports/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reportType: 'assets',
      format: 'csv',
      filters: { dateRange: 30 }
    })
  });
  
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'assets-report.csv';
  a.click();
};
```

## 🚀 Future Enhancements

### Planned Features
1. **Excel Export**: Full Excel file generation with formatting
2. **PDF Reports**: Professional PDF report generation
3. **Historical Trends**: Time-series data and trend analysis
4. **Email Notifications**: Automated warranty alert emails
5. **Scheduled Reports**: Automated report generation and delivery
6. **Advanced Analytics**: Machine learning insights and predictions

### Performance Improvements
1. **Real-time Updates**: WebSocket integration for live data
2. **Caching Strategy**: Redis-based caching for better performance
3. **Background Processing**: Queue-based report generation
4. **Data Compression**: Optimized data transfer for large reports

## 📝 Troubleshooting

### Common Issues

#### Charts Not Rendering
- Check if Recharts is properly installed
- Verify data structure matches expected format
- Ensure container has proper dimensions

#### Report Generation Fails
- Check user permissions for department access
- Verify database connection and query performance
- Review server logs for detailed error messages

#### Warranty Alerts Missing
- Confirm warranty expiry dates are set in asset records
- Check date range calculations
- Verify user has access to view warranty data

### Debug Mode
Enable debug logging by setting environment variable:
```env
DEBUG_REPORTS=true
```

This will provide detailed logging for report generation and data fetching operations.

---

**Note**: This documentation covers the initial implementation of reporting features. Additional features and improvements will be documented as they are developed. 