import type { Metadata } from "next";
import localFont from "next/font/local";
import SupabaseProvider from './supabase-provider'
import { FilterProvider } from './contexts/FilterContext'
import NavBar from '../components/NavBar/NavBar'
import Register from '@/components/supaauth/register';
import { ToastStateProvider, Toaster } from "@/components/ui/toast"
import { Analytics } from "@vercel/analytics/react"
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Unitive",
  description: "Geolocation App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider>
          <Register/>
          <NavBar/>
          <ToastStateProvider>
          <FilterProvider>
            {children}
            <Analytics/>
          </FilterProvider>
          <Toaster />
          </ToastStateProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
