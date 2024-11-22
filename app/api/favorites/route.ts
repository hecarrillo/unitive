// app/api/favorites/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { withDatabase } from '@/middleware/database';
import { appCache } from '@/lib/cache'; // Adjust the import path as needed

// Type for the favorites data
type FavoriteLocation = {
  locationId: string;
};

export async function GET(request: NextRequest) {
  return withDatabase( async () => {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cacheKey = `favorites:${user.id}`;
    const cachedData = appCache.get<FavoriteLocation[]>(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const favorites = await prisma.favoriteUserLocation.findMany({
      where: {
        userId: user.id,
      },
      select: {
        locationId: true,
      },
    });

    appCache.set(cacheKey, favorites);
    return NextResponse.json(favorites);
  } catch (error) {
    console.error('Favorites GET Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }} );
}

export async function POST(request: NextRequest) {
  return withDatabase( async () => {
    try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { locationId } = await request.json();

    const favorite = await prisma.favoriteUserLocation.create({
      data: {
        userId: user.id,
        locationId,
      },
    });

    // Invalidate cache after creating new favorite
    const cacheKey = `favorites:${user.id}`;
    appCache.clear(); // You might want to only delete this specific key instead
    
    return NextResponse.json(favorite);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} );
}

export async function DELETE(request: NextRequest) {
  return withDatabase( async () => {
    try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { locationId } = await request.json();

    await prisma.favoriteUserLocation.deleteMany({
      where: {
        userId: user.id,
        locationId,
      },
    });

    // Invalidate cache after deleting favorite
    const cacheKey = `favorites:${user.id}`;
    appCache.clear(); // You might want to only delete this specific key instead

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
});
}