import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from './db'
import { user as userTable } from './db/schema'
import { eq } from 'drizzle-orm'

// Debug environment variables
console.log('NextAuth Config Debug:')
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing')
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing')
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing')

// Check if we're in Edge Runtime (middleware) or Node.js runtime
// In Edge Runtime, process.version is undefined and certain Node.js APIs are not available
const isEdgeRuntime = typeof process === 'undefined' || !process.version || typeof process.on !== 'function'

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Temporarily disable database adapter to fix NaN user ID issues
  // adapter: isEdgeRuntime ? undefined : DrizzleAdapter(db),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 60, // 30 minutes in seconds
    updateAge: 5 * 60, // Update session every 5 minutes
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in - fetch user data from database
      if (account && user) {
        try {
          // Don't access database in Edge Runtime
          if (!isEdgeRuntime) {
            const dbUser = await db
              .select({
                id: userTable.id,
                role: userTable.role,
                department: userTable.department,
                employeeId: userTable.employeeId,
                isActive: userTable.isActive,
              })
              .from(userTable)
              .where(eq(userTable.email, user.email || ''))
              .limit(1)
            
            if (dbUser[0]) {
              // Use existing user data
              token.id = dbUser[0].id
              token.role = dbUser[0].role
              token.department = dbUser[0].department
              token.employeeId = dbUser[0].employeeId
              token.isActive = dbUser[0].isActive
            } else {
              // New user - set defaults
              token.id = user.id
              token.role = 'user'
              token.department = null
              token.employeeId = null
              token.isActive = true
            }
          } else {
            // Edge Runtime fallback
            token.id = user.id
            token.role = 'user'
            token.department = null
            token.employeeId = null
            token.isActive = true
          }
        } catch (error) {
          console.error('Error fetching user data in JWT callback:', error)
          // Fallback to defaults
          token.id = user.id
          token.role = 'user'
          token.department = null
          token.employeeId = null
          token.isActive = true
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token) {
        // Add user details from JWT token to session
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.department = token.department as string | null
        session.user.employeeId = token.employeeId as string | null
        session.user.isActive = token.isActive as boolean
      }
      return session
    },
    async signIn({ user, account, profile }) {
      // Allow all Google users - detailed checks can be done after sign-in
      return true
    },
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', {
        userId: user.id,
        email: user.email,
        isNewUser,
        provider: account?.provider
      })
    },
    async signOut() {
      console.log('User signed out')
    },
    async createUser({ user }) {
      // Only execute in Node.js runtime, not Edge Runtime
      if (isEdgeRuntime) return
      
      console.log('New user created:', {
        userId: user.id,
        email: user.email
      })
      
      try {
        // Set default role for new users
        await db
          .update(userTable)
          .set({ 
            role: 'user',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          })
          .where(eq(userTable.id, user.id))
      } catch (error) {
        console.error('Error setting default user role:', error)
      }
    }
  },
  debug: process.env.NODE_ENV === 'development',
})

// ============================================================================
// AUTHENTICATION UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the current session
 */
export async function getCurrentSession() {
  return await auth()
}

/**
 * Get the current user with full details
 */
export async function getCurrentUser() {
  const session = await getCurrentSession()
  if (!session?.user?.id) return null
  
  // Don't query database for temporary user IDs
  if (session.user.id.startsWith('temp_') || (session.user as any).isTemporary) {
    console.log('Skipping database query for temporary user ID:', session.user.id)
    return null
  }
  
  // If we have role information in session, use it (for Edge Runtime compatibility)
  if (session.user.role) {
    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      department: session.user.department,
      employeeId: session.user.employeeId,
      isActive: session.user.isActive,
      image: session.user.image,
      createdAt: null,
      updatedAt: null,
      emailVerified: null,
      jobTitle: null,
      phone: null,
      lastLoginAt: null,
    }
  }
  
  // Don't access database in Edge Runtime
  if (isEdgeRuntime) return null
  
  try {
    const dbUser = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, session.user.id))
      .limit(1)
    
    return dbUser[0] || null
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}

/**
 * Check if user has specific role (with hierarchy)
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return false
  
  const roleHierarchy: Record<string, number> = {
    'viewer': 1,
    'user': 2,
    'manager': 3,
    'admin': 4,
    'super_admin': 5
  }
  
  const userLevel = roleHierarchy[currentUser.role] || 0
  const requiredLevel = roleHierarchy[requiredRole] || 0
  
  return userLevel >= requiredLevel
}

/**
 * Check if user has any of the specified roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return false
  
  return roles.includes(currentUser.role)
}

/**
 * Check if user is in specific department
 */
export async function isInDepartment(department: string): Promise<boolean> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return false
  
  return currentUser.department === department
}

/**
 * Check if user is active
 */
export async function isActiveUser(): Promise<boolean> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return false
  
  return currentUser.isActive
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth() {
  const session = await getCurrentSession()
  if (!session?.user) {
    throw new Error('Authentication required')
  }
  return session
}

/**
 * Require specific role - throws if insufficient permissions
 */
export async function requireRole(requiredRole: string) {
  const session = await requireAuth()
  const hasPermission = await hasRole(requiredRole)
  
  if (!hasPermission) {
    throw new Error(`Role '${requiredRole}' required`)
  }
  
  return session
} 