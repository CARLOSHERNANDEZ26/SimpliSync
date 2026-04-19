"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Moon, Sun, LogOut, Monitor } from "lucide-react";

export default function PreferencesSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await signOut(auth);
    toast.success("Successfully logged out.");
    router.push("/login");
  };

  return (
    <div className="w-full h-full bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl p-6 relative overflow-hidden flex flex-col justify-between">
      <div className="relative z-10">
        <h3 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">Preferences</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your local app experience and account session.</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10">
            <div className="flex items-start gap-3">
              <div className="mt-1 text-teal-600 dark:text-teal-400 hidden sm:block"><Monitor className="w-5 h-5"/></div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Appearance</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Toggle between light and dark mode.</p>
              </div>
            </div>
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-3 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/20 transition-all active:scale-95 shadow-sm"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-200 dark:border-rose-500/20">
             <div className="flex items-start gap-3">
              <div className="mt-1 text-rose-500 hidden sm:block"><LogOut className="w-5 h-5"/></div>
              <div>
                <p className="font-semibold text-rose-800 dark:text-rose-400">Log Out</p>
                <p className="text-xs text-rose-600/70 dark:text-rose-400/70 mt-0.5">End your current session.</p>
              </div>
            </div>
            <button
                onClick={() => setShowLogoutModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white transition-all font-medium shadow-md shadow-rose-500/30 active:scale-95 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 border border-gray-200 dark:border-white/10 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Logout</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to log out of your account?</p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors font-medium active:scale-95"
              >
                Cancel
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white transition-all font-medium shadow-md shadow-rose-500/30 active:scale-95 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
