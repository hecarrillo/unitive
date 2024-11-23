// app/api/location/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { withDatabase } from '@/middleware/database';

export const dynamic = 'force-dynamic';

const fetchLocationImage = async (imagePath: string | null, imgSize: number | null) => {
  // if (!imagePath) return null;

  // try {
  //   const response = await fetch(
  //     `https://places.googleapis.com/v1/${imagePath}/media?max_height_px=${imgSize ?? 800}`, // Using larger image for modal
  //     {
  //       headers: {
  //         'X-Goog-Api-Key': process.env.GOOGLE_API_KEY as string,
  //       },
  //     }
  //   );

  //   if (response.ok) {
  //     const buffer = await response.arrayBuffer();
  //     if (buffer.byteLength === 0) throw new Error('No buffer returned');
  //     const base64 = Buffer.from(buffer).toString('base64');
  //     const mimeType = response.headers.get('content-type');
  //     return `data:${mimeType};base64,${base64}`;
  //   }
  // } catch (error) {
  //   console.error('Error fetching location image:', error);
  // }
  return null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const searchParams = request.nextUrl.searchParams;
  return withDatabase( async () => {
  const imgSize = parseInt(searchParams.get('imgSize') ?? '800');
  try {
    const location = await prisma.touristicLocation.findUnique({
      where: {
        id: params.id,
      },
      include: {
        aspectRatings: {
          include: {
            aspect: true,
          },
          orderBy: {
            generatedDate: 'desc'
          }
        },
        siteReviews: {
          orderBy: {
            extractedDate: 'desc'
          },
          take: 10,
          include: {
            user: true
          }
        }
      }
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Fetch the location image
    const processedImage = await fetchLocationImage(location.image, imgSize);

    // Create the response object with the processed image
    const responseData = {
      ...location,
      image: processedImage,
      aspectRatings: location.aspectRatings.map(rating => ({
        ...rating,
        rating: Math.round(rating.rating) // Ensure rating is a whole number for display
      }))
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error fetching location details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location details' },
      { status: 500 }
    );
  }
});
}