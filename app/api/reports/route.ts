// app/api/reports/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { appCache } from '@/lib/cache'
import { withDatabase } from '@/middleware/database'
import { z } from 'zod'

// Validation schema for creating a report
const reportSchema = z.object({
  locationId: z.string(),
  body: z.string().min(10).max(1000),
})

export async function POST(req: Request) {
  return withDatabase(async () => {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Parse and validate request body
      const body = await req.json()
      const validationResult = reportSchema.safeParse(body)
      
      if (!validationResult.success) {
        return NextResponse.json(
          { error: validationResult.error.errors },
          { status: 400 }
        )
      }

      const { locationId, body: reportBody } = validationResult.data

      // Check if location exists
      const location = await prisma.touristicLocation.findUnique({
        where: { id: locationId }
      })

      if (!location) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 }
        )
      }

      // Check if user has already reported this location
      const existingReport = await prisma.locationUserReport.findFirst({
        where: {
          locationId,
          userId: user.id
        }
      })

      if (existingReport) {
        return NextResponse.json(
          { error: 'You have already reported this location' },
          { status: 409 }
        )
      }

      // Create new report
      const report = await prisma.locationUserReport.create({
        data: {
          locationId,
          body: reportBody,
          userId: user.id,
          created: new Date()
        }
      })

      // Invalidate cache
      appCache.deletePattern(`location:${locationId}`)

      return NextResponse.json(report, { status: 201 })

    } catch (error) {
      console.error('Error handling request:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

export async function GET(req: Request) {
  return withDatabase(async () => {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      const { searchParams } = new URL(req.url)
      const locationId = searchParams.get('locationId')
      const userId = searchParams.get('userId')

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      if (!locationId && !userId) {
        return NextResponse.json(
          { error: 'Either locationId or userId is required' },
          { status: 400 }
        )
      }

      const reports = await prisma.locationUserReport.findMany({
        where: {
          ...(locationId && { locationId }),
          ...(userId && { userId })
        },
        include: {
          location: {
            select: {
              name: true,
              image: true
            }
          },
          user: {
            select: {
              email: true,
              avatarUrl: true
            }
          }
        },
        orderBy: {
          created: 'desc'
        }
      })

      return NextResponse.json(reports)

    } catch (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}