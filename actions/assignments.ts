'use server'

import { db } from '@/lib/db'
import { assetAssignments, assets } from '@/lib/db/schema'
// Remove unused validation imports
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { requireRole } from '@/lib/auth'

export async function assignAsset(formData: FormData) {
  try {
    // Check permissions - only manager and above can assign assets
    await requireRole('manager')
    
    const data = {
      assetId: parseInt(formData.get('assetId') as string),
      userId: formData.get('userId') as string, // Keep as string since user.id is text
      notes: formData.get('notes') as string,
    }

    // Basic validation
    if (!data.assetId || !data.userId) {
      throw new Error('Asset ID and User ID are required')
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Create assignment
      await tx.insert(assetAssignments).values({
        assetId: data.assetId,
        userId: data.userId,
        notes: data.notes,
        assignedAt: new Date(),
        isActive: true,
      })
      
      // Update asset status to assigned
      await tx.update(assets)
        .set({ status: 'assigned', updatedAt: new Date() })
        .where(eq(assets.id, data.assetId))
    })

    revalidatePath('/dashboard/assets')
    revalidatePath(`/dashboard/assets/${data.assetId}`)
    revalidatePath(`/dashboard/users/${data.userId}`)
    revalidatePath('/dashboard/assignments')
  } catch (error) {
    console.error('Failed to assign asset:', error)
    throw new Error('Failed to assign asset')
  }
  
  // Move redirect outside try-catch to prevent catching the Next.js redirect error
  redirect('/dashboard/assignments')
}

export async function returnAsset(formData: FormData) {
  try {
    // Check permissions - only manager and above can return assets
    await requireRole('manager')
    
    const assignmentId = parseInt(formData.get('assignmentId') as string)
    const notes = formData.get('notes') as string

    if (!assignmentId) {
      throw new Error('Assignment ID is required')
    }

    const assignment = await db.select()
      .from(assetAssignments)
      .where(eq(assetAssignments.id, assignmentId))

    if (!assignment[0]) {
      throw new Error('Assignment not found')
    }

    // Start transaction
    await db.transaction(async (tx) => {
      // Update assignment as returned
      await tx.update(assetAssignments)
        .set({
          returnedAt: new Date(),
          isActive: false,
          notes: notes || assignment[0].notes,
        })
        .where(eq(assetAssignments.id, assignmentId))

      // Update asset status to available
      await tx.update(assets)
        .set({ status: 'available', updatedAt: new Date() })
        .where(eq(assets.id, assignment[0].assetId!))
    })

    revalidatePath('/dashboard/assets')
    revalidatePath(`/dashboard/assets/${assignment[0].assetId}`)
    revalidatePath(`/dashboard/users/${assignment[0].userId}`)
    revalidatePath('/dashboard/assignments')
    revalidatePath(`/dashboard/assignments/${assignmentId}`)
  } catch (error) {
    console.error('Failed to return asset:', error)
    throw new Error('Failed to return asset')
  }

  // Redirect after successful return
  redirect('/dashboard/assignments')
}

export async function getActiveAssignments() {
  try {
    return await db.select()
      .from(assetAssignments)
      .where(eq(assetAssignments.isActive, true))
  } catch (error) {
    console.error('Failed to fetch assignments:', error)
    return []
  }
}

export async function getAssignmentsByUser(userId: string) {
  try {
    return await db.select()
      .from(assetAssignments)
      .where(
        and(
          eq(assetAssignments.userId, userId),
          eq(assetAssignments.isActive, true)
        )
      )
  } catch (error) {
    console.error('Failed to fetch user assignments:', error)
    return []
  }
}

export async function getAssignmentsByAsset(assetId: number) {
  try {
    return await db.select()
      .from(assetAssignments)
      .where(eq(assetAssignments.assetId, assetId))
  } catch (error) {
    console.error('Failed to fetch asset assignments:', error)
    return []
  }
} 