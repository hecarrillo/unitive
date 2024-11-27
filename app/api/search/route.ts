import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma, TouristicLocation } from '@prisma/client';
import { withDatabase } from '@/middleware/database';

export const dynamic = 'force-dynamic';

function convertTo24Hour(hour: string, min: string, meridiem: string): number {
  let h = parseInt(hour);
  if (meridiem === 'PM' && h !== 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  return h * 60 + parseInt(min);
}

function parseTimeRange(timeStr: string): { start: number; end: number } | null {
  // Try the standard format first (12:00 AM - 6:00 PM)
  let match = timeStr.match(/(\d{1,2}):(\d{2})\s*([AP]M)\s*[–-]\s*(\d{1,2}):(\d{2})\s*([AP]M)/);
  
  if (match) {
    const [_, startHour, startMin, startMeridiem, endHour, endMin, endMeridiem] = match;
    return {
      start: convertTo24Hour(startHour, startMin, startMeridiem),
      end: convertTo24Hour(endHour, endMin, endMeridiem)
    };
  }

  // Try the shortened format (12:00 - 8:00 PM)
  match = timeStr.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})\s*([AP]M)/);
  if (match) {
    const [_, startHour, startMin, endHour, endMin, meridiem] = match;
    return {
      start: convertTo24Hour(startHour, startMin, meridiem),
      end: convertTo24Hour(endHour, endMin, meridiem)
    };
  }

  // Try even shorter format (12:00 - 8:00)
  match = timeStr.match(/(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/);
  if (match) {
    const [_, startHour, startMin, endHour, endMin] = match;
    return {
      start: convertTo24Hour(startHour, startMin, 'PM'),
      end: convertTo24Hour(endHour, endMin, 'PM')
    };
  }

  return null;
}

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

// In the filter function
const filteredLocations = isOpenNowFilter 
  ? (locations as any[]).filter(location => {
      if (location.openingHours === 'N/A' || !Array.isArray(location.openingHours)) {
        return false;
      }

      const now = new Date();
      const centralTime = new Date(now.toLocaleString("en-US", { timeZone: "America/Chicago" }));
      const currentDay = centralTime.toLocaleString('en-US', { weekday: 'long' });
      
      const todayHours = location.openingHours.find((hours: string) => 
        hours.startsWith(currentDay)
      );

      if (!todayHours) return false;

      const timePart = todayHours.split(': ')[1]?.trim();
      if (!timePart) return false;

      if (timePart === 'Closed') return false;
      if (timePart === 'Open 24 hours') return true;

      const timeRange = parseTimeRange(timePart);
      if (!timeRange) return false;

      const currentMinutes = centralTime.getHours() * 60 + centralTime.getMinutes();
      return currentMinutes >= timeRange.start && currentMinutes <= timeRange.end;
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