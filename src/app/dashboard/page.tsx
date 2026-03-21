"use client";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import ClockInButton from "@/components/ClockInButton";
import ClockOutButton from "@/components/ClockOutButton";
import AdminLogsTable from "@/components/AdminLogsTable";
import EmployeeHistoryTable from "@/components/EmployeeHistoryTable";
import AdminSettings from "@/components/AdminSettings"; // 1. IMPORT ADDED
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isAdmin = user?.email === "admin@simplisync.local";

  // Removed the unused handleLogout function!

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full bg-slate-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-sans relative transition-colors duration-500 pt-[73px]">
        {/* Dynamic Background Glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px]"></div>
          <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px]"></div>
        </div>

        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
            
          {/* Left Column: Greeting & Actions */}
          <div className="w-full lg:w-1/3 flex flex-col space-y-8 animate-fade-in-up lg:sticky lg:top-28 lg:self-start">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 transition-colors">
                Welcome back, <br className="hidden sm:block lg:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-400 dark:from-teal-400 dark:to-emerald-300">
                  {user?.email?.split('@')[0]}
                </span>
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 transition-colors">
                Your HR Dashboard is ready for your shift.
              </p>
            </div>

            {/* Time Tracking Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xl shadow-teal-500/5 dark:shadow-black/20">
              <div className="flex flex-col gap-6 items-center w-full">
                <div className="w-full flex justify-center">
                  <ClockInButton />
                </div>
                <div className="w-full h-px bg-gray-200 dark:bg-white/10"></div> 
                <div className="w-full flex justify-center">
                  <ClockOutButton />
                </div>
              </div>
            </div>

          </div>

            {/* Right Column: Logs / History */}
            <div className="w-full lg:w-2/3 flex flex-col space-y-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              {isAdmin && (
                <div className="mb-2">
                  <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                    Admin View Only
                  </span>
                </div>
              )}
              
              {/* Tables & Settings */}
              {/* 2. FIXED COMMENT AND ADDED GAP UTILITY */}
              <div className="w-full flex flex-col gap-8">
                {isAdmin ? <AdminLogsTable /> : <EmployeeHistoryTable /> } 
                
              {/* 3. RESTORED ADMIN SETTINGS */}
              {/*isAdmin && <AdminSettings />*/}
              </div>
            </div>

          </div>
        </div>

        {/* Mobile Scroll-to-Top Button */}
        <button
          onClick={scrollToTop}
          className={`md:hidden fixed bottom-6 right-6 p-4 rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-xl shadow-teal-500/30 dark:shadow-teal-900/40 z-50 transition-all duration-300 active:scale-95 ${
            showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
          }`}
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      </main>
    </ProtectedRoute>
  );
}