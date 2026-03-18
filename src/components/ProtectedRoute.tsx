"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the app is done loading and there is no user, kick them to login
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // STRICT GATE 1: While loading, ONLY show this full-screen spinner
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-teal-600 font-semibold tracking-widest text-sm uppercase">
          Checking Credentials...
        </div>
      </div>
    );
  }

  // STRICT GATE 2: If no user, render absolutely nothing while the router redirects them
  if (!user) {
    return null;
  }

  // STRICT GATE 3: If they pass the checks, ONLY render the Dashboard (the 'children')
  return <>{children}</>;
}