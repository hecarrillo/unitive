// app/api/reports/[reportId]/route.ts
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'
import { appCache } from '@/lib/cache'
import { withDatabase } from '@/middleware/database'

export async function DELETE(
  req: Request,
  { params }: { params: { reportId: string } }
) {
  return withDatabase(async () => {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      const reportId = parseInt(params.reportId)

      if (isNaN(reportId)) {
        return NextResponse.json(
          { error: 'Invalid report ID' },
          { status: 400 }
        )
      }

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }

      // Find the report
      const report = await prisma.locationUserReport.findUnique({
        where: { id: reportId }
      })

      if (!report) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        )
      }

      // Check if the user owns the report
      if (report.userId !== user.id) {
        return NextResponse.json(
          { error: 'Unauthorized to delete this report' },
          { status: 403 }
        )
      }

      // Delete the report
      await prisma.locationUserReport.delete({
        where: { id: reportId }
      })

      // Invalidate cache
      appCache.deletePattern(`location:${report.locationId}`)

      return NextResponse.json(
        { message: 'Report deleted successfully' },
        { status: 200 }
      )

    } catch (error) {
      console.error('Error deleting report:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}