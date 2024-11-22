import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { appCache } from '@/lib/cache'
import { withDatabase } from '@/middleware/database'
import { ReviewSource, Prisma } from '@prisma/client'

export async function DELETE(
  req: Request,
  { params }: { params: { reviewId: string } }
) {
  return withDatabase( async () => {
    try {
    const supabase = createRouteHandlerClient({ cookies })
    const { reviewId } = params

    // Check if reviewId is a valid UUID
    if (!reviewId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
      return NextResponse.json(
        { error: 'Invalid review ID format' },
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
      where: { 
        id: reviewId,
        source: ReviewSource.USR // Only allow deletion of user reviews
      }
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
        { error: 'You do not have permission to delete this review' },
        { status: 403 }
      )
    }

    try {
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

      return NextResponse.json(null, { status: 200 })

    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return NextResponse.json(
            { error: 'Review has already been deleted' },
            { status: 404 }
          )
        }
      }
      throw error; // Let the outer catch block handle other errors
    }

  } catch (error) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { error: 'Failed to delete review. Please try again later.' },
      { status: 500 }
    )
  }
});
}