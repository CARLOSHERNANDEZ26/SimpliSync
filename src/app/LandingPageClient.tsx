"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BrainCircuit, MapPin, Calculator, Scale, Sun, Moon, Mail, Phone } from "lucide-react";

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

  return (
    <main className="min-h-screen flex flex-col w-full bg-slate-50 dark:bg-[#0a0a0a] selection:bg-indigo-500/30 font-sans overflow-x-hidden relative transition-colors duration-300">
      <div className="fixed top-0 left-0 w-[40rem] h-[40rem] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none transition-all duration-500 -translate-x-1/4 -translate-y-1/4"></div>
      <div className="fixed bottom-0 right-0 w-[40rem] h-[40rem] bg-teal-500/10 dark:bg-teal-500/20 rounded-full blur-[120px] pointer-events-none transition-all duration-500 translate-x-1/4 translate-y-1/4"></div>

      <nav className="sticky top-0 z-50 w-full border-b border-gray-200/80 dark:border-white/5 bg-white/70 dark:bg-[#0a0a0a]/70 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative rounded-full overflow-hidden shadow-md shadow-indigo-500/10 shrink-0">
              <Image src="/simplifvlogo.png" alt="SimplifV Logo" fill className="object-cover" sizes="32px" />
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
              Sympli<span className="text-emerald-600 dark:text-emerald-400">Sync</span>
            </span>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <a href="#features" className="hidden md:flex items-center justify-center text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-white transition-colors">
              System Documentation
            </a>
            <Link href="/login" className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95">
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
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tight mb-6 max-w-4xl leading-[1.1]">
            Intelligent HR & <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-teal-500 to-emerald-600 dark:from-indigo-500 dark:via-teal-400 dark:to-emerald-400">
              Geo-Fenced Attendance Tracking
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-3xl leading-relaxed">
            <strong className="text-gray-900 dark:text-gray-200">SympliSync:</strong> A Cloud-Hosted Human Resource Management Platform Featuring AI-Enhanced Policy Decision Support for SimplifV.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl text-base font-bold transition-all shadow-lg shadow-indigo-500/25 active:scale-95">
              Access Employee Portal
            </Link>
            <Link href="/login" className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 px-8 py-4 rounded-xl text-base font-bold transition-all shadow-sm active:scale-95">
              HR Admin Dashboard
            </Link>
          </div>
        </section>

        <section id="features" className="relative z-10 max-w-7xl w-full mx-auto px-6 pb-20 sm:pb-32 pt-10 scroll-mt-20">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">Enterprise-Grade Architecture</h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">Engineered specifically to eliminate manual HR bottlenecks and mathematically enforce Philippine labor standards.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
                <Calculator className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">DOLE Payroll Engine</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Automated 15 day cut-off per month computations featuring 15-minute lateness ceilings, exact 125% OT premiums, and statutory deductions.
              </p>
            </div>
            <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center mb-6">
                <MapPin className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Smart Geofencing</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Eliminate buddy-punching and time theft. Attendance logs are mathematically locked to the SimplifV office radius coordinates.
              </p>
            </div>
            <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-6">
                <BrainCircuit className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">AI Policy Advisor</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Agentic RAG implementation provides 24/7, hallucination-free answers to employee inquiries based exactly on company memos.
              </p>
            </div>
            <div className="bg-white dark:bg-[#151515] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/50 dark:shadow-none hover:-translate-y-2 transition-transform duration-300">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mb-6">
                <Scale className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Compliance Trails</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                System audit logs and a DOLE-compliant 13th-Month Pay generator to help with the company&apos;s efficiency during labor audits.
              </p>
            </div>
          </div>
        </section>
      </div>

      <footer className="relative w-full z-10 border-t border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-10 sm:py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-gray-200/80 dark:border-white/[0.05]">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 relative rounded-full overflow-hidden shadow-sm shrink-0">
                <Image src="/simplifvlogo.png" alt="SimplifV Logo" fill className="object-cover" sizes="24px" />
              </div>
              <span className="text-base font-black tracking-tight text-gray-900 dark:text-white">
                Sympli<span className="text-emerald-600 dark:text-emerald-400">Sync</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-3 text-xs font-semibold text-gray-600 dark:text-gray-400 text-center">
              <div className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Mail className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <a href="mailto:consult@simplifv.com">consult@simplifv.com</a>
              </div>
              <span className="hidden md:inline text-gray-300 dark:text-white/10">•</span>
              <div className="flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Phone className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <a href="tel:09171300418">0917 130 0418</a>
              </div>
              <span className="hidden md:inline text-gray-300 dark:text-white/10">•</span>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span>Baraca-Camachile, Subic, Zambales</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-6 pt-8">
            <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-500 text-center sm:text-left">
              © 2026 SympliSync Solutions. All rights reserved. Exclusively deployed for SimplifV.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-[10px] sm:text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shadow-sm shadow-emerald-500/5 transition-colors duration-300">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              System Operational
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}