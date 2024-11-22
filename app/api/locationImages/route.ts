// app/api/locationImages/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withDatabase } from '@/middleware/database';

export async function POST(request: Request) {
  return withDatabase( async () => {
    try {
    const { locationIds } = await request.json();

    if (!Array.isArray(locationIds)) {
      return NextResponse.json({ message: 'Invalid locationIds' }, { status: 400 });
    }

    const locations = await prisma.touristicLocation.findMany({
      where: {
        id: { in: locationIds },
      },
      select: {
        id: true,
        image: true,
      },
    });

    const fetchImage = async (location: { id: string; image: string | null }) => {
      if (!location.image) return null;

      try {
        const response = await fetch(
          `https://places.googleapis.com/v1/${location.image}/media?max_height_px=60`,
          {
            headers: {
              'X-Goog-Api-Key': process.env.GOOGLE_API_KEY as string,
            },
          }
        );

        if (response.ok) {
          const buffer = await response.arrayBuffer();
          if (buffer.byteLength == 0) throw new Error('No buffer returned');
          const base64 = Buffer.from(buffer).toString('base64');
          const mimeType = response.headers.get('content-type');
          return { id: location.id, image: `data:${mimeType};base64,${base64}` };
        }
      } catch (error) {
        console.error(`Error fetching image for location ${location.id}:`, error);
      }
      return null;
    };

    const imageResults = await Promise.all(locations.map(fetchImage));

    const images: { [key: string]: string } = {};
    imageResults.forEach(result => {
      if (result) {
        images[result.id] = result.image;
      }
    });

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error in getLocationImages:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
});
}