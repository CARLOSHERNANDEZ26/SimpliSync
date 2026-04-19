"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clockOutEmployee } from "@/services/attendance";
import toast from "react-hot-toast";

export default function ClockOutButton() {
  const { user, isClockedIn } = useAuth();
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAllowed, setIsAllowed] = useState(false); 

 useEffect(() => {
    const fetchStrictTime = async () => { 
      try {
        const response = await fetch("https://worldtimeapi.org/api/timezone/Asia/Manila");
        const data = await response.json();
        const currentHour = new Date(data.datetime).getHours();
        setIsAllowed((currentHour >= 12 && currentHour < 13) || currentHour >= 17);
      } catch (error) {
        console.error("Error fetching server time:", error);
      }
    };
    fetchStrictTime(); 
    const interval = setInterval(() => {  
      const localHour = new Date().getHours(); 
      setIsAllowed((localHour >= 12 && localHour < 13) || localHour >= 17); 
    }, 60000); 
    
    return () => clearInterval(interval);
  }, []);

  const handleClockOut = async () => { 
    if (!user) return toast.error("Authentication required.");
    if (!isClockedIn) return;

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    setStatusMsg("Verifying location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          await clockOutEmployee(user.uid, latitude, longitude);
          
          toast.success("Shift ended successfully.");
          setStatusMsg("Success! You have officially clocked out.");
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : "An unexpected error occurred.";
          toast.error(msg);
          setStatusMsg(`Error: ${msg}`);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLoading(false);
        toast.error("Location access is required to clock out.");
        setStatusMsg("Error: Geolocation access denied.");
      },
      { enableHighAccuracy: true, timeout: 10000 } 
    );
  };

  return ( 
    <div className="flex flex-col items-center gap-4 mt-4 w-full">
      <button
        onClick={handleClockOut}
        disabled={isLoading || !isClockedIn || !isAllowed}
        className={`px-8 py-3 rounded-xl text-white font-bold tracking-wide transition-all flex items-center justify-center gap-2 w-full sm:w-auto
          ${isLoading || !isClockedIn || !isAllowed
            ? "bg-gray-300 dark:bg-gray-800 text-gray-500 cursor-not-allowed" 
            : "bg-gradient-to-r from-rose-500 to-red-600 hover:shadow-lg hover:shadow-rose-500/30 active:scale-95"
          }`}
      >
        {isLoading ? ( 
          <span className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </span>
        ) : !isClockedIn ? ( 
          "Not Clocked In"
        ) : !isAllowed ? (
            "Shift Time Locked"
        ) : (
          "Clock Out Now"
        )}
      </button>

      {isClockedIn && !isAllowed && ( 
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-500/20 text-center animate-pulse">
          <strong>Time Lock Active:</strong> <br/>
          Clock out is only available at Lunch (12 PM) or after 5 PM.
        </div>
      )}

      {statusMsg && (
        <p className={`text-sm font-medium ${statusMsg.includes("Success") ? "text-emerald-500" : "text-rose-500"}`}>
          {statusMsg}
        </p>
      )}
    </div>
  );
}