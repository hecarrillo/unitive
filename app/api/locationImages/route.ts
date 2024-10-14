import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
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

    const images: { [key: string]: string } = {};

    for (const location of locations) {
      if (location.image) {
        try {
          const response = await fetch(
            `https://places.googleapis.com/v1/${location.image}/media?max_height_px=400`,
            {
              headers: {
                'X-Goog-Api-Key': process.env.GOOGLE_API_KEY as string,
              },
            }
          );

          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const mimeType = response.headers.get('content-type');
            images[location.id] = `data:${mimeType};base64,${base64}`;
          }
        } catch (error) {
          console.error(`Error fetching image for location ${location.id}:`, error);
        }
      }
    }

    return NextResponse.json(images);
  } catch (error) {
    console.error('Error in getLocationImages:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}