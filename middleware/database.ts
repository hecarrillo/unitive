// middleware/database.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function withDatabase(handler: () => Promise<NextResponse>) {
  try {
    return await handler()
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  } finally {
    // Explicitly handle the connection
    await prisma.$disconnect()
  }
}