import { db } from '../lib/db/index'
import { user as userTable } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

const args = process.argv.slice(2)
const command = args[0]

async function getCurrentUser(email: string) {
  try {
    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
        department: userTable.department,
        employeeId: userTable.employeeId,
        isActive: userTable.isActive,
        createdAt: userTable.createdAt,
      })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1)
    
    return users[0] || null
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

async function updateUserRole(email: string, newRole: string) {
  try {
    const result = await db
      .update(userTable)
      .set({ 
        role: newRole as any,
        updatedAt: new Date()
      })
      .where(eq(userTable.email, email))
      .returning({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
      })
    
    return result[0] || null
  } catch (error) {
    console.error('Error updating user role:', error)
    return null
  }
}

async function listAllUsers() {
  try {
    const users = await db
      .select({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
        department: userTable.department,
        isActive: userTable.isActive,
      })
      .from(userTable)
      .orderBy(userTable.role, userTable.name)
    
    return users
  } catch (error) {
    console.error('Error fetching users:', error)
    return []
  }
}

async function main() {
  console.log('🔧 IT Inventory - User Management Utility\n')

  if (command === 'check') {
    const email = args[1]
    if (!email) {
      console.log('Usage: npx tsx scripts/manage-users.ts check <email>')
      process.exit(1)
    }

    console.log(`🔍 Checking user: ${email}`)
    const user = await getCurrentUser(email)
    if (user) {
      console.log('\n✅ User found:')
      console.table(user)
    } else {
      console.log('\n❌ User not found')
    }
  }
  
  else if (command === 'promote') {
    const email = args[1]
    const role = args[2]
    
    if (!email || !role) {
      console.log('Usage: npx tsx scripts/manage-users.ts promote <email> <role>')
      console.log('Available roles: viewer, user, manager, admin, super_admin')
      process.exit(1)
    }

    const validRoles = ['viewer', 'user', 'manager', 'admin', 'super_admin']
    if (!validRoles.includes(role)) {
      console.log(`❌ Invalid role. Available roles: ${validRoles.join(', ')}`)
      process.exit(1)
    }

    console.log(`🚀 Promoting ${email} to ${role}...`)
    const updatedUser = await updateUserRole(email, role)
    if (updatedUser) {
      console.log('\n✅ User role updated successfully:')
      console.table(updatedUser)
    } else {
      console.log('\n❌ Failed to update user role')
    }
  }
  
  else if (command === 'list') {
    console.log('📋 All users in the system:')
    const users = await listAllUsers()
    if (users.length > 0) {
      console.table(users)
    } else {
      console.log('No users found')
    }
  }
  
  else {
    console.log('Available commands:')
    console.log('  check <email>        - Check user details and current role')
    console.log('  promote <email> <role> - Update user role')
    console.log('  list                 - List all users')
    console.log('')
    console.log('Examples:')
    console.log('  npx tsx scripts/manage-users.ts check abdullah.arshad@coastline-fm.com')
    console.log('  npx tsx scripts/manage-users.ts promote abdullah.arshad@coastline-fm.com super_admin')
    console.log('  npx tsx scripts/manage-users.ts list')
  }

  process.exit(0)
}

main().catch(console.error) 