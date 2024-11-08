import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { reviewSchema } from '@/lib/validations/review'
import { appCache } from '@/lib/cache'
import { ReviewSource, Prisma } from '@prisma/client'

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
        source: ReviewSource.USR
      }
    })

    const result = await prisma.$transaction(async (tx) => {
      let review;

      if (existingReview) {
        // Update existing review
        review = await tx.siteReview.update({
          where: { id: existingReview.id },
          data: {
            body: reviewBody,
            rating,
            extractedDate: new Date()
          }
        });
      } else {
        // Create new review
        review = await tx.siteReview.create({
          data: {
            locationId,
            body: reviewBody,
            rating,
            userId: user.id,
            source: ReviewSource.USR,
            extractedDate: new Date()
          }
        });
      }

      // Calculate new average rating
      const allReviews = await tx.siteReview.findMany({
        where: { locationId },
        select: { rating: true }
      });

      const averageRating = allReviews.reduce((acc, review) => acc + review.rating, 0) / allReviews.length;

      // Update location rating
      await tx.touristicLocation.update({
        where: { id: locationId },
        data: { rating: averageRating }
      });

      return review;
    });

    // Invalidate cache
    appCache.deletePattern(`location:${locationId}`);

    return NextResponse.json(result, { 
      status: existingReview ? 200 : 201 
    });

  } catch (error) {
    console.error('Error handling request:', error);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        console.error('Sequence error detected, you may need to reset the sequence');
        return NextResponse.json(
          { error: 'Conflict while creating review. Please try again.' },
          { status: 409 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
        source: ReviewSource.USR
      }
    })

    return NextResponse.json(review)

  } catch (error) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}