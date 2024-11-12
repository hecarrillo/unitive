import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { appCache } from '@/lib/cache';

// Type for the route locations data
type RouteLocation = {
  locationId: string;
};

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const cacheKey = `routes:${user.id}`;
    const cachedData = appCache.get<RouteLocation[]>(cacheKey);

    if (cachedData) {
      return NextResponse.json(cachedData);
    }

    const routes = await prisma.userRouteLocation.findMany({
      where: {
        userId: user.id,
      },
      select: {
        locationId: true,
      },
    });

    appCache.set(cacheKey, routes);
    return NextResponse.json(routes);
  } catch (error) {
    console.error('Routes GET Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const route = await prisma.userRouteLocation.create({
      data: {
        userId: user.id,
        locationId,
      },
    });

    // Invalidate cache after creating new route
    const cacheKey = `routes:${user.id}`;
    appCache.clear(); // You might want to only delete this specific key instead
    
    return NextResponse.json(route);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    await prisma.userRouteLocation.deleteMany({
      where: {
        userId: user.id,
        locationId,
      },
    });

    // Invalidate cache after deleting route
    const cacheKey = `routes:${user.id}`;
    appCache.clear(); // You might want to only delete this specific key instead

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}