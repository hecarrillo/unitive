import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { appCache } from '@/lib/cache';

const CATEGORIES_CACHE_KEY = 'location_categories';

export async function GET() {
  try {
    // Try to get categories from cache first
    const cachedCategories = appCache.get(CATEGORIES_CACHE_KEY);
    if (cachedCategories) {
      return NextResponse.json(cachedCategories);
    }

    // If not in cache, fetch from database
    const categories = await prisma.locationCategory.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    // Store in cache
    appCache.set(CATEGORIES_CACHE_KEY, categories);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    // If there's an error but we have cached data, return it
    const cachedCategories = appCache.get(CATEGORIES_CACHE_KEY);
    if (cachedCategories) {
      return NextResponse.json(cachedCategories);
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}