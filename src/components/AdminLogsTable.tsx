"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDocs, where } from "firebase/firestore"; 
import { db } from "@/lib/firebase"; 
import { adminForceClockOut } from "@/services/attendance";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";

interface AttendanceLog {
  id: string;
  userId: string;
  fullName: string; 
  role: string;     
  timeIn: Date | null;
  timeOut: Date | null;
  status: string;
  lat?: number;
  lng?: number;
}

export default function AdminLogsTable() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null);
  const [isForceOutLoading, setIsForceOutLoading] = useState(false);
     
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!user) return;

    let unsubscribeLogs: () => void;
    let isMounted = true; 

    const setupSubscription = async () => {
      try {
        const userSnap = await getDocs(collection(db, "users"));
        const userDictionary: Record<string, { fullName: string, role: string }> = {};
        
        userSnap.forEach((doc) => {
          const userData = doc.data();
          userDictionary[doc.id] = {
            fullName: userData.fullName || "Unknown User",
            role: userData.role || "No Role Assigned"
          };
        });

        if (!isMounted) return;

        const [year, month] = selectedMonth.split('-');
        const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0);
        const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

        const q = query(
          collection(db, "attendanceLogs"),
          where("timeIn", ">=", startOfMonth),
          where("timeIn", "<=", endOfMonth),
          orderBy("timeIn", "desc")
        );
        
        unsubscribeLogs = onSnapshot(q, (snapshot) => { 
          const liveLogs: AttendanceLog[] = []; 
          snapshot.forEach((doc) => {
            const data = doc.data();
            const employeeProfile = userDictionary[data.userId] || { fullName: "Unknown User", role: "N/A" }; 

            liveLogs.push({
              id: doc.id,
              userId: data.userId,
              fullName: employeeProfile.fullName, 
              role: employeeProfile.role,         
              timeIn: data.timeIn?.toDate ? data.timeIn.toDate() : null,
              timeOut: data.timeOut?.toDate ? data.timeOut.toDate() : null,
              status: data.status,
              lat: data.lat,
              lng: data.lng,
            });
          });
          
          setLogs(liveLogs);
          setIsLoading(false);
        }, (err) => {
          if (err.code !== "permission-denied") {
             console.error("Firestore Snapshot error:", err);
             if (isMounted) setError("Failed to load real-time records.");
          }
        });

      } catch (err) {
        console.error("Initial data load error:", err);
        if (isMounted) {
          setError("Failed to sync with database.");
          setIsLoading(false);
        }
      }
    };

    setupSubscription();

    return () => { 
      isMounted = false; 
      if (unsubscribeLogs) unsubscribeLogs(); 
    };
  }, [selectedMonth, user]); 

  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm("Permanently delete this attendance record?")) return;
    try {
      await deleteDoc(doc(db, "attendanceLogs", logId)); 
      toast.success("Record deleted.");
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error("Delete failed.");
    }
  };

  const executeForceClockOut = async () => {
    if (!selectedLog) return;  
    setIsForceOutLoading(true); 
    try { 
      await adminForceClockOut(selectedLog.userId, selectedLog.id);
      toast.success("Employee clocked out successfully.");
      setIsModalOpen(false); 
      setSelectedLog(null);
    } catch (error) {
      console.error("Force clock out error:", error);
      toast.error("Failed to force clock out.");
    } finally { 
      setIsForceOutLoading(false); 
    } 
  }; 

  const formatTime = (date: Date | null) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
  const formatDate = (date: Date | null) => date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : "N/A";

  const calculateDuration = (timeIn: Date | null, timeOut: Date | null) => {
    if (!timeIn || !timeOut) return "Working...";
    const diffMs = timeOut.getTime() - timeIn.getTime();
    const hrs = Math.floor(diffMs / 3600000);
    const mins = Math.floor((diffMs % 3600000) / 60000);
    return hrs === 0 ? `${mins}m` : `${hrs}h ${mins}m`;
  };

  const filteredLogs = logs.filter((log) => 
    log.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalHours = (filteredLogs.reduce((total, log) => { 
    return (log.timeIn && log.timeOut) ? total + (log.timeOut.getTime() - log.timeIn.getTime()) : total;
  }, 0) / 3600000).toFixed(1);
  if (isLoading) {
    return <div className="text-center p-12 text-emerald-600 animate-pulse font-medium">Syncing live attendance data...</div>;
  }

  if (error) {
    return <div className="text-center p-12 text-rose-500 font-medium">{error}</div>;
  }

  return (
    <div className="w-full mt-8 bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-lg font-semibold dark:text-white">Live Company Attendance</h3>
        <div className="flex items-center gap-3"> 
          <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-sm p-2 dark:text-white" />
          <input type="text" placeholder="Search employee..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-4 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border-none rounded-lg text-sm outline-none dark:text-white" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-6 py-4 bg-gray-50/50 dark:bg-white/5 border-b dark:border-white/10">
        <div className="p-4 bg-white dark:bg-white/10 rounded-xl border dark:border-white/5">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Logs</p>
          <p className="text-2xl font-bold dark:text-white">{filteredLogs.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-white/10 rounded-xl border dark:border-white/5">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Hours</p>
          <p className="text-2xl font-bold text-teal-500">{totalHours}h</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-white/5 dark:text-gray-300">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">In / Out</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map((log) => (
              <tr key={log.id} className="border-b dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 dark:text-white">{formatDate(log.timeIn)}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold dark:text-white">{log.fullName}</span>
                    <span className="text-xs opacity-60">{log.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs font-mono">
                    <span className="text-emerald-500">IN: {formatTime(log.timeIn)}</span>
                    <span className={log.timeOut ? "text-rose-500" : "text-gray-400"}>
                      OUT: {log.timeOut ? formatTime(log.timeOut) : "---"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 dark:text-gray-300">{calculateDuration(log.timeIn, log.timeOut)}</td>
                <td className="px-6 py-4 text-right">
                   {!log.timeOut && (
                   <button onClick={async () => {
                    setSelectedLog(log);
                    setIsModalOpen(true);
                     
                               }}
  className="text-[10px] bg-rose-500 text-white px-2 py-1 rounded mr-2 hover:bg-rose-600 transition-colors shadow-sm"
>
  Force Out
</button>
                  )}
                  <button onClick={() => handleDeleteLog(log.id)} className="text-gray-400 hover:text-rose-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null); 
        }}
        onConfirm={executeForceClockOut}
        title="Force Clock Out"
        message={`Are you sure you want to end the active shift for ${selectedLog?.fullName}? This action cannot be undone and will mark their status as "Force Clocked Out (Admin)".`}
        confirmText="End Shift"
        isLoading={isForceOutLoading}
      />
    </div>
  );
}