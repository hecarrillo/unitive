"use client";

import { FC } from 'react';
import Map from './MapLayout';
import { useSupabase } from '@/app/supabase-provider';

const Main: FC = () => {
  const { signOut, session } = useSupabase();
  return (
    <div className="relative h-screen w-full">
      {/* Map Component */}
      <main className="h-full w-full">
        { session ? <Map/> : null }
      </main>
    </div>
  );
};

export default Main;