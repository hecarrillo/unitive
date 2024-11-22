// middleware/database.ts
import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function withDatabase<T>(handler: () => Promise<T>) {
  try {
    const result = await handler()
    return result
  } catch (error) {
    console.error('Database error:', error)
    
    // Check if it's a connection error
    if (error instanceof Error && error.message.includes("Can't reach database server")) {
      await prisma.$disconnect()
      
      // Retry once
      try {
        const result = await handler()
        return result
      } catch (retryError) {
        console.error('Retry failed:', retryError)
        return NextResponse.json(
          { error: 'Database Connection Error' },
          { status: 503 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}