"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { IoLogoGithub } from "react-icons/io5";
import { useSupabase } from "@/app/supabase-provider";

export default function Social({ redirectTo }: { redirectTo: string }) {
  const { supabase } = useSupabase();
  const origin = 'http://localhost:3000';
  async function loginWithProvider(provider: "github" | "google") {
    console.log(window.location.origin +
      `/auth/callback?next=` +
      redirectTo)
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo:
          `${origin}`,
        scopes:
          'https://www.googleapis.com/auth/userinfo.profile',
      },
    });
  };

  return (
    <div className="w-full flex gap-2">
      <Button
        className="w-full h-8 flex items-center gap-2"
        variant="outline"
        onClick={() => loginWithProvider("google")}
      >
        <FcGoogle />
        Google
      </Button>
    </div>
  );
}