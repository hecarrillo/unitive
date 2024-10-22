// app/api/aspects/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const aspects = await prisma.aspect.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json(aspects);
  } catch (error) {
    console.error('Error fetching aspects:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}