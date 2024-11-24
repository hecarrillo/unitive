import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { locationIds } = await request.json();

    // Validate input
    if (!locationIds || !Array.isArray(locationIds)) {
      return NextResponse.json(
        { error: 'locationIds must be an array' },
        { status: 400 }
      );
    }

    // Deduplicate location IDs
    const uniqueLocationIds = [...new Set(locationIds)];

    // Fetch locations with their aspects and reviews
    const locations = await prisma.touristicLocation.findMany({
      where: {
        id: {
          in: uniqueLocationIds
        }
      }
    });

    return NextResponse.json(locations);

  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}