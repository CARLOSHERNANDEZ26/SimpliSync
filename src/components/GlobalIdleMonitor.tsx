"use client";

import { useIdleMonitor } from "@/hooks/useIdleMonitor";
import { AlertTriangle } from "lucide-react";

export default function GlobalIdleMonitor() {
  // Sets 30 minutes of idle time, and a 5-minute warning
  const { isIdleWarningOpen, countdownMinutes, countdownSeconds, cancelWarning } = useIdleMonitor(30, 5);

  if (!isIdleWarningOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl max-w-sm w-full border border-gray-200 dark:border-white/10 overflow-hidden text-center p-8">
        
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
          <AlertTriangle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Are you still working?</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          We have not detected any activity on this device for 30 minutes. 
        </p>

        <div className="text-4xl font-mono font-black text-rose-600 dark:text-rose-400 mb-8">
          {String(countdownMinutes).padStart(2, '0')}:{String(countdownSeconds).padStart(2, '0')}
        </div>

        <button 
          onClick={cancelWarning}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 text-lg"
        >
          I&apos;m still here!
        </button>
      </div>
    </div>
  );
}