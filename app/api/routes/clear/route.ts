import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { appCache } from '@/lib/cache';
import { withDatabase } from '@/middleware/database';

export async function DELETE(request: NextRequest) {
  return withDatabase( async () => {
    try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await prisma.userRouteLocation.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Invalidate cache after clearing route
    const cacheKey = `routes:${user.id}`;
    appCache.clear(); // You might want to only delete this specific key instead

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
});
}