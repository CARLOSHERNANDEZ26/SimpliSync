"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clockInEmployee } from "@/services/attendance"; 

export default function ClockInButton() {
  const { user } = useAuth();
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClockIn = () => {
    setIsLoading(true);
    setStatusMsg(""); // Reset previous message
    
    // Simulate slight delay for GPS feeling
    setTimeout(() => {
      setStatusMsg("Acquiring satellite lock...");
      
      if (!navigator.geolocation) {
        setStatusMsg("Geolocation is not supported by your browser.");
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            await clockInEmployee(user?.uid || "", latitude, longitude);
            setStatusMsg("Ika'y nakapag Clock In na!"); 
          } catch (error) {
            if (error instanceof Error && error.message === "Please allow location access to clock in.") {
              setStatusMsg(error.message); 
            } else if (error instanceof Error && error.message.includes("You are outside the allowed area")) {
              setStatusMsg(error.message); 
            } else {
              setStatusMsg(error instanceof Error ? error.message : "An unexpected error occurred. Please try again."); 
            } 
          } finally {
            setIsLoading(false);
          }
        },
        () => {
          setStatusMsg("Please allow location access to clock in.");
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Request higher accuracy if possible
      );
    }, 600);
  };

  const isSuccessMessage = statusMsg?.includes("Ika'y nakapag Clock In na");

  return (
    <div className="flex flex-col items-center gap-6 mt-6 p-8 bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] w-full max-w-sm relative overflow-hidden group hover:border-teal-400/50 dark:hover:border-teal-500/30 transition-all duration-500">
      
      {/* Decorative Glow inside card */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-400/20 dark:bg-teal-500/10 rounded-full blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-teal-400/30 dark:group-hover:bg-teal-500/20"></div>

      <div className="relative z-10 flex flex-col items-center gap-2">
        <h3 className="text-xl font-light text-gray-900 dark:text-white tracking-wide transition-colors">Time & Attendance</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors">Record your shift exactly at your current location.</p>
      </div>

      <button 
        onClick={handleClockIn} 
        disabled={isLoading}
        className={`relative z-10 overflow-hidden w-40 h-40 rounded-full flex flex-col items-center justify-center font-bold text-white transition-all duration-300 shadow-lg dark:shadow-xl 
          ${isLoading 
            ? "bg-gray-200 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 scale-95 shadow-none dark:shadow-none" 
            : "bg-gradient-to-tr from-teal-500 to-emerald-400 dark:from-teal-600 dark:to-emerald-400 hover:from-teal-400 hover:to-emerald-300 dark:hover:from-teal-500 dark:hover:to-emerald-300 hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(20,184,166,0.3)] dark:shadow-[0_0_40px_rgba(20,184,166,0.4)] hover:shadow-[0_8px_30px_rgba(20,184,166,0.4)] dark:hover:shadow-[0_0_60px_rgba(20,184,166,0.6)]"}`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-8 w-8 text-teal-600 dark:text-teal-400 mb-2 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm uppercase tracking-wider text-teal-700 dark:text-teal-400 font-semibold text-center leading-tight transition-colors">Syncing<br/>Location</span>
          </>
        ) : (
          <>
            <svg className="w-10 h-10 mb-1 opacity-90 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg uppercase tracking-widest drop-shadow-md">Clock In</span>
          </>
        )}
      </button>

      {/* Message Output */}
      {statusMsg && (
        <div className={`relative z-10 p-3 w-full rounded-xl text-center text-sm font-medium animate-fade-in transition-all ${
          isSuccessMessage 
            ? "bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400" 
            : isLoading 
              ? "bg-teal-100 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-500/30 text-teal-700 dark:text-teal-300 animate-pulse"
              : "bg-red-100 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400"
        }`}>
          {statusMsg}
        </div>
      )}
    </div>
  );
}