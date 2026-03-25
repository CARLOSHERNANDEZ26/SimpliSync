"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import ProfileSettings from "@/components/ProfileSettings";
import AdminSettings from "@/components/AdminSettings";
import HolidaySettings from "@/components/HolidaySettings";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full bg-slate-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-sans relative overflow-hidden transition-colors duration-500 pt-[73px]">
        {/* Dynamic Background Glows */}
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="flex flex-col space-y-8 animate-fade-in-up">
            <div className="space-y-4 text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 transition-colors">
                Settings
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 transition-colors">
                Manage your profile and application preferences.
              </p>
            </div>

            <div className={`grid grid-cols-1 ${isAdmin ? "lg:grid-cols-2" : ""} gap-6 items-stretch`}>
              {!isAdmin && (
                <div className="w-full">
                  <ProfileSettings />
                </div>
              )}
              {isAdmin && (
                <>
                  <div className="w-full">
                    <AdminSettings />
                  </div>
                  <div className="w-full">
                    <HolidaySettings />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
