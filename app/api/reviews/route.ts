import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { reviewSchema } from '@/lib/validations/review'
import { appCache } from '@/lib/cache'

export async function POST(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validationResult = reviewSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors },
        { status: 400 }
      )
    }

    const { locationId, rating, body: reviewBody } = validationResult.data

    // Check if location exists
    const location = await prisma.touristicLocation.findUnique({
      where: { id: locationId }
    })

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    // Check if user has already reviewed this location
    const existingReview = await prisma.siteReview.findFirst({
      where: {
        locationId,
        userId: user.id,
      }
    })

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this location' },
        { status: 409 }
      )
    }

    // Create review and update location rating in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the review
      const newReview = await tx.siteReview.create({
        data: {
          locationId,
          body: reviewBody,
          rating,
          userId: user.id,
          source: 'USR',
          extractedDate: new Date(),
        }
      })

      // Calculate new average rating
      const reviews = await tx.siteReview.findMany({
        where: { locationId },
        select: { rating: true }
      })

      const averageRating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length

      // Update location rating
      await tx.touristicLocation.update({
        where: { id: locationId },
        data: { rating: averageRating }
      })

      return newReview
    })

    // Invalidate any cached data for this location
    appCache.deletePattern(`location:${locationId}`)

    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch user's review for a specific location
export async function GET(req: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(req.url)
    const locationId = searchParams.get('locationId')

    if (!locationId) {
      return NextResponse.json(
        { error: 'Location ID is required' },
        { status: 400 }
      )
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const review = await prisma.siteReview.findFirst({
      where: {
        locationId,
        userId: user.id,
      }
    })

    return NextResponse.json(review)

  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}