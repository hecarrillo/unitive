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
  const { isRegistering, error, isRegistered } = useRegisterUser(session);
  
  // session will be undefined during loading, and null when there's no session
  const isLoading = typeof session === 'undefined';

  const queryString = typeof window !== "undefined" ? window?.location.search : "";
  const urlParams = new URLSearchParams(queryString);
  const next = urlParams.get("next");

  // If we have a session and registration is complete, redirect
  React.useEffect(() => {
    if (session && isRegistered && !error) {
      router.push(next || "/");
    }
  }, [session, isRegistered, error, router, next]);

  // Show loading spinner during initial load or registration
  if (isLoading || (session && isRegistering)) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
      </div>
    );
  }

  // Show error if registration failed
  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900 text-red-500 dark:text-red-100 p-4 rounded-md">
          An error occurred: {error}
        </div>
      </div>
    );
  }

  // Show nothing if we have a session (will redirect)
  if (session) {
    return null;
  }

  // Show login form if no session
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="w-full max-w-md mx-4 bg-white dark:bg-zinc-900 overflow-y-auto shadow sm:p-5 border dark:border-zinc-800 rounded-md">
          <div className="p-5 space-y-5">
            <div className="text-center space-y-3">
              <Image
                src="/unitive-logo.png"
                alt="unitive logo"
                width={200}
                height={200}
                className="rounded-full mx-auto"
                priority
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
  );
}