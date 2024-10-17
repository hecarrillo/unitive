"use client";
import React, { useState, useEffect } from "react";
import SignUp from "./signup";
import Social from "./social";
import Image from "next/image";
import { useSupabase } from "@/app/supabase-provider";


export default function Register() {
  const {session} = useSupabase();

  const queryString = typeof window !== "undefined" ? window?.location.search : "";
  const urlParams = new URLSearchParams(queryString);
  const next = urlParams.get("next");

  if (session) {
    return null;
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40"></div>
      <div className="fixed right-0 top-0 bottom-0 w-[30%] bg-white dark:bg-zinc-900 z-50 overflow-y-auto">
        <div className="flex min-h-screen flex-col items-center justify-center p-6">
          <div className="w-full shadow sm:p-5 border dark:border-zinc-800 rounded-md">
            <div className="p-5 space-y-5">
              <div className="text-center space-y-3">
                <Image
                  src={"/unitive-logo.png"}
                  alt="supabase logo"
                  width={50}
                  height={50}
                  className="rounded-full mx-auto"
                />
                <h1 className="font-bold">Create Account</h1>
                <p className="text-sm">
                  Welcome! Please register using your google account to get started.
                </p>
              </div>
              <Social redirectTo={next || "/"} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}