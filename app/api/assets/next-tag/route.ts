import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { assetCounters, assetCategoryEnum } from '@/lib/db/schema'
import { requireAuth } from '@/lib/auth'
import { eq } from 'drizzle-orm'

// ============================================================================
// GET /api/assets/next-tag - Get next auto-incrementing asset tag for a category
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await requireAuth()
    
    // Parse query parameters
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    
    if (!category) {
      return NextResponse.json({
        success: false,
        error: 'Category parameter is required',
      }, { status: 400 })
    }

    // Validate category
    const validCategories = Object.values(assetCategoryEnum.enumValues)
    if (!validCategories.includes(category as any)) {
      return NextResponse.json({
        success: false,
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      }, { status: 400 })
    }

    // Category to prefix mapping
    const CATEGORY_PREFIXES: Record<string, string> = {
      laptop: 'LAP',
      desktop: 'DESK',
      monitor: 'MON',
      printer: 'PRN',
      phone: 'PHN',
      tablet: 'TAB',
      server: 'SVR',
      network_device: 'NET',
      software_license: 'SW',
      toner: 'TON',
      other: 'OTH'
    }

    // Use database transaction to ensure atomic increment
    const result = await db.transaction(async (tx) => {
      // Try to get existing counter for this category
      let counter = await tx
        .select()
        .from(assetCounters)
        .where(eq(assetCounters.category, category as any))
        .limit(1)

      if (counter.length === 0) {
        // Create new counter for this category
        const [newCounter] = await tx
          .insert(assetCounters)
          .values({
            category: category as any,
            nextNumber: 1,
          })
          .returning()
        counter = [newCounter]
      }

      // Get current number and increment it
      const currentNumber = counter[0].nextNumber
      const nextNumber = currentNumber + 1

      // Update the counter
      await tx
        .update(assetCounters)
        .set({
          nextNumber,
          lastUpdated: new Date(),
        })
        .where(eq(assetCounters.category, category as any))

      // Generate the asset tag
      const prefix = CATEGORY_PREFIXES[category] || category.toUpperCase().substring(0, 3)
      const assetTag = `IT-${prefix}-${currentNumber.toString().padStart(4, '0')}`

      return {
        assetTag,
        nextNumber: currentNumber,
        category,
        prefix,
      }
    })

    return NextResponse.json({
      success: true,
      data: result,
    })
    
  } catch (error: any) {
    console.error('GET /api/assets/next-tag error:', error)
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate asset tag',
      message: error.message,
    }, { status: 500 })
  }
} 