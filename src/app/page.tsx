"use client";

import dynamic from "next/dynamic";

const LandingPageClient = dynamic(() => import("./LandingPageClient"), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]" />
});

export default function Home() {
  return <LandingPageClient />;
}