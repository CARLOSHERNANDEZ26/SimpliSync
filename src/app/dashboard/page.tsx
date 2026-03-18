"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import ClockInButton from "@/components/ClockInButton";
import ClockOutButton from "@/components/ClockOutButton";
import AdminLogsTable from "@/components/AdminLogsTable";

export default function DashboardPage() {
  // 1. We don't need 'loading' here anymore! ProtectedRoute handles it.
  const { user } = useAuth(); 
  const router = useRouter();

  const isAdmin = user?.email === "admin@simplisync.local";

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  // NOTICE: I deleted the useEffect, the if(loading) screen, and the if(!user) block!

  return (
    // 2. ProtectedRoute does all the heavy lifting for us right here.
    <ProtectedRoute>
      <main className="min-h-screen w-full bg-slate-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-sans relative overflow-hidden transition-colors duration-500">
        {/* Dynamic Background Glows */}
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Navigation Bar */}
        <nav className="relative z-20 w-full border-b border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 transition-colors duration-500">
          <div className="flex items-center gap-3">
            {/* Small Logo */}
            <div className="w-10 h-10 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M25 65C15 65 10 55 15 45C18 38 25 35 30 35C35 20 55 15 65 25C75 20 85 25 90 35C95 45 90 60 75 60" 
                      stroke="#0f766e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="42" y="30" width="15" height="40" fill="#ffffff" />
                <polygon points="42,30 49.5,20 57,30" fill="#ffffff" />
                <path d="M20 55 C 30 75, 55 75, 65 55 L 75 55 L 60 35 L 55 50" fill="#14b8a6" />
              </svg>
            </div>
            <h1 className="text-xl font-light tracking-wider hidden sm:block text-gray-900 dark:text-gray-100 transition-colors">
              Simpli<span className="font-semibold text-teal-600 dark:text-teal-400">Sync</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold transition-colors">Logged in as</span>
              <span className="text-sm text-gray-700 dark:text-gray-200 font-medium transition-colors">{user?.email}</span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-white/20 transition-all active:scale-95 flex items-center gap-2"
            >
              <span>Logout</span>
              <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center">
          
          <div className="w-full text-center space-y-4 mb-12 animate-fade-in-up">
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 transition-colors">
              Welcome back, <br className="sm:hidden"/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-emerald-400 dark:from-teal-400 dark:to-emerald-300">
                {user?.email?.split('@')[0]}
              </span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 transition-colors">Your HR Dashboard is ready for your shift.</p>
          </div>
          

          {/* Widgets Grid - Currently just the Clock In Button */}
          <div className="w-full grid grid-cols-1 place-items-center">
            <ClockInButton />
            <ClockOutButton />
          </div>

          {/* Admin Table Widget */}
          {isAdmin && (
            <div className="w-full mt-12 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="mb-4 text-center">
              <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                Admin View Only
              </span>
            </div>
            <AdminLogsTable />
          </div>
          )}

        </div>
      </main>
    </ProtectedRoute>
  );
}