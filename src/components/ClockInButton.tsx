"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clockInEmployee } from "@/services/attendance"; 
import toast from "react-hot-toast";
import { AlertTriangle, Send, X } from "lucide-react";

interface Coordinates {
  lat: number;
  lng: number;
}

export default function ClockInButton() {
  const { user, isClockedIn } = useAuth();
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLateModalOpen, setIsLateModalOpen] = useState(false);
  const [lateReason, setLateReason] = useState("");
  const [pendingCoords, setPendingCoords] = useState<Coordinates | null>(null);
  const handleClockInClick = () => {
    if (!user || isClockedIn) return; 

    setIsLoading(true);
    setStatusMsg(""); 
    
    setTimeout(() => {
      setStatusMsg("Acquiring satellite lock...");
      
      if (!navigator.geolocation) {
        const errorMsg = "Geolocation is not supported by your browser.";
        setStatusMsg(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // 🔥 Check if the employee is late (Past 08:00 AM)
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();
          
          const isLate = currentHour > 8 || (currentHour === 8 && currentMinute > 0);

          if (isLate) {
            // Pause the clock-in and ask for a reason
            setPendingCoords({ lat: latitude, lng: longitude });
            setIsLateModalOpen(true);
            setIsLoading(false);
            setStatusMsg("");
          } else {
            // On time! Proceed directly.
            executeClockIn(latitude, longitude);
          }
        },
        (error) => {
          let errorMsg = "Failed to get location.";
          if (error.code === error.PERMISSION_DENIED) errorMsg = "Location access denied.";
          setStatusMsg(errorMsg);
          toast.error(errorMsg);
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }, 800); 
  };

  const executeClockIn = async (lat: number, lng: number, reason?: string) => {
    setIsLoading(true);
    setStatusMsg("Connecting to server...");
    
    try {
      await clockInEmployee(user?.uid || "", lat, lng, reason); 
      setStatusMsg("Ika'y nakapag Clock In na!"); 
      toast.success("Successfully clocked in.");
      
      // Cleanup
      setIsLateModalOpen(false);
      setLateReason("");
      setPendingCoords(null);
    } catch (error) {
      console.error("Clock-in failed:", error);
      const errorMsg = "Clock-in failed. Please try again.";
      setStatusMsg(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
    }
  };

  const handleLateSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!lateReason.trim()) {
      toast.error("Please provide a valid reason.");
      return;
    }
    if (pendingCoords) {
      executeClockIn(pendingCoords.lat, pendingCoords.lng, lateReason);
    }
  };

  const isSuccessMessage = statusMsg.includes("Successfully") || statusMsg.includes("nakapag Clock In na");
  const shouldShowMessage = statusMsg !== "" && (!isSuccessMessage || isClockedIn);

  return (
    <div className="relative flex flex-col items-center w-full max-w-sm mx-auto">
      
      <button 
        onClick={handleClockInClick} 
        disabled={isLoading || isClockedIn}
        className={`relative z-20 flex flex-col items-center justify-center w-40 h-40 rounded-full text-white font-bold transition-all shadow-2xl disabled:opacity-80 active:scale-95 ${
          isClockedIn 
            ? "bg-slate-300 dark:bg-white/10 cursor-not-allowed border-4 border-slate-200 dark:border-white/5" 
            : "bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 hover:shadow-emerald-500/50 hover:-translate-y-1"
        }`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin w-10 h-10 mb-2 opacity-90" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm uppercase tracking-widest drop-shadow-md animate-pulse">Syncing...</span>
          </>
        ) : isClockedIn ? (
          <>
            <svg className="w-10 h-10 mb-1 opacity-50 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm uppercase tracking-widest text-gray-500 drop-shadow-md text-center">Active<br/>Shift</span>
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

      {shouldShowMessage && ( 
        <div className={`relative z-10 p-3 w-full rounded-xl text-center text-sm font-medium animate-fade-in transition-all mt-4 ${
          isSuccessMessage 
            ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30" 
            : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20"
        }`}>
          {statusMsg}
        </div>
      )}

      {/* Late Explanation Modal */}
      {isLateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
          <form onSubmit={handleLateSubmit} className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl max-w-sm w-full border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10 bg-rose-50 dark:bg-rose-500/10">
              <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Clock-in Delay
              </h3>
              <button 
                type="button" 
                onClick={() => { setIsLateModalOpen(false); setIsLoading(false); }} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                It is past <strong>08:00 AM</strong>. You are currently registering as late. Please provide a brief explanation for HR review.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Reason for delay</label>
                <input 
                  type="text" 
                  value={lateReason}
                  onChange={(e) => setLateReason(e.target.value)}
                  placeholder="e.g., Heavy traffic, ISP Outage"
                  required
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={!lateReason.trim() || isLoading}
                className="w-full mt-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-rose-500/30 disabled:opacity-50 active:scale-95"
              >
                {isLoading ? "Syncing..." : <><Send className="w-4 h-4" /> Submit & Clock In</>}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}