"use client";

import { useState, useEffect } from "react"; 
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import { 
  Settings, LayoutDashboard, Users, Calendar, Clock, 
  CalendarDays, Sparkles, Banknote, Gift, Gavel, 
  TrendingUp, FolderOpen, Activity, Menu, X 
} from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.email === "admin@simplisync.local";
  const [mounted, setMounted] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true)
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const getLinkClass = (path: string, isMobile = false) => { 
    const isActive = path === '/dashboard' ? pathname === path : pathname.startsWith(path);
    const baseClass = isMobile 
      ? "w-full p-3 rounded-xl flex items-center gap-3 transition-all font-medium" 
      : "p-2.5 rounded-xl flex items-center justify-center group transition-all active:scale-95";
      
    return `${baseClass} ${
      isActive 
        ? "text-teal-700 bg-teal-100 dark:text-teal-400 dark:bg-teal-500/20 shadow-inner" 
        : "text-gray-600 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-gray-100 dark:hover:bg-white/10 active:bg-gray-200 dark:active:bg-white/20"
    }`;
  };

  if (!mounted) return null; 

  return (
    <nav className="fixed top-0 left-0 z-50 w-full border-b border-gray-200 dark:border-white/10 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md transition-colors duration-500">
      <div className="px-6 py-4 flex justify-between items-center max-w-[1600px] mx-auto">
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

        {/* --- DESKTOP NAVIGATION --- */}
        <div className="hidden lg:flex items-center gap-2">
          <div className="flex flex-col items-end mr-4 pr-4 border-r border-gray-200 dark:border-white/10">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold transition-colors">Logged in as</span>
            <span className="text-xs text-gray-700 dark:text-gray-200 font-medium transition-colors">{user?.email}</span>
          </div>

          <Link href="/dashboard" className={getLinkClass("app/dashboard")} aria-label="Dashboard" title="Dashboard">
            <LayoutDashboard className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          </Link>
          <Link href="/employees" className={getLinkClass("/employees")} aria-label="Directory" title="Employee Directory">
            <Users className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          </Link>
          <Link href="/timesheets" className={getLinkClass("/timesheets")} aria-label="Timesheets" title="Timesheets">
            <Clock className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          </Link>
          <Link href="/leave" className={getLinkClass("/leave")} aria-label="Leave Management" title="Leave Management">
            <Calendar className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          </Link>
          <Link href="/calendar" className={getLinkClass("/calendar")} aria-label="Company Calendar" title="Company Calendar">
            <CalendarDays className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          </Link>

          {/* Admin Tools */}
          {isAdmin && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-white/10">
              <Link href="/admin/dashboard" className={getLinkClass("/admin/dashboard")} aria-label="Command Center" title="Command Center">
                <Activity className="w-5 h-5 text-indigo-500 transition-transform duration-300 group-hover:scale-110" />
              </Link>
              <Link href="/admin/memo-generator" className={getLinkClass("/admin/memo-generator")} aria-label="AI Policy Lab" title="Policy and Memo Lab">
                <Sparkles className="w-5 h-5 text-indigo-400 transition-transform duration-300 group-hover:scale-110" />
              </Link>
              <Link href="/admin/payroll" className={getLinkClass("/admin/payroll")} aria-label="Payroll" title="Payroll & Compensation">
                <Banknote className="w-5 h-5 text-emerald-500 transition-transform duration-300 group-hover:scale-110" />
              </Link>
              <Link href="/admin/benefits" className={getLinkClass("/admin/benefits")} aria-label="Benefits" title="Benefits Administration">
                <Gift className="w-5 h-5 text-rose-500 transition-transform duration-300 group-hover:scale-110" />
              </Link>
              <Link href="/admin/disciplinary" className={getLinkClass("/admin/disciplinary")} aria-label="Disciplinary Advisor" title="Disciplinary Advisor">
                <Gavel className="w-5 h-5 text-rose-500 transition-transform duration-300 group-hover:scale-110" />
              </Link>
              <Link href="/admin/performance" className={getLinkClass("/admin/performance")} aria-label="Performance" title="Performance Management">
                <TrendingUp className="w-5 h-5 text-indigo-500 transition-transform duration-300 group-hover:scale-110" />
              </Link>
            </div>
          )}

          {/* Employee Tool */}
          {user && !isAdmin && (
            <Link href="/201-file" className={getLinkClass("/201-file")} aria-label="My 201 File" title="My 201 File">
              <FolderOpen className="w-5 h-5 text-teal-500 transition-transform duration-300 group-hover:scale-110" />
            </Link>
          )}

          <Link href="/settings" className={getLinkClass("/settings")} aria-label="Settings" title="Settings">
            <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
          </Link>
        </div>

        {/* --- MOBILE NAVIGATION TOGGLE --- */}
        <div className="lg:hidden flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* --- MOBILE ACCORDION MENU --- */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-[73px] left-0 w-full max-h-[80vh] overflow-y-auto bg-white dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-white/10 shadow-2xl px-6 py-4 flex flex-col gap-2">
          <div className="mb-4 pb-4 border-b border-gray-100 dark:border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Account</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.email}</p>
          </div>

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">General</p>
          <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/dashboard", true)}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/employees" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/employees", true)}>
            <Users className="w-5 h-5" /> Directory
          </Link>
          <Link href="/timesheets" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/timesheets", true)}>
            <Clock className="w-5 h-5" /> Timesheets
          </Link>
          <Link href="/leave" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/leave", true)}>
            <Calendar className="w-5 h-5" /> Leave Management
          </Link>
          
          {user && !isAdmin && (
            <Link href="/201-file" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/201-file", true)}>
              <FolderOpen className="w-5 h-5 text-teal-500" /> My 201 File
            </Link>
          )}

          {isAdmin && (
            <>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4">Administration</p>
              <Link href="/admin/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/admin/dashboard", true)}>
                <Activity className="w-5 h-5 text-indigo-500" /> Command Center
              </Link>
              <Link href="/admin/payroll" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/admin/payroll", true)}>
                <Banknote className="w-5 h-5 text-emerald-500" /> Payroll & Compensation
              </Link>
              <Link href="/admin/benefits" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/admin/benefits", true)}>
                <Gift className="w-5 h-5 text-rose-500" /> Benefits Administration
              </Link>
              <Link href="/admin/disciplinary" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/admin/disciplinary", true)}>
                <Gavel className="w-5 h-5 text-rose-500" /> Disciplinary Advisor
              </Link>
              <Link href="/admin/performance" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/admin/performance", true)}>
                <TrendingUp className="w-5 h-5 text-indigo-500" /> Performance Management
              </Link>
              <Link href="/admin/memo-generator" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/admin/memo-generator", true)}>
                <Sparkles className="w-5 h-5 text-indigo-400" /> AI Policy Lab
              </Link>
            </>
          )}

          <div className="border-t border-gray-100 dark:border-white/5 mt-4 pt-4">
            <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)} className={getLinkClass("/settings", true)}>
              <Settings className="w-5 h-5" /> Settings
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}