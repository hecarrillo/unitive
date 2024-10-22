import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const searchName = searchParams.get('name')?.trim() || '';
  const latitude = parseFloat(searchParams.get('latitude') ?? '');
  const longitude = parseFloat(searchParams.get('longitude') ?? '');
  const distance = parseFloat(searchParams.get('distance') ?? '10'); // km
  const categoryId = parseInt(searchParams.get('categoryId') ?? '0');
  const minAspectRating = parseInt(searchParams.get('minAspectRating') ?? '0');
  const aspectId = parseInt(searchParams.get('aspectId') ?? '0');
  const page = parseInt(searchParams.get('page') ?? '1');
  const perPage = parseInt(searchParams.get('perPage') ?? '20');

  // Build the WHERE clause based on whether we have coordinates or just a name search
  let whereClause;
  if (!isNaN(latitude) && !isNaN(longitude)) {
    whereClause = Prisma.sql`
      earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(t.latitude, t.longitude)) / 1000 <= ${distance}
      ${searchName ? Prisma.sql`AND LOWER(t.name) LIKE ${`%${searchName.toLowerCase()}%`}` : Prisma.empty}
      ${categoryId > 0 ? Prisma.sql`AND t."categoryId" = ${categoryId}` : Prisma.empty}
      ${aspectId > 0 && minAspectRating > 0
        ? Prisma.sql`AND EXISTS (
            SELECT 1 FROM "LocationAspectRating" ar
            WHERE ar."locationId" = t.id
              AND ar."aspectId" = ${aspectId}
              AND ar.rating >= ${minAspectRating}
          )`
        : Prisma.empty}
       AND (SELECT COUNT(*) FROM "SiteReview" sr WHERE sr."locationId" = t.id) >= 5
    `;
  } else {
    // If no coordinates provided, just search by name
    whereClause = Prisma.sql`
      ${searchName ? Prisma.sql`LOWER(t.name) LIKE ${`%${searchName.toLowerCase()}%`}` : Prisma.sql`1=1`}
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
  }

  try {
    // First, get the total count
    const countQuery = Prisma.sql`
      SELECT COUNT(*)
      FROM "TouristicLocation" t
      WHERE ${whereClause}
    `;

    const [{ count }] = await prisma.$queryRaw<[{ count: bigint }]>(countQuery);
    const totalCount = Number(count);

    // Now, fetch locations
    const selectClause = !isNaN(latitude) && !isNaN(longitude)
      ? Prisma.sql`t.*, earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(t.latitude, t.longitude)) / 1000 AS distance`
      : Prisma.sql`t.*, NULL as distance`;

    const locationsQuery = Prisma.sql`
      SELECT ${selectClause}
      FROM "TouristicLocation" t
      WHERE ${whereClause}
      ORDER BY ${!isNaN(latitude) && !isNaN(longitude) ? Prisma.sql`distance` : Prisma.sql`t.rating DESC NULLS LAST`}
      LIMIT ${perPage}
      OFFSET ${(page - 1) * perPage}
    `;

    const locations = await prisma.$queryRaw(locationsQuery);

    return NextResponse.json({
      locations,
      page,
      perPage,
      total: totalCount,
    });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}