"use client";

import { useState, useEffect } from "react"; 
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";
import { Moon, Sun, Settings, LayoutDashboard, LogOut, Users, Calendar, Clock, CalendarDays } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  
  // The Hydration Fix State
  const [mounted, setMounted] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true)
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const getLinkClass = (path: string) => {
    const isActive = path === '/dashboard' ? pathname === path : pathname.startsWith(path);
    return `p-2.5 rounded-xl flex items-center justify-center group transition-all active:scale-95 ${
      isActive 
        ? "text-teal-700 bg-teal-100 dark:text-teal-400 dark:bg-teal-500/20 shadow-inner" 
        : "text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20"
    }`;
  };

  const confirmLogout = () => {
    setShowLogoutModal(true);
  };

  const handleLogout = async () => {
    setShowLogoutModal(false);
    await signOut(auth);
    toast.success("Successfully logged out.");
    router.push("/login");
  };

  return (
    <>
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
          className={getLinkClass("/dashboard")}
          aria-label="Dashboard"
          title="Dashboard"
        >
          <LayoutDashboard className={`w-5 h-5 transition-transform duration-300 ${pathname === '/dashboard' ? 'scale-110' : 'group-hover:scale-110'}`} />
        </Link>

        {/* Directory Link */}
        <Link
          href="/employees"
          className={getLinkClass("/employees")}
          aria-label="Directory"
          title="Employee Directory"
        >
          <Users className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/employees') ? 'scale-110' : 'group-hover:scale-110'}`} />
        </Link>

        {/* Leave Management Link */}
        <Link
          href="/leave"
          className={getLinkClass("/leave")}
          aria-label="Leave Management"
          title="Leave Management"
        >
          <Calendar className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/leave') ? 'scale-110' : 'group-hover:scale-110'}`} />
        </Link>
        
        {/* Timesheets Link */}
        <Link
          href="/timesheets"
          className={getLinkClass("/timesheets")}
          aria-label="Timesheets"
          title="Timesheets"
        >
          <Clock className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/timesheets') ? 'scale-110' : 'group-hover:scale-110'}`} />
        </Link>
        
        {/* Company Calendar Link */}
        <Link
          href="/calendar"
          className={getLinkClass("/calendar")}
          aria-label="Company Calendar"
          title="Company Calendar"
        >
          <CalendarDays className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/calendar') ? 'scale-110' : 'group-hover:scale-110'}`} />
        </Link>

        {/* Hydration-Safe Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-xl text-gray-600 dark:text-gray-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20 transition-all active:scale-95 flex items-center justify-center group min-w-[40px] min-h-[40px]"
          aria-label="Toggle Dark Mode"
          title="Toggle Theme"
        >
          {mounted && (
            theme === "dark" ? (
              <Sun className="w-5 h-5 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-5 h-5 group-hover:-rotate-12 transition-transform duration-300" />
            )
          )}
        </button>

        {/* FIXED: Settings Link (Visible to everyone, routes to /settings) */}
        <Link
          href="/settings"
          className={getLinkClass("/settings")}
          aria-label="Settings"
          title="Settings"
        >
          <Settings className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/settings') ? 'rotate-90' : 'group-hover:rotate-90'}`} />
        </Link>

        <button
          onClick={confirmLogout}
          className="px-4 py-2.5 ml-1 sm:ml-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 active:bg-rose-100 dark:active:bg-rose-500/20 transition-all active:scale-95 flex items-center gap-2 group"
          title="Logout"
        >
          <span className="hidden sm:inline">Logout</span>
          <LogOut className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>
    </nav>
      {/* Custom Logout Confirmation Modal */}
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
    </>
  );
}