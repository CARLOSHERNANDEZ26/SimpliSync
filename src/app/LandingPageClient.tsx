"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BrainCircuit, MapPin, Calculator, Scale, Sun, Moon, Mail, Phone, Calendar, Clock } from "lucide-react";

export default function LandingPageClient() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") return true;
      if (savedTheme === "light") return false;
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return true; 
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
  function update() {
    const now = new Date();
    const ph = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const h = ph.getHours(), m = ph.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    const hh = h % 12 || 12;
    const clockEl = document.getElementById("ph-clock");
    if (clockEl) clockEl.textContent = `${hh}:${String(m).padStart(2, "0")} ${ampm}`;

    const day = ph.getDate(), month = ph.getMonth(), year = ph.getFullYear();
    const lastDay = new Date(year, month + 1, 0).getDate();
    let cutoffDay = day <= 15 ? 15 : lastDay;
    let cutoffDate = new Date(year, month, cutoffDay);
    if (cutoffDate <= ph) {
      cutoffDate = cutoffDay === 15
        ? new Date(year, month, lastDay)
        : new Date(year, month + 1, 15);
      cutoffDay = cutoffDate.getDate();
    }
    const diff = Math.ceil((cutoffDate.getTime() - ph.getTime()) / (1000 * 60 * 60 * 24));
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const labelEl = document.getElementById("cutoff-label");
    const daysEl = document.getElementById("cutoff-days");
    if (labelEl) labelEl.textContent = `${months[cutoffDate.getMonth()]} ${cutoffDay}`;
    if (daysEl) daysEl.textContent = diff === 1 ? "(tomorrow)" : `(${diff} days)`;
  }
  update();
  const id = setInterval(update, 1000);
  return () => clearInterval(id);
}, []);

  return (
    <main className="min-h-screen flex flex-col w-full bg-slate-50 dark:bg-[#0b0f19] selection:bg-teal-500/30 font-sans overflow-x-hidden relative transition-colors duration-300">
      <div className="fixed top-0 left-0 w-[40rem] h-[40rem] bg-indigo-500/10 dark:bg-teal-500/5 rounded-full blur-[120px] pointer-events-none transition-all duration-500 -translate-x-1/4 -translate-y-1/4"></div>
      <div className="fixed bottom-0 right-0 w-[40rem] h-[40rem] bg-teal-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none transition-all duration-500 translate-x-1/4 translate-y-1/4"></div>

      <nav className="sticky top-0 z-50 w-full border-b border-gray-200/80 dark:border-teal-500/10 bg-white/70 dark:bg-[#0b0f19]/70 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-full overflow-hidden shadow-md shadow-indigo-500/10 shrink-0 bg-[#0d1117]">
              <Image src="/simplifvlogo.png" alt="SimplifV Logo" fill className="object-contain p-0.5" sizes="32px" />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-slate-100">
              Simpli<span className="text-emerald-600 dark:text-emerald-400">Sync</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl text-gray-500 hover:text-teal-600 dark:text-slate-400 dark:hover:text-teal-400 bg-gray-100 hover:bg-gray-200 dark:bg-[#131a2e] dark:hover:bg-[#1c2642] transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <a href="#features" className="hidden md:flex items-center justify-center text-sm font-bold text-gray-600 dark:text-slate-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              System Documentation
            </a>
            <Link href="/login" className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-[#0b0f19] px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col justify-center">
        <section className="relative z-10 max-w-7xl w-full mx-auto px-6 pt-16 sm:pt-24 pb-20 sm:pb-32 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            SimplifV Exclusive Deployment
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 dark:text-slate-100 tracking-tight mb-6 max-w-4xl leading-[1.1]">
            Intelligent HR & <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
              Geo-Fenced Attendance Tracking
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-slate-400 mb-10 max-w-3xl leading-relaxed">
            <strong className="text-gray-900 dark:text-slate-200">SympliSync:</strong> A Cloud-Hosted Human Resource Management Platform Featuring AI-Enhanced Policy Decision Support for SimplifV.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            {/* System status */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 dark:border-teal-500/10 bg-white dark:bg-[#131a2e]/60 text-sm text-gray-500 dark:text-slate-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              System operational
            </div>

            {/* Live PH clock */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 dark:border-teal-500/10 bg-white dark:bg-[#131a2e]/60 text-sm text-gray-500 dark:text-slate-400">
              <Clock className="w-4 h-4 text-teal-500" />
              PH time: <span className="font-semibold text-gray-900 dark:text-slate-100 ml-1" id="ph-clock" suppressHydrationWarning />
            </div>

            {/* Next payroll cutoff */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 dark:border-teal-500/10 bg-white dark:bg-[#131a2e]/60 text-sm text-gray-500 dark:text-slate-400">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Next cutoff: <span className="font-semibold text-gray-900 dark:text-slate-100 ml-1" id="cutoff-label" suppressHydrationWarning />
              <span className="text-xs text-gray-400 dark:text-slate-500" id="cutoff-days" suppressHydrationWarning />
            </div>

            {/* Geofence */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-gray-200 dark:border-teal-500/10 bg-white dark:bg-[#131a2e]/60 text-sm text-gray-500 dark:text-slate-400">
              <MapPin className="w-4 h-4 text-teal-500" />
              Geofence <span className="font-semibold text-gray-900 dark:text-slate-100 ml-1">active</span>
            </div>
          </div>
        </section>

        <section id="features" className="relative z-10 max-w-7xl w-full mx-auto px-6 pb-20 sm:pb-32 pt-10 scroll-mt-20">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-slate-100 mb-4">Enterprise-Grade Architecture</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">Engineered specifically to eliminate manual HR bottlenecks and mathematically enforce Philippine labor standards.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[#131a2e]/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-teal-500/10 shadow-xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
                <Calculator className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">DOLE Payroll Engine</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                Automated 15 day cut-off per month computations featuring 15-minute lateness ceilings, exact 125% OT premiums, and statutory deductions.
              </p>
            </div>
            <div className="bg-white dark:bg-[#131a2e]/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-teal-500/10 shadow-xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Smart Geofencing</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                Eliminate buddy-punching and time theft. Attendance logs are mathematically locked to the SimplifV office radius coordinates.
              </p>
            </div>
            <div className="bg-white dark:bg-[#131a2e]/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-teal-500/10 shadow-xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center mb-6">
                <BrainCircuit className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">AI Policy Advisor</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                Agentic RAG implementation provides 24/7, hallucination-free answers to employee inquiries based exactly on company memos.
              </p>
            </div>
            <div className="bg-white dark:bg-[#131a2e]/60 backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-teal-500/10 shadow-xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
                <Scale className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-3">Compliance Trails</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
                System audit logs and a DOLE-compliant 13th-Month Pay generator to help with the company&apos;s efficiency during labor audits.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="relative w-full z-10 border-t border-gray-200 dark:border-teal-500/10 bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-200/80 dark:border-teal-500/10">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 relative rounded-full overflow-hidden shadow-sm shrink-0 bg-[#0d1117]">
                <Image src="/simplifvlogo.png" alt="SimplifV Logo" fill className="object-contain p-0.5" sizes="24px" />
              </div>
              <span className="text-base font-black tracking-tight text-gray-900 dark:text-slate-100">
                Sympli<span className="text-emerald-600 dark:text-emerald-400">Sync</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-3 text-xs font-semibold text-gray-600 dark:text-slate-400 text-center">
              <div className="flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                <Mail className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <a href="mailto:consult@simplifv.com">consult@simplifv.com</a>
              </div>
              <span className="hidden md:inline text-gray-300 dark:text-white/10">•</span>
              <div className="flex items-center gap-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                <Phone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <a href="tel:09171300418">0917 130 0418</a>
              </div>
              <span className="hidden md:inline text-gray-300 dark:text-white/10">•</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>Baraca-Camachile, Subic, Zambales</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-6 pt-8">
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-slate-500 text-center sm:text-left">
              © 2026 SympliSync Solutions. All rights reserved. Exclusively deployed for SimplifV.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}