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

  try {
    const whereConditions = [];

    if (!isNaN(latitude) && !isNaN(longitude)) {
      whereConditions.push(`earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(t.latitude, t.longitude)) / 1000 <= ${distance}`);
    }

    if (searchName) {
      whereConditions.push(`LOWER(t.name) LIKE LOWER('%${searchName}%')`);
    }

    if (categoryId > 0) {
      whereConditions.push(`t."categoryId" = ${categoryId}`);
    }

    if (aspectId > 0 && minAspectRating > 0) {
      whereConditions.push(`
        EXISTS (
          SELECT 1 FROM "LocationAspectRating" ar
          WHERE ar."locationId" = t.id
            AND ar."aspectId" = ${aspectId}
            AND ar.rating >= ${minAspectRating}
        )
      `);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count total results
    const countQuery = Prisma.sql`
      SELECT COUNT(*)
      FROM "TouristicLocation" t
      ${Prisma.raw(whereClause)}
    `;

    const [{ count }] = await prisma.$queryRaw<[{ count: bigint }]>(countQuery);
    const totalCount = Number(count);

    // Main query for locations
    const distanceSelect = !isNaN(latitude) && !isNaN(longitude)
      ? `, earth_distance(ll_to_earth(${latitude}, ${longitude}), ll_to_earth(t.latitude, t.longitude)) / 1000 AS distance`
      : '';

    const orderBy = !isNaN(latitude) && !isNaN(longitude)
      ? 'ORDER BY distance'
      : 'ORDER BY rating DESC NULLS LAST';

    const locationsQuery = Prisma.sql`
      SELECT 
        t.*
        ${Prisma.raw(distanceSelect)}
      FROM "TouristicLocation" t
      ${Prisma.raw(whereClause)}
      ${Prisma.raw(orderBy)}
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
