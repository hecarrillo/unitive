import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { appCache } from '@/lib/cache';

const ASPECTS_CACHE_KEY = 'location_aspects';

export async function GET() {
  try {
    // Try to get aspects from cache first
    const cachedAspects = appCache.get(ASPECTS_CACHE_KEY);
    if (cachedAspects) {
      return NextResponse.json(cachedAspects);
    }

    // If not in cache, fetch from database
    const aspects = await prisma.aspect.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Store in cache
    appCache.set(ASPECTS_CACHE_KEY, aspects);

    return NextResponse.json(aspects);
  } catch (error) {
    console.error('Error fetching aspects:', error);
    
    // If there's an error but we have cached data, return it
    const cachedAspects = appCache.get(ASPECTS_CACHE_KEY);
    if (cachedAspects) {
      return NextResponse.json(cachedAspects);
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}