# IT Inventory System

A comprehensive IT asset management web application built with Next.js 15, TypeScript, and modern web technologies.

## 🚀 Features

- **Asset Management**: Track IT assets with detailed information including serial numbers, purchase dates, warranties, and maintenance records
- **User Management**: Manage system users with role-based access control
- **Asset Assignment**: Assign and track assets to users with history and notes
- **Maintenance Tracking**: Schedule and record maintenance activities
- **Reporting**: Generate reports on asset utilization, user assignments, and maintenance schedules
- **Authentication**: Secure authentication with Google OAuth via NextAuth.js
- **Modern UI**: Beautiful and responsive interface built with Tailwind CSS and Shadcn/ui

## 🛠 Technology Stack

### Core Technologies
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS 4.0** - Utility-first CSS framework

### UI Components
- **Shadcn/ui** - Reusable UI components
- **Radix UI** - Unstyled, accessible UI primitives
- **Lucide React** - Beautiful icon library

### Database & ORM
- **Drizzle ORM** - Type-safe database toolkit
- **PostgreSQL 16** - Primary database

### Authentication
- **NextAuth.js v5** - Authentication for Next.js
- **Google OAuth** - Social authentication provider

### State Management
- **Zustand** - Client-side state management
- **React Query** - Server state management and caching

### Validation
- **Zod** - Schema validation library

### Testing
- **Vitest** - Unit testing framework
- **React Testing Library** - React component testing
- **Playwright** - End-to-end testing

## 📁 Project Structure

```
it-inventory/
├── app/                      # Next.js App Router
│   ├── (dashboard)/         # Dashboard routes group
│   │   ├── assets/          # Asset management pages
│   │   ├── users/           # User management pages
│   │   └── reports/         # Reporting pages
│   ├── api/                 # API routes
│   └── auth/                # Authentication pages
├── components/              # Reusable UI components
│   ├── ui/                  # Base UI components (Shadcn/ui)
│   ├── forms/               # Form components
│   ├── tables/              # Data table components
│   └── dashboard/           # Dashboard-specific components
├── lib/                     # Utility libraries
│   ├── db/                  # Database configuration and schema
│   ├── auth.ts              # NextAuth configuration
│   ├── validations.ts       # Zod validation schemas
│   └── utils.ts             # Utility functions
├── actions/                 # Server actions
├── types/                   # TypeScript type definitions
└── tests/                   # Test files
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 16
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

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in the required environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/it_inventory"
   
   # NextAuth.js
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Set up the database**
   ```bash
   # Generate database schema
   npm run db:generate
   
   # Run migrations
   npm run db:migrate
   
   # Or push schema changes directly (for development)
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server

### Database
- `npm run db:generate` - Generate Drizzle migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:push` - Push schema changes to database
- `npm run db:studio` - Open Drizzle Studio (database GUI)

### Code Quality
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

### Testing
- `npm run test` - Run unit tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:e2e:ui` - Run E2E tests with UI

## 🏗 Database Schema

The application uses PostgreSQL with the following main tables:

- **users** - System users and authentication
- **assets** - IT assets and equipment
- **asset_assignments** - Asset-to-user assignments
- **maintenance_records** - Maintenance and service history
- **accounts**, **sessions**, **verification_tokens** - NextAuth.js tables

## 🔐 Authentication

The application uses NextAuth.js v5 with Google OAuth for authentication. Users can sign in with their Google accounts, and the system will create a user record in the database.

## 🎨 UI Components

The application uses Shadcn/ui components built on top of Radix UI for accessibility and Tailwind CSS for styling. All components are fully customizable and follow modern design principles.

## 📊 Features Overview

### Asset Management
- Add, edit, and delete IT assets
- Track serial numbers, purchase information, and warranties
- Monitor asset status (available, assigned, maintenance, retired)
- Upload and manage asset images

### User Management
- Manage system users and their roles
- Department-based organization
- User activity tracking

### Assignment Tracking
- Assign assets to users
- Track assignment history
- Manage asset returns with notes

### Maintenance Management
- Schedule preventive maintenance
- Record corrective maintenance
- Track maintenance costs and history

### Reporting
- Asset inventory summaries
- User assignment reports
- Maintenance schedules and history
- Department-wise asset distribution

## 🧪 Testing

The project includes comprehensive testing setup:

- **Unit Tests**: Vitest + React Testing Library
- **E2E Tests**: Playwright
- **Type Safety**: TypeScript strict mode

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For support, please open an issue in the GitHub repository or contact the development team. 