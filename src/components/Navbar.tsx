"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { usePathname } from "next/navigation";
import {
  Settings, LayoutDashboard, Users, Calendar, Clock,
  CalendarDays, Sparkles, Banknote, Gift, Gavel,
  TrendingUp, FolderOpen, Activity, Menu, X,
  ChevronRight
} from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.email === "admin@simplisync.local";
  const [mounted, setMounted] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const isActive = (path: string) =>
    path === "/dashboard" ? pathname === path : pathname.startsWith(path);

  const linkClass = (path: string) =>
    `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer font-medium text-sm ${
      isActive(path)
        ? "bg-teal-500/10 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400 font-semibold shadow-xs dark:shadow-inner"
        : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/8 dark:hover:text-gray-100"
    }`;

  const adminLinkClass = linkClass;

  if (!mounted) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 pt-6 pb-5 border-b border-gray-200 dark:border-white/8 flex items-center gap-3 shrink-0">
        <Link href="/dashboard" className="relative w-9 h-9 shrink-0 flex items-center justify-center">
          <Image
            src="/simplifvlogo.png"
            alt="SimpliSync Logo"
            fill
            priority
            className="object-contain"
            sizes="36px"
          />
        </Link>
        <Link href="/dashboard" className="cursor-pointer">
          <h1 className="text-lg font-light tracking-wider text-gray-900 dark:text-gray-100 whitespace-nowrap">
            Simpli<span className="font-semibold text-teal-600 dark:text-teal-400">Sync</span>
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">HR Platform</p>
        </Link>
      </div>

      {/* Nav Links — scrollable */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 hide-scrollbar">

        {/* General Section */}
        <div>
          <p className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">General</p>
          <div className="space-y-1">
            <Link href="/dashboard" className={linkClass("/dashboard")} aria-label="Dashboard">
              <LayoutDashboard className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span>Dashboard</span>
              {isActive("/dashboard") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
            </Link>
            <Link
              href="/employees"
              className={linkClass("/employees")}
              aria-label={isAdmin ? "Employee Directories" : "My Profile"}
            >
              <Users className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span>{isAdmin ? "Employee Directories" : "My Profile"}</span>
              {isActive("/employees") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
            </Link>
            <Link href="/timesheets" className={linkClass("/timesheets")} aria-label="Timesheets">
              <Clock className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span>Timesheets</span>
              {isActive("/timesheets") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
            </Link>
            <Link href="/leave" className={linkClass("/leave")} aria-label="Leave Management">
              <Calendar className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span>Leave Management</span>
              {isActive("/leave") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
            </Link>
            <Link href="/calendar" className={linkClass("/calendar")} aria-label="Company Calendar">
              <CalendarDays className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
              <span>Company Calendar</span>
              {isActive("/calendar") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
            </Link>

            {/* Employee-only tool */}
            {user && !isAdmin && (
              <Link href="/201-file" className={linkClass("/201-file")} aria-label="My 201 File">
                <FolderOpen className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>My 201 File</span>
                {isActive("/201-file") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
              </Link>
            )}
          </div>
        </div>

        {/* Administration Section (Admin only) */}
        {isAdmin && (
          <div>
            <p className="px-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Administration</p>
            <div className="space-y-1">
              <Link href="/admin/dashboard" className={adminLinkClass("/admin/dashboard")} aria-label="Command Center">
                <Activity className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>Command Center</span>
                {isActive("/admin/dashboard") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
              </Link>
              <Link href="/admin/payroll" className={adminLinkClass("/admin/payroll")} aria-label="Payroll">
                <Banknote className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>Payroll & Compensation</span>
                {isActive("/admin/payroll") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
              </Link>
              <Link href="/admin/benefits" className={adminLinkClass("/admin/benefits")} aria-label="Benefits">
                <Gift className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>Benefits Administration</span>
                {isActive("/admin/benefits") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
              </Link>
              <Link href="/admin/disciplinary" className={adminLinkClass("/admin/disciplinary")} aria-label="Disciplinary">
                <Gavel className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>Disciplinary Advisor</span>
                {isActive("/admin/disciplinary") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
              </Link>
              <Link href="/admin/performance" className={adminLinkClass("/admin/performance")} aria-label="Performance">
                <TrendingUp className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>Performance Management</span>
                {isActive("/admin/performance") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
              </Link>
              <Link href="/admin/memo-generator" className={adminLinkClass("/admin/memo-generator")} aria-label="AI Policy Lab">
                <Sparkles className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                <span>AI Policy Lab</span>
                {isActive("/admin/memo-generator") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom: User info + Settings */}
      <div className="shrink-0 px-3 pb-4 pt-3 border-t border-gray-200 dark:border-white/8 space-y-1">
        <Link href="/settings" className={linkClass("/settings")} aria-label="Settings">
          <Settings className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:rotate-90" />
          <span>Settings</span>
          {isActive("/settings") && <ChevronRight className="w-3.5 h-3.5 ml-auto text-teal-600/70 dark:text-teal-400/60" />}
        </Link>

        {/* User badge */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl mt-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/8">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-[11px] font-bold text-white uppercase">
              {user?.email?.charAt(0) ?? "U"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Logged in as</p>
            <p className="text-xs text-gray-800 dark:text-gray-200 font-medium truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── DESKTOP SIDEBAR ─── */}
      <aside className="hidden lg:flex fixed top-0 left-0 z-50 h-screen w-[260px] flex-col bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-r border-gray-200 dark:border-white/8 transition-colors duration-300">
        <SidebarContent />
      </aside>

      {/* ─── MOBILE: Top bar + slide-in drawer ─── */}
      <div className="lg:hidden fixed top-0 left-0 z-50 w-full flex items-center justify-between px-4 py-3 bg-white/95 dark:bg-[#0b0f19]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/8 transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="relative w-8 h-8 flex items-center justify-center">
            <Image src="/simplifvlogo.png" alt="SimpliSync Logo" fill priority className="object-contain" sizes="32px" />
          </Link>
          <Link href="/dashboard">
            <h1 className="text-base font-light tracking-wider text-gray-900 dark:text-gray-100">
              Simpli<span className="font-semibold text-teal-600 dark:text-teal-400">Sync</span>
            </h1>
          </Link>
        </div>
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-[260px] flex flex-col bg-white dark:bg-[#0b0f19] border-r border-gray-200 dark:border-white/8 transition-transform duration-300 ease-in-out ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  );
}