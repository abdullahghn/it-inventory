import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { user as userTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// ⚠️ TEMPORARY ENDPOINT FOR TESTING - REMOVE IN PRODUCTION ⚠️
export async function POST(request: NextRequest) {
  try {
    const { email, role } = await request.json()
    
    // Basic safety check - only allow specific email for testing
    if (email !== 'abdullah.arshad@coastline-fm.com') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized',
      }, { status: 403 })
    }

    const updatedUser = await db
      .update(userTable)
      .set({ 
        role: role,
        updatedAt: new Date()
      })
      .where(eq(userTable.email, email))
      .returning({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
        role: userTable.role,
      })

    if (updatedUser.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'User not found',
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedUser[0],
      message: `User promoted to ${role}`,
    })

  } catch (error: any) {
    console.error('Promotion error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 })
  }
} 