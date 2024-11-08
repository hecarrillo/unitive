"use client";
import React from "react";
import Social from "./social";
import Image from "next/image";
import { useSupabase } from "@/app/supabase-provider";
import { useRegisterUser } from "@/hooks/useRegisterUser";
import { useRouter } from "next/navigation";

export default function Register() {
  const { session } = useSupabase();
  const router = useRouter();
  const { isRegistering, error } = useRegisterUser(session);
  
  // session will be undefined during loading, and null when there's no session
  const isLoading = typeof session === 'undefined';

  const queryString = typeof window !== "undefined" ? window?.location.search : "";
  const urlParams = new URLSearchParams(queryString);
  const next = urlParams.get("next");

  // If we have a session and registration is complete, redirect
  React.useEffect(() => {
    if (session && !isRegistering && !error) {
      router.push(next || "/");
    }
  }, [session, isRegistering, error, router, next]);

  if (isLoading || isRegistering) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          An error occurred: {error}
        </div>
      </div>
    );
  }

  return (
    <>
      {session ? null : 
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="w-[30%] bg-white dark:bg-zinc-900 overflow-y-auto shadow sm:p-5 border dark:border-zinc-800 rounded-md">
              <div className="p-5 space-y-5">
                <div className="text-center space-y-3">
                  <Image
                    src={"/unitive-logo.png"}
                    alt="supabase logo"
                    width={200}
                    height={200}
                    className="rounded-full mx-auto"
                  />
                  <h1 className="font-bold">Login/Create Account</h1>
                  <p className="text-sm">
                    Welcome! Please register using your google account to get started.
                  </p>
                </div>
                <Social redirectTo={next || "/"} />
              </div>
            </div>
          </div>
        </>
      }
    </>
  );
}