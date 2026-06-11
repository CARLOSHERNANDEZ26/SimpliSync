"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { clockInEmployee } from "@/services/attendance"; 
import { collection, query, where, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";
import { AlertTriangle, Send, X, MapPin } from "lucide-react";
import { isWithinSmartZone } from "@/utils/geo";

interface Coordinates {
  lat: number;
  lng: number;
}

interface CompanySettings {
  officeLat?: number;
  officeLng?: number;
  allowedRadius?: number;
  shiftStartTime?: string;
}

export default function ClockInButton() {
  const { user, isClockedIn } = useAuth();
  const [statusMsg, setStatusMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Modal & Warning tracking states
  const [isLateModalOpen, setIsLateModalOpen] = useState(false);
  const [isOutOfBoundsModalOpen, setIsOutOfBoundsModalOpen] = useState(false);
  const [isRoamingWarningOpen, setIsRoamingWarningOpen] = useState(false);
  
  const [lateReason, setLateReason] = useState("");
  const [pendingCoords, setPendingCoords] = useState<Coordinates | null>(null);
  const [hasLoggedToday, setHasLoggedToday] = useState<boolean | null>(null);
  const [prevUserId, setPrevUserId] = useState<string | undefined>(user?.uid);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);

  if (user?.uid !== prevUserId) {
    setPrevUserId(user?.uid);
    setHasLoggedToday(null); 
  }

  const isCheckingToday = user?.uid ? (hasLoggedToday === null) : false;

  // 1. Fetch Company Settings Once on Mount (Optimization)
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "company"));
        if (settingsSnap.exists()) {
          setCompanySettings(settingsSnap.data() as CompanySettings);
        }
      } catch (error) {
        console.error("Failed to fetch company settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // 2. Check Today's Logs
  useEffect(() => {
    if (!user?.uid) return;

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const q = query(
      collection(db, "attendanceLogs"),
      where("userId", "==", user.uid),
      where("timeIn", ">=", startOfToday),
      where("timeIn", "<=", endOfToday)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setHasLoggedToday(!snapshot.empty);
    }, (error) => {
      console.error("Error checking today's logs:", error);
      setHasLoggedToday(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // 3. Real-Time Shift Tracking (Active Watcher)
  useEffect(() => {
    let watchId: number;

    // Only activate the GPS watcher if the employee is currently on the clock
    if (isClockedIn && user?.uid) {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by your browser.");
        return;
      }

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Use cached settings to prevent database read spam
          const officeLat = companySettings?.officeLat || 14.942155;
          const officeLng = companySettings?.officeLng || 120.217151;
          const allowedRadius = companySettings?.allowedRadius || 50;

          // Check if the new coordinate is still inside the zone
          const isStillInZone = isWithinSmartZone(latitude, longitude, officeLat, officeLng, allowedRadius);

          if (!isStillInZone) {
            setIsRoamingWarningOpen(true);
          } else {
            // Automatically clear the warning if they step back inside
            setIsRoamingWarningOpen(false);
          }
        },
        (error) => {
          console.error("Active shift tracking lost:", error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }

    // Cleanup: Stop tracking the device when they clock out or leave the page
    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isClockedIn, user?.uid, companySettings]);

  const handleClockInClick = () => {
    // Pre-flight checks: Halt immediately if user isn't authenticated or already logged
    if (!user?.uid || isClockedIn || hasLoggedToday === true || isCheckingToday) return; 

    setIsLoading(true);
    setStatusMsg("Acquiring GPS satellite link..."); 
    
    if (!navigator.geolocation) {
      const errorMsg = "Geolocation is not supported by your browser.";
      setStatusMsg(errorMsg);
      toast.error(errorMsg);
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setStatusMsg("Verifying geofence boundaries...");
          
          // Use cached settings instead of re-fetching
          const officeLat = companySettings?.officeLat || 14.942155;
          const officeLng = companySettings?.officeLng || 120.217151;
          const allowedRadius = companySettings?.allowedRadius || 50;
          const shiftStartTime = companySettings?.shiftStartTime || "08:00";

          // Calculate location authorization metrics
          const isValidLocation = isWithinSmartZone(latitude, longitude, officeLat, officeLng, allowedRadius);
          
          if (!isValidLocation) {
            setPendingCoords({ lat: latitude, lng: longitude });
            setIsOutOfBoundsModalOpen(true);
            setStatusMsg("");
            setIsLoading(false); 
            return;
          }

          // Evaluate timeliness metrics
          const now = new Date();
          const [hourStr, minuteStr] = shiftStartTime.split(':');
          const targetTime = new Date();
          targetTime.setHours(parseInt(hourStr, 10), parseInt(minuteStr, 10), 0, 0);

          setPendingCoords({ lat: latitude, lng: longitude });

          if (now > targetTime) {
            // Inside boundaries but tardy -> open modal description entry prompt
            setIsLateModalOpen(true);
            setStatusMsg("");
            setIsLoading(false);
          } else {
            // In bounds and on time -> fire direct server commit
            await executeClockIn(latitude, longitude);
          }

        } catch (err) {
          console.error("Geofence Verification Failure:", err);
          setStatusMsg("Verification service error. Please try again.");
          toast.error("Network sync issue. Failed to pull geofence metadata.");
          setIsLoading(false); 
        }
      },
      (error) => {
        let errorMsg = "Failed to acquire location telemetry.";
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = "Location permissions denied. Please enable GPS access.";
        }
        setStatusMsg(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  };

  const executeClockIn = async (lat: number, lng: number, reason?: string) => {
    if (!user?.uid) return;
    setIsLoading(true);
    setStatusMsg("Committing records to secure cloud ledger...");
    
    try {
      await clockInEmployee(user.uid, lat, lng, reason); 
      setStatusMsg("Ika'y nakapag Clock In na!"); 
      toast.success("Successfully clocked in.");
      
      setIsLateModalOpen(false);
      setLateReason("");
      setPendingCoords(null);
    } catch (error) {
      console.error("Clock-in execution failed:", error);
      setStatusMsg("Clock-in failed. Please try again.");
      toast.error("Database connection failure. Please retry clocking in.");
    } finally {
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
  const shouldShowMessage = (statusMsg !== "" && (!isSuccessMessage || isClockedIn)) || (hasLoggedToday === true && !isClockedIn);

  return (
    <>
      {/* Real-Time Roaming Warning Banner */}
      {isRoamingWarningOpen && (
        <div className="fixed top-0 left-0 w-full bg-rose-600/90 backdrop-blur-md text-white text-center py-3 z-[999] animate-fade-in-up font-medium text-sm shadow-lg flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <span>You have moved outside the designated smart zone perimeter. Please return to the work zone.</span>
        </div>
      )}

      <div className="relative flex flex-col items-center w-full max-w-sm mx-auto">
        <button 
          onClick={handleClockInClick} 
          disabled={isLoading || isClockedIn || hasLoggedToday === true || isCheckingToday}
          className={`relative z-20 flex flex-col items-center justify-center w-40 h-40 rounded-full text-white font-bold transition-all shadow-2xl disabled:opacity-80 active:scale-95 ${
            (isClockedIn || hasLoggedToday === true || isCheckingToday)
              ? "bg-slate-300 dark:bg-white/10 cursor-not-allowed border-4 border-slate-200 dark:border-white/5" 
              : "bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 hover:shadow-emerald-500/50 hover:-translate-y-1"
          }`}
        >
          {isLoading || isCheckingToday ? (
            <>
              <svg className="animate-spin w-10 h-10 mb-2 opacity-90 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm uppercase tracking-widest drop-shadow-md animate-pulse">Syncing...</span>
            </>
          ) : isClockedIn || hasLoggedToday === true ? (
            <>
              <svg className="w-10 h-10 mb-1 opacity-50 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm uppercase tracking-widest text-gray-500 drop-shadow-md text-center">
                {hasLoggedToday === true && !isClockedIn ? "Shift\nEnded" : "Active\nShift"}
              </span>
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
            {hasLoggedToday === true && !isClockedIn 
              ? "You have already completed a shift today. Please contact HR for manual adjustments." 
              : statusMsg}
          </div>
        )}

        {/* Out of Bounds Rejection Modal */}
        {isOutOfBoundsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
            <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl shadow-2xl max-w-sm w-full border border-gray-200 dark:border-white/10 overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-white/10 bg-rose-50 dark:bg-rose-500/10">
                <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                  <MapPin className="w-5 h-5" /> Clock-In Restricted
                </h3>
                <button 
                  type="button" 
                  onClick={() => { setIsOutOfBoundsModalOpen(false); setPendingCoords(null); }} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-5 text-center">
                <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
                  <MapPin className="w-7 h-7" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  You are currently <strong className="text-rose-500">outside the allowed workspace boundaries</strong>. Please move closer to the office building to connect to the smart geofence perimeter.
                </p>
                <button 
                  type="button"
                  onClick={() => { setIsOutOfBoundsModalOpen(false); setPendingCoords(null); }}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-rose-500/20 active:scale-95 text-sm"
                >
                  Understood
                </button>
              </div>
            </div>
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
                  onClick={() => { setIsLateModalOpen(false); setPendingCoords(null); }} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 flex flex-col gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  It is past **08:00 AM**. You are currently registering as late. Please provide a brief explanation for HR review.
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
                    className="w-full bg-slate-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 outline-none text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 transition-all font-medium"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={!lateReason.trim() || isLoading}
                  className="w-full mt-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl transition-all flex justify-center items-center gap-2 shadow-lg shadow-rose-500/30 disabled:opacity-50 active:scale-95 text-sm"
                >
                  {isLoading ? "Syncing..." : <><Send className="w-4 h-4" /> Submit & Clock In</>}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </>
  );
}