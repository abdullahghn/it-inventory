'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { requireRole, getCurrentUser } from '@/lib/auth'

export async function createUser(formData: FormData) {
  try {
    // Check permissions - only admin and above can create users
    await requireRole('admin')
    
    const data = {
      id: crypto.randomUUID(), // Generate UUID for user ID
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    }

    // Basic validation - just check required fields
    if (!data.name || !data.email) {
      throw new Error('Name and email are required')
    }

    await db.insert(user).values(data)

    revalidatePath('/dashboard/users')
  } catch (error) {
    console.error('Failed to create user:', error)
    throw new Error('Failed to create user')
  }
  
  // Move redirect outside try-catch to prevent catching the Next.js redirect error
  redirect('/dashboard/users')
}

export async function updateUser(id: string, formData: FormData) {
  try {
    // Check permissions - users can edit their own profile, managers+ can edit others
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      throw new Error('Authentication required')
    }
    
    const isOwnProfile = currentUser.id === id
    if (!isOwnProfile) {
      // Editing someone else's profile requires manager+ permissions
      await requireRole('manager')
    }
    
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
    }

    // Basic validation
    if (!data.name || !data.email) {
      throw new Error('Name and email are required')
    }

    await db.update(user)
      .set(data)
      .where(eq(user.id, id))

    revalidatePath('/dashboard/users')
    revalidatePath(`/dashboard/users/${id}`)
  } catch (error) {
    console.error('Failed to update user:', error)
    throw new Error('Failed to update user')
  }
}

export async function deactivateUser(id: string) {
  try {
    // Check permissions - only admin and above can deactivate users
    await requireRole('admin')
    
    // Since our user table doesn't have isActive, we'll just log this for now
    console.log('Deactivate user functionality not implemented yet for user:', id)
    
    revalidatePath('/dashboard/users')
    revalidatePath(`/dashboard/users/${id}`)
  } catch (error) {
    console.error('Failed to deactivate user:', error)
    throw new Error('Failed to deactivate user')
  }
}

export async function getUsers() {
  try {
    return await db.select().from(user)
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return []
  }
}

export async function getUserById(id: string) {
  try {
    const result = await db.select().from(user).where(eq(user.id, id))
    return result[0] || null
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
} 