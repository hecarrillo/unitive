import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, TouristicLocation } from '@prisma/client';
import { withDatabase } from '@/middleware/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withDatabase( async () => {
  const searchParams = request.nextUrl.searchParams;
  
  const searchName = searchParams.get('name')?.trim() || '';
  const latitude = parseFloat(searchParams.get('latitude') ?? '');
  const longitude = parseFloat(searchParams.get('longitude') ?? '');
  const distance = parseFloat(searchParams.get('distance') ?? '10'); // km
  const isOpenNowFilter = searchParams.get('isOpenNow') === 'true';
  
  // Parse arrays from comma-separated strings
  const categoryIds = searchParams.get('categoryIds')?.split(',')
    .map(id => parseInt(id))
    .filter(id => !isNaN(id)) ?? [];
    
  const aspectIds = searchParams.get('aspectIds')?.split(',')
    .map(id => parseInt(id))
    .filter(id => !isNaN(id)) ?? [];
    
  const minAspectRating = 5;
  const page = parseInt(searchParams.get('page') ?? '1');
  const perPage = parseInt(searchParams.get('perPage') ?? '20');

  try {
    const conditions = [
      // Add base condition for minimum review count and cast COUNT to integer
      `(SELECT COUNT(*)::integer FROM "SiteReview" sr WHERE sr."locationId" = t.id) >= 4`
    ];

    if (!isNaN(latitude) && !isNaN(longitude)) {
      conditions.push(`earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(t.latitude, t.longitude)) / 1000 <= ${distance}`);
    }

    if (searchName) {
      conditions.push(`LOWER(t.name) LIKE LOWER('%${searchName}%')`);
    }

    if (categoryIds.length > 0) {
      conditions.push(`t."categoryId" = ANY(ARRAY[${categoryIds.join(',')}])`);
    }

    if (aspectIds.length > 0) {
      conditions.push(`
        NOT EXISTS (
          SELECT 1 
          FROM UNNEST(ARRAY[${aspectIds.join(',')}]) AS aid
          WHERE NOT EXISTS (
            SELECT 1 
            FROM "LocationAspectRating" ar
            WHERE ar."locationId" = t.id
              AND ar."aspectId" = aid
              AND ar.rating >= ${minAspectRating}
          )
        )
      `);
    }

    const whereClause = conditions.length > 0 
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    // Count total results with integer cast
    const countResult = await prisma.$queryRaw<[{ count: number }]>(
      Prisma.sql`
        SELECT COUNT(*)::integer as count
        FROM "TouristicLocation" t
        ${Prisma.raw(whereClause)}
      `
    );


    // Main query for locations
    const distanceSelect = !isNaN(latitude) && !isNaN(longitude)
      ? Prisma.raw(`, earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(t.latitude, t.longitude)) / 1000 AS distance`)
      : Prisma.raw(``);

    // Only include matched_aspects in the SELECT if we have aspectIds
    const aspectSelect = aspectIds.length > 0 
      ? Prisma.raw(`, 
          (
            SELECT json_agg(json_build_object(
              'aspectId', ar."aspectId",
              'rating', ar.rating
            ))
            FROM "LocationAspectRating" ar
            WHERE ar."locationId" = t.id
            AND ar."aspectId" = ANY(ARRAY[${aspectIds.join(',')}])
          ) as matched_aspects`)
      : Prisma.raw(``);

    const orderBy = !isNaN(latitude) && !isNaN(longitude)
      ? 'ORDER BY distance'
      : 'ORDER BY rating DESC NULLS LAST';

    const locations = await prisma.$queryRaw(
      Prisma.sql`
        SELECT 
          t.*,
          (SELECT COUNT(*)::integer FROM "SiteReview" sr WHERE sr."locationId" = t.id) as review_count
          ${distanceSelect}
          ${aspectSelect}
        FROM "TouristicLocation" t
        ${Prisma.raw(whereClause)}
        ${Prisma.raw(orderBy)}
        LIMIT ${perPage}
        OFFSET ${(page - 1) * perPage}
      `
    );

    // If isOpenNowFilter is true, filter locations in memory
    const filteredLocations: TouristicLocation[] = isOpenNowFilter 
      ? (locations as TouristicLocation[]).filter((location: TouristicLocation) => {
        if (location.openingHours === 'N/A' || !Array.isArray(location.openingHours)) {
          return false;
        }

        const now = new Date();
        const currentDay = now.toLocaleString('en-US', { weekday: 'long' });
        
        // Find today's hours
        const todayHours = (location.openingHours as string[]).find((hours: string) => 
          hours.startsWith(currentDay)
        );

        if (!todayHours) return false;
        if (todayHours.includes('Closed')) return false;
        
        // Check for 24 hours
        if (todayHours.includes('Open 24 hours')) return true;

        // Regular hours check
        const timeMatch = todayHours.match(/(\d{1,2}):(\d{2}) ([AP]M) – (\d{1,2}):(\d{2}) ([AP]M)/);
        if (!timeMatch) return false;

        const [_, startHour, startMin, startMeridiem, endHour, endMin, endMeridiem] = timeMatch;

        // Convert to 24-hour format for comparison
        const convertTo24Hour = (hour: string, min: string, meridiem: string) => {
          let h = parseInt(hour);
          if (meridiem === 'PM' && h !== 12) h += 12;
          if (meridiem === 'AM' && h === 12) h = 0;
          return h * 60 + parseInt(min); // Return minutes since midnight
        };

        const startMinutes = convertTo24Hour(startHour, startMin, startMeridiem);
        const endMinutes = convertTo24Hour(endHour, endMin, endMeridiem);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      })
      : locations as TouristicLocation[];

    const totalCount = isOpenNowFilter ? filteredLocations.length : countResult[0].count;

    return NextResponse.json({
      locations: filteredLocations,
      page,
      perPage,
      total: totalCount,
    });

  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' }, 
      { status: 500 }
    );
  }
  }
  );
}