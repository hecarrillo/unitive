"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createPagesBrowserClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/gotrue-js";
import type { SupabaseClient } from "@supabase/auth-helpers-nextjs";

type SupabaseContext = {
  supabase: SupabaseClient;
  session: Session | null;
  user: Session["user"] | null;
  signOut: () => Promise<void>;
};

const Context = createContext<SupabaseContext | undefined>(undefined);

export default function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createPagesBrowserClient());
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<Session["user"] | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function getActiveSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    }
    getActiveSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null)
    });

    return () => {
      subscription.unsubscribe();
    };  
  }, [router, supabase]);

  return (
    <Context.Provider value={{
      supabase, 
      session,  
      user,
      signOut: async () => {
        await supabase.auth.signOut(); 
        router.push('/');
      },
    }}>
      <>{children}</>
    </Context.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(Context);

  if (context === undefined) {
    throw new Error("useSupabase must be used inside SupabaseProvider");
  }

  return context;
};