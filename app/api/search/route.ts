import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const latitude = parseFloat(searchParams.get('latitude') ?? '');
  const longitude = parseFloat(searchParams.get('longitude') ?? '');
  const distance = parseFloat(searchParams.get('distance') ?? '10'); // km
  const categoryId = parseInt(searchParams.get('categoryId') ?? '0');
  const minAspectRating = parseInt(searchParams.get('minAspectRating') ?? '0');
  const aspectId = parseInt(searchParams.get('aspectId') ?? '0');
  const page = parseInt(searchParams.get('page') ?? '1');
  const perPage = parseInt(searchParams.get('perPage') ?? '20');

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json({ error: 'Invalid latitude or longitude' }, { status: 400 });
  }

  const skip = (page - 1) * perPage;

  // Common WHERE clause for both queries
  const whereClause = Prisma.sql`
    earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(t.latitude, t.longitude)) / 1000 <= ${distance}
    ${categoryId > 0 ? Prisma.sql`AND t."categoryId" = ${categoryId}` : Prisma.empty}
    ${aspectId > 0 && minAspectRating > 0
      ? Prisma.sql`AND EXISTS (
          SELECT 1 FROM "LocationAspectRating" ar
          WHERE ar."locationId" = t.id
            AND ar."aspectId" = ${aspectId}
            AND ar.rating >= ${minAspectRating}
        )`
      : Prisma.empty}
  `;

  try {
    // First, get the total count
    const countQuery = Prisma.sql`
      SELECT COUNT(*)
      FROM "TouristicLocation" t
      WHERE ${whereClause}
    `;

    const [{ count }] = await prisma.$queryRaw<[{ count: bigint }]>(countQuery);
    const totalCount = Number(count);

    // Now, fetch all locations using cursor-based pagination
    let allLocations: Array<{
      id: string;
      name: string;
      image: string | null;
      latitude: number;
      longitude: number;
      summarizedReview: string | null;
      rating: number | null;
      distance: number;
    }> = [];

    let lastId = '';
    while (allLocations.length < totalCount) {
      const batchQuery = Prisma.sql`
        SELECT 
          t.*,
          earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(t.latitude, t.longitude)) / 1000 AS distance
        FROM "TouristicLocation" t
        WHERE ${whereClause}
          AND t.id > ${lastId}
        ORDER BY t.id
        LIMIT 1000
      `;

      const batchLocations: typeof allLocations = await prisma.$queryRaw(batchQuery);
      allLocations = allLocations.concat(batchLocations);
      
      if (batchLocations.length > 0) {
        lastId = batchLocations[batchLocations.length - 1].id;
      } else {
        break;
      }
    }

    // Sort the results by rating in descending order
    allLocations.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    // Apply pagination to the sorted results
    const paginatedLocations = allLocations.slice(skip, skip + perPage);

    // Fetch aspect ratings for paginated locations
    const locationIds = paginatedLocations.map(loc => loc.id);
    const aspectRatings = await prisma.locationAspectRating.findMany({
      where: { locationId: { in: locationIds } },
      include: { aspect: true },
    });

    // Organize aspect ratings by location
    const aspectRatingsByLocation = aspectRatings.reduce((acc: { [key: string]: { [key: string]: number } }, rating) => {
      if (!acc[rating.locationId]) acc[rating.locationId] = {};
      acc[rating.locationId][rating.aspect.name] = rating.rating;
      return acc;
    }, {});

    // Add aspect ratings to each location
    const locationsWithAspects = paginatedLocations.map(location => ({
      ...location,
      aspectRatings: aspectRatingsByLocation[location.id] || {},
    }));

    return NextResponse.json({
      locations: locationsWithAspects,
      page,
      perPage,
      total: totalCount,
    });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 });
  }
}