// app/api/location/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withDatabase } from '@/middleware/database';
import { appCache } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  return withDatabase(async () => {
    try {
      // Try to get from cache first
      const cacheKey = `location-${params.id}`;
      const cachedData = appCache.get(cacheKey);
      if (cachedData) {
        return NextResponse.json(cachedData);
      }

      const location = await prisma.touristicLocation.findUnique({
        where: {
          id: params.id,
        },
        include: {
          aspectRatings: {
            include: {
              aspect: true,
            },
            orderBy: {
              generatedDate: 'desc'
            }
          },
          siteReviews: {
            orderBy: {
              extractedDate: 'desc'
            },
            take: 10,
            include: {
              user: true
            }
          }
        }
      });

      if (!location) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 }
        );
      }

      // Process the response data
      const responseData = {
        ...location,
        aspectRatings: location.aspectRatings.map(rating => ({
          ...rating,
          rating: Math.round(rating.rating)
        }))
      };

      // Cache the response
      appCache.set(cacheKey, responseData);

      return NextResponse.json(responseData);
    } catch (error) {
      console.error('Error fetching location details:', error);
      return NextResponse.json(
        { error: 'Failed to fetch location details' },
        { status: 500 }
      );
    }
  });
}