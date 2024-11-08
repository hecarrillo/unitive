// middleware/database.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import prisma from '@/lib/prisma'

export async function databaseMiddleware(
  request: NextRequest,
  next: () => Promise<NextResponse>
) {
  try {
    // Ensure connection is alive
    await prisma.$queryRaw`SELECT 1`
    return await next()
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  } finally {
    // Clean up any lingering connections
    await prisma.$disconnect()
  }
}