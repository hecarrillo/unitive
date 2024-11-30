// app/api/routes/clear/route.ts
import prisma from '@/lib/prisma';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { withDatabase } from '@/middleware/database';

export async function DELETE() {
  return withDatabase(async () => {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user) {
        return new NextResponse('Unauthorized', { status: 401 });
      }
  
      // Delete all route locations for the user
      await prisma.userRouteLocation.deleteMany({
        where: {
          userId: user.id
        }
      });
  
      return NextResponse.json({ message: 'All routes cleared' });
    } catch (error) {
      console.error('Error clearing routes:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  }) 
}