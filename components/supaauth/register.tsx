"use client";
import React from "react";
import SignUp from "./signup";
import Social from "./social";
import Image from "next/image";
import { useSupabase } from "@/app/supabase-provider";

export default function Register() {
  const { session } = useSupabase();
  
  // session will be undefined during loading, and null when there's no session
  const isLoading = typeof session === 'undefined';

  const queryString = typeof window !== "undefined" ? window?.location.search : "";
  const urlParams = new URLSearchParams(queryString);
  const next = urlParams.get("next");

  return (
    <>
      {session || isLoading ? null : 
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