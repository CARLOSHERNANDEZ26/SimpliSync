"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clockOutEmployee } from "@/services/attendance";

export default function ClockOutButton() {
  const { user, isClockedIn } = useAuth();
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClockOut = async () => {
    // We keep your functional protections here just in case!
    if (!user) {
      setStatusMsg("Error: You must be logged in.");
      return;
    }
    if (!isClockedIn) {
      return; // We don't even need the error message anymore, the button handles it!
    }
    if (!navigator.geolocation) {
      setStatusMsg("Error: Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    setStatusMsg("Verifying location and active shift...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Call our shiny new backend engine!
          await clockOutEmployee(user.uid, latitude, longitude);
          
          setStatusMsg("Success! You have officially clocked out.");
        } catch (error) {
          if (error instanceof Error) {
            setStatusMsg(`Error: ${error.message}`);
          } else {
            setStatusMsg("An unexpected error occurred.");
          }
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        setStatusMsg("Error: Please allow location access to clock out.");
        console.error(error);
      },
      { enableHighAccuracy: true } 
    );
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-4">
      <button
        onClick={handleClockOut}
        // Disable the physical button if loading OR if they aren't clocked in
        disabled={isLoading || !isClockedIn}
        className={`px-8 py-3 rounded-xl text-white font-bold tracking-wide transition-all flex items-center justify-center gap-2 w-full sm:w-auto
          ${isLoading || !isClockedIn 
            ? "bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed shadow-none scale-100" 
            : "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 active:scale-95"
          }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </>
        ) : !isClockedIn ? (
          <>
            <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            You&apos;re Not Yet Clocked In
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Clock Out
          </>
        )}
      </button>

      {/* Dynamic Status Message */}
      {statusMsg && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium animate-fade-in-up text-center max-w-xs
          ${statusMsg.includes("Success") 
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" 
            : statusMsg.includes("Verifying")
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"
          }`}
        >
          {statusMsg}
        </div>
      )}
    </div>
  );
}