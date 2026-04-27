"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, getDocs, where } from "firebase/firestore"; 
import { db } from "@/lib/firebase"; 
import { adminForceClockOut } from "@/services/attendance";
import toast from "react-hot-toast";
import ConfirmModal from "@/components/ConfirmModal";
import { Trash2, AlertTriangle, Search, Calendar } from "lucide-react";

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

  const executeDeleteLog = async (logId: string) => {
    try {
      await deleteDoc(doc(db, "attendanceLogs", logId)); 
      toast.success("Record deleted.");
    } catch (error) {
      console.error("Error deleting log:", error);
      toast.error("Delete failed.");
    }
  };

  const confirmDeleteLog = (logId: string) => {
    toast.custom((t) => (
      <div className={`${t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'} transition-all duration-300 max-w-md w-full bg-white dark:bg-[#1a1a1a] shadow-2xl rounded-2xl pointer-events-auto flex flex-col p-5 border border-gray-200 dark:border-white/10`}>
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-2">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-bold">Delete Record?</p>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Are you sure you want to permanently remove this attendance log? This will affect payroll calculations.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => toast.dismiss(t.id)} 
            className="flex-1 px-4 py-2.5 text-sm font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { executeDeleteLog(logId); toast.dismiss(t.id); }} 
            className="flex-1 px-4 py-2.5 text-sm font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md shadow-rose-500/20 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    ), { id: `confirm-att-${logId}`, duration: 5000 });
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
    return <div className="text-center p-12 text-emerald-600 dark:text-emerald-400 animate-pulse font-medium">Syncing live attendance data...</div>;
  }

  if (error) {
    return <div className="text-center p-12 text-rose-500 font-medium">{error}</div>;
  }

  return (
    <div className="w-full mt-8 bg-white dark:bg-white/[0.03] backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 dark:border-white/10 overflow-hidden transition-colors duration-300">
      
      {/* Table Header Section */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-white/10 flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Live Company Attendance</h3>
        <div className="flex items-center gap-3"> 
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)} 
              className="bg-gray-100 dark:bg-black/40 border-none rounded-xl text-sm pl-10 pr-4 py-2 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
            />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-black/40 border-none rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-teal-500 transition-all" 
            />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 px-6 py-6 bg-slate-50/50 dark:bg-white/[0.02] border-b dark:border-white/10">
        <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Logs</p>
          <p className="text-3xl font-black text-gray-900 dark:text-white mt-1">{filteredLogs.length}</p>
        </div>
        <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Hours</p>
          <p className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1">{totalHours}h</p>
        </div>
      </div>
      
      {/* Table Section */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-slate-50 dark:bg-white/5">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Employee</th>
              <th className="px-6 py-4">In / Out</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-300">{formatDate(log.timeIn)}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-900 dark:text-white text-base">{log.fullName}</span>
                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider">{log.role}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs font-mono font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">IN: {formatTime(log.timeIn)}</span>
                    <span className={log.timeOut ? "text-rose-600 dark:text-rose-400" : "text-gray-400"}>
                      OUT: {log.timeOut ? formatTime(log.timeOut) : "---"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-semibold text-gray-700 dark:text-gray-400">{calculateDuration(log.timeIn, log.timeOut)}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-3">
                    {!log.timeOut && (
                      <button 
                        onClick={() => { setSelectedLog(log); setIsModalOpen(true); }}
                        className="text-[10px] font-bold bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-lg transition-all shadow-md shadow-rose-500/20 active:scale-95"
                      >
                        Force Out
                      </button>
                    )}
                    <button 
                      onClick={() => confirmDeleteLog(log.id)} 
                      className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredLogs.length === 0 && (
          <div className="text-center py-20 text-gray-500 italic">No attendance records found for this period.</div>
        )}
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