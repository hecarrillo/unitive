import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const searchName = searchParams.get('name')?.trim() || '';
  const latitude = parseFloat(searchParams.get('latitude') ?? '');
  const longitude = parseFloat(searchParams.get('longitude') ?? '');
  const distance = parseFloat(searchParams.get('distance') ?? '10'); // km
  
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
      `(SELECT COUNT(*)::integer FROM "SiteReview" sr WHERE sr."locationId" = t.id) >= 5`
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

    const totalCount = countResult[0].count;

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

    return NextResponse.json({
      locations,
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
  } finally {
    await prisma.$disconnect();
  }
}