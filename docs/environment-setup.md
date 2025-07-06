# Environment Variables Setup

This document outlines all the environment variables needed for the IT Inventory System.

## Required Environment Variables

Create a `.env.local` file in your project root with the following variables:

### Database Configuration

```env
# Primary database connection URL
DATABASE_URL="postgresql://username:password@localhost:5432/it_inventory"

# Database connection pool settings (optional - defaults provided)
DB_POOL_MAX=10                    # Maximum number of connections in pool
DB_IDLE_TIMEOUT=20               # Close idle connections after N seconds
DB_CONNECT_TIMEOUT=30            # Connection timeout in seconds
DB_MAX_LIFETIME=1800             # Maximum lifetime of connection in seconds
```

### Authentication Configuration

```env
# NextAuth.js secret for JWT signing and encryption
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-key-here"

# NextAuth.js URL
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth credentials
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### Application Settings

```env
# Environment
NODE_ENV="development"

# Logging
LOG_LEVEL="info"

# Performance monitoring
ENABLE_QUERY_LOGGING=false
SLOW_QUERY_THRESHOLD=1000
```

## Setting Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Configure consent screen
6. Add authorized origins: `http://localhost:3000`
7. Add redirect URIs: `http://localhost:3000/api/auth/callback/google`
8. Copy Client ID and Client Secret to your `.env.local`

## Database Setup

1. Install PostgreSQL 16+
2. Create database:
   ```sql
   CREATE DATABASE it_inventory;
   CREATE USER it_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE it_inventory TO it_user;
   ```
3. Update `DATABASE_URL` in `.env.local`
4. Run migrations:
   ```bash
   npm run db:migrate
   ```

## Security Recommendations

- Use strong passwords for database
- Generate secure NEXTAUTH_SECRET: `openssl rand -base64 32`
- Keep `.env.local` out of version control
- Use different secrets for production

## Production Environment

For production, also configure:

```env
# Production database
DATABASE_URL="postgresql://prod_user:secure_pass@prod_host:5432/it_inventory_prod"

# Production domain
NEXTAUTH_URL="https://your-domain.com"
CORS_ORIGIN="https://your-domain.com"

# Security
FORCE_HTTPS=true
TRUST_PROXY=true
```

## Environment Validation

The application will validate required environment variables on startup and throw descriptive errors if any are missing. 