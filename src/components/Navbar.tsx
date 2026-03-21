"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";
import { Moon, Sun, Settings, LayoutDashboard, LogOut } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await signOut(auth);
    toast.success("Successfully logged out.");
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-gray-200 dark:border-white/10 bg-white/70 dark:bg-black/40 backdrop-blur-md px-6 py-4 flex justify-between items-center transition-colors duration-500">
      <div className="flex items-center gap-3">
        {/* Small Logo */}
        <Link href="/dashboard" className="w-10 h-10 flex items-center justify-center">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25 65C15 65 10 55 15 45C18 38 25 35 30 35C35 20 55 15 65 25C75 20 85 25 90 35C95 45 90 60 75 60"
              stroke="#0f766e" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="42" y="30" width="15" height="40" fill="#ffffff" />
            <polygon points="42,30 49.5,20 57,30" fill="#ffffff" />
            <path d="M20 55 C 30 75, 55 75, 65 55 L 75 55 L 60 35 L 55 50" fill="#14b8a6" />
          </svg>
        </Link>
        <Link href="/dashboard">
          <h1 className="text-xl font-light tracking-wider hidden sm:block text-gray-900 dark:text-gray-100 transition-colors">
            Simpli<span className="font-semibold text-teal-600 dark:text-teal-400">Sync</span>
          </h1>
        </Link>
      </div>

      <div className="flex items-center gap-1 sm:gap-4">
        <div className="hidden lg:flex flex-col items-end mr-2">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold transition-colors">Logged in as</span>
          <span className="text-sm text-gray-700 dark:text-gray-200 font-medium transition-colors">{user?.email}</span>
        </div>

        <Link
          href="/dashboard"
          className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20 transition-all active:scale-95 flex items-center justify-center group"
          aria-label="Dashboard"
          title="Dashboard"
        >
          <LayoutDashboard className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
        </Link>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20 transition-all active:scale-95 flex items-center justify-center group"
          aria-label="Toggle Dark Mode"
          title="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        <Link
          href="/settings"
          className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20 transition-all active:scale-95 flex items-center justify-center group"
          aria-label="Settings"
          title="Settings"
        >
          <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
        </Link>

        <button
          onClick={handleLogout}
          className="px-4 py-2.5 ml-1 sm:ml-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:bg-rose-100 dark:active:bg-rose-500/20 transition-all active:scale-95 flex items-center gap-2 group"
          title="Logout"
        >
          <span className="hidden sm:inline">Logout</span>
          <LogOut className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </nav>
  );
}
