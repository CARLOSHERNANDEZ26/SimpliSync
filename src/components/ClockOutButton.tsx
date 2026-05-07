"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clockOutEmployee } from "@/services/attendance";
import toast from "react-hot-toast";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { X, AlertTriangle, Send } from "lucide-react";

export default function ClockOutButton() {
  const { user, isClockedIn } = useAuth();
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [scheduledHours, setScheduledHours] = useState({ start: "09:00", end: "17:00" });

  const [showModal, setShowModal] = useState(false);
  const [earlyReason, setEarlyReason] = useState("");
  const [earlyDetails, setEarlyDetails] = useState("");

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.uid) return;
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().scheduleHours) {
          setScheduledHours(userDoc.data().scheduleHours);
        }
      } catch (error) {
        console.error("Failed to fetch schedule:", error);
      }
    };
    fetchSchedule();
  }, [user]);

  const handleClockOutClick = () => {
    if (!user) return toast.error("Authentication required.");
    if (!isClockedIn) return;

    const [endHour, endMin] = scheduledHours.end.split(":").map(Number);
    const now = new Date();
    const targetEndTime = new Date();
    targetEndTime.setHours(endHour, endMin, 0, 0);

    if (now.getTime() < targetEndTime.getTime()) {
      setShowModal(true); 
    } else {
      executeClockOut(); 
    }
  };

  const executeClockOut = async (reason?: string, details?: string) => {
    if (!user) return;
    if (!navigator.geolocation) {
      return toast.error("Geolocation is not supported by your browser.");
    }

    setIsLoading(true);
    setStatusMsg("Verifying location...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await clockOutEmployee(user.uid, latitude, longitude, reason, details);
          
          toast.success("Shift ended successfully.");
          setStatusMsg("Success! You have officially clocked out.");
          setShowModal(false);
          setEarlyReason("");
          setEarlyDetails("");
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
        onClick={handleClockOutClick}
        disabled={isLoading || !isClockedIn}
        className={`px-8 py-3 rounded-xl text-white font-bold tracking-wide transition-all flex items-center justify-center gap-2 w-full sm:w-auto
          ${isLoading || !isClockedIn
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
        ) : (
          "Clock Out Now"
        )}
      </button>

      {/* 🔥 ADDED: Dynamic Time Lock Info Note */}
      {isClockedIn && ( 
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-500/20 text-center animate-pulse max-w-sm">
          <strong>Time Lock Info:</strong> <br/>
          Your scheduled end time is <strong>{scheduledHours.end}</strong>. Clocking out before this time will require justification (e.g., emergencies, half-day).
        </div>
      )}

      {statusMsg && (
        <p className={`text-sm font-medium ${statusMsg.includes("Success") ? "text-emerald-500" : "text-rose-500"}`}>
          {statusMsg}
        </p>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10 bg-amber-50 dark:bg-amber-500/10">
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Early Departure Notice
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                You are attempting to clock out before your scheduled end time <strong>({scheduledHours.end})</strong>. Please provide a formal justification for HR records.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Reason Category</label>
                <select 
                  value={earlyReason} 
                  onChange={(e) => setEarlyReason(e.target.value)} 
                  className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Select Reason --</option>
                  <option value="Pre-Approved Half Day">Pre-Approved Half Day</option>
                  <option value="Medical / Sick Leave">Medical / Sick Leave</option>
                  <option value="Family Emergency">Family Emergency</option>
                  <option value="Personal Matters">Personal Matters</option>
                  <option value="Official Business / Field Work">Official Business / Field Work</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase">Additional Details</label>
                <textarea 
                  value={earlyDetails} 
                  onChange={(e) => setEarlyDetails(e.target.value)} 
                  placeholder="Provide context for HR..." 
                  className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 min-h-[100px] resize-none outline-none text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button 
                onClick={() => executeClockOut(earlyReason, earlyDetails)}
                disabled={!earlyReason || isLoading}
                className="w-full mt-2 bg-amber-500 hover:bg-amber-400 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-amber-500/30 disabled:opacity-50"
              >
                {isLoading ? "Processing..." : <><Send className="w-4 h-4" /> Confirm Early Clock Out</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}