"use client";

import { useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import EmployeeProfileView from "@/components/EmployeeProfileView";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function EmployeeProfilePage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id; 
  
  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />
        
        <div className="relative z-20 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-8 -mb-2">
          <Link href="/employees" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl transition-all shadow-sm group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Directory
          </Link>
        </div>

        {id && <EmployeeProfileView userId={id} />}
      </main>
    </ProtectedRoute>
  );
}