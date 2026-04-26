"use client";

import { useState, useEffect } from "react"; 
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { Settings, LayoutDashboard, Users, Calendar, Clock, CalendarDays, Sparkles, Banknote, Gift, Gavel, TrendingUp } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.email === "admin@simplisync.local";
  const [mounted, setMounted] = useState(false); 

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
  if (!mounted) return null; 

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

        <Link href="/dashboard" className={getLinkClass("/dashboard")} aria-label="Dashboard" title="Dashboard">
          <LayoutDashboard className={`w-5 h-5 transition-transform duration-300 ${pathname === '/dashboard' ? 'scale-110' : 'group-hover:scale-110'}`} />
        </Link>

        {/* Directory Link */}
        <Link href="/employees" className={getLinkClass("/employees")} aria-label="Directory" title="Employee Directory">
          <Users className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/employees') ? 'scale-110' : 'group-hover:scale-110'}`} />
        </Link>
        
        {/* Timesheets Link */}
        <Link href="/timesheets" className={getLinkClass("/timesheets")} aria-label="Timesheets" title="Timesheets">
          <Clock className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/timesheets') ? 'scale-110' : 'group-hover:scale-110'}`} />
        </Link>

        {/* Leave Management Link */}
        <Link href="/leave" className={getLinkClass("/leave")} aria-label="Leave Management" title="Leave Management">
          <Calendar className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/leave') ? 'scale-110' : 'group-hover:scale-110'}`} />
        </Link>
        
        {/* Company Calendar Link */}
        <Link href="/calendar" className={getLinkClass("/calendar")} aria-label="Company Calendar" title="Company Calendar">
          <CalendarDays className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/calendar') ? 'scale-110' : 'group-hover:scale-110'}`} />
        </Link>

        {/* AI Policy Lab (Only renders for the Admin) */}
        {isAdmin && (
          <Link href="/admin/memo-generator" className={getLinkClass("/admin/memo-generator")} aria-label="AI Policy Lab" title="Policy and Memo Lab">
            <Sparkles className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/admin/memo-generator') ? 'scale-110 text-indigo-500' : 'group-hover:scale-110 text-indigo-500'}`} />
          </Link>
        )}

        {/* Payroll Setup */}
        {isAdmin && (
          <Link href="/admin/payroll" className={getLinkClass("/admin/payroll")} aria-label="Payroll" title="Payroll & Compensation">
            <Banknote className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/admin/payroll') ? 'scale-110 text-emerald-500' : 'group-hover:scale-110 text-emerald-500'}`} />
          </Link>
        )}

        {/* Benefits & 13th Month */}
        {isAdmin && (
          <Link href="/admin/benefits" className={getLinkClass("/admin/benefits")} aria-label="Benefits" title="Benefits Administration">
            <Gift className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/admin/benefits') ? 'scale-110 text-rose-500' : 'group-hover:scale-110 text-rose-500'}`} />
          </Link>
        )}

        {/* Disciplinary Advisor */}
        {isAdmin && (
          <Link href="/admin/disciplinary" className={getLinkClass("/admin/disciplinary")} aria-label="Disciplinary Advisor" title="Disciplinary Advisor">
            <Gavel className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/admin/disciplinary') ? 'scale-110 text-rose-500' : 'group-hover:scale-110 text-rose-500'}`} />
          </Link>
        )}

        {/* Performance Management */}
        {isAdmin && (
          <Link href="/admin/performance" className={getLinkClass("/admin/performance")} aria-label="Performance" title="Performance Management">
            <TrendingUp className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/admin/performance') ? 'scale-110 text-indigo-500' : 'group-hover:scale-110 text-indigo-500'}`} />
          </Link>
        )}
        {/* Settings Link */}
        <Link href="/settings" className={getLinkClass("/settings")} aria-label="Settings" title="Settings">
          <Settings className={`w-5 h-5 transition-transform duration-300 ${pathname.startsWith('/settings') ? 'rotate-90' : 'group-hover:rotate-90'}`} />
        </Link>
      </div>
    </nav>
  );
}