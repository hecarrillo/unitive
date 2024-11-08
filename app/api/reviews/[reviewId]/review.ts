import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { appCache } from '@/lib/cache'

export async function DELETE(
  req: Request,
  { params }: { params: { reviewId: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const reviewId = parseInt(params.reviewId)

    if (isNaN(reviewId)) {
      return NextResponse.json(
        { error: 'Invalid review ID' },
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

    // Fetch the review to check ownership and get locationId
    const review = await prisma.siteReview.findUnique({
      where: { id: reviewId }
    })

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check if the user owns the review
    if (review.userId !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Delete review and update location rating in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete the review
      await tx.siteReview.delete({
        where: { id: reviewId }
      })

      // Calculate new average rating
      const reviews = await tx.siteReview.findMany({
        where: { locationId: review.locationId },
        select: { rating: true }
      })

      const averageRating = reviews.length > 0
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
        : null

      // Update location rating
      await tx.touristicLocation.update({
        where: { id: review.locationId },
        data: { rating: averageRating }
      })
    })

    // Invalidate any cached data for this location
    appCache.deletePattern(`location:${review.locationId}`)

    return NextResponse.json(null, { status: 204 })

  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}