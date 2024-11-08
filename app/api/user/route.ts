import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get session to verify the request
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user data from Supabase
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user.id;

    // Create or update user in database using upsert
    const upsertedUser = await prisma.user.upsert({
      where: {
        email: user.email!,
      },
      update: {
        avatarUrl: user.user_metadata.avatar_url,
      },
      create: {
        id: userId,
        email: user.email!,
        avatarUrl: user.user_metadata.avatar_url,
      },
    });

    return NextResponse.json({ user: upsertedUser });
  } catch (error) {
    console.error('Error in user registration:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}