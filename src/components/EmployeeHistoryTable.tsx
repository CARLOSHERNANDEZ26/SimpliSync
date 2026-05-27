"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { ShieldCheck } from "lucide-react";

interface AttendanceLog {
  id: string;
  timeIn: Date | null;
  timeOut: Date | null;
  status: string;
  earlyOutReason?: string;
  isLateExcused?: boolean;
}

export default function EmployeeHistoryTable() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Cutoff Pagination state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });
  const [cutoff, setCutoff] = useState<"1" | "2">(() => new Date().getDate() <= 15 ? "1" : "2");

  useEffect(() => {
    if (!user?.uid) return; 

    const [year, month] = selectedMonth.split('-').map(Number);
    let startOfPeriod: Date;
    let endOfPeriod: Date;

    if (cutoff === "1") {
      startOfPeriod = new Date(year, month - 1, 1, 0, 0, 0);
      endOfPeriod = new Date(year, month - 1, 15, 23, 59, 59, 999);
    } else {
      startOfPeriod = new Date(year, month - 1, 16, 0, 0, 0);
      endOfPeriod = new Date(year, month, 0, 23, 59, 59, 999);
    }

    const q = query(
      collection(db, "attendanceLogs"),
      where("userId", "==", user.uid),
      orderBy("timeIn", "desc") // Query handles sort, JS handles exact cutoff filter to avoid complex composite indexes
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveLogs: AttendanceLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const timeInDate = data.timeIn?.toDate ? data.timeIn.toDate() : null;
          
          if (timeInDate && timeInDate >= startOfPeriod && timeInDate <= endOfPeriod) {
            liveLogs.push({
              id: doc.id,
              timeIn: timeInDate,
              timeOut: data.timeOut?.toDate ? data.timeOut.toDate() : null,
              status: data.status || "N/A",
              earlyOutReason: data.earlyOutReason,
              isLateExcused: data.isLateExcused,
            });
          }
        });
        
        setLogs(liveLogs);
        setIsLoading(false);
        setError(""); 
      },
      (err) => {
        console.error("Firebase Listener Error:", err);
        setError("Unable to sync your history. Check your connection.");
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, selectedMonth, cutoff]);

  const calculateActualLateMins = (timeIn: Date | null) => {
    if (!timeIn) return 0;
    const targetTime = new Date(timeIn);
    targetTime.setHours(8, 0, 0, 0); 
    const diffMs = timeIn.getTime() - targetTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins > 0 ? diffMins : 0;
  };

  const formatTime = (date: Date | null) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--";
  const formatDate = (date: Date | null) => date ? date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "N/A";

  const getStatusStyles = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("present") || s.includes("time")) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (s.includes("late")) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
    if (s.includes("working")) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  // Calculate Totals
  let totalMsWorked = 0;
  let totalLateMinsAccumulated = 0;
  
  logs.forEach(log => {
    const lateMins = calculateActualLateMins(log.timeIn);
    if (!log.isLateExcused) totalLateMinsAccumulated += lateMins;
    if (log.timeIn && log.timeOut) totalMsWorked += log.timeOut.getTime() - log.timeIn.getTime();
  });
  const totalHrs = Math.floor(totalMsWorked / (1000 * 60 * 60));
  const totalMins = Math.floor((totalMsWorked % (1000 * 60 * 60)) / (1000 * 60));

  if (isLoading) return <div className="text-center p-8 text-teal-600 animate-pulse font-medium">Syncing your records...</div>;

  return (
    <div className="w-full mt-8 bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden transition-all">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Attendance Logs</h3>
        
        <div className="flex gap-2">
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-sm px-3 py-2 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer" 
          />
          <select 
            value={cutoff}
            onChange={(e) => setCutoff(e.target.value as "1" | "2")}
            className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-sm px-3 py-2 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer"
          >
            <option value="1">1st Half</option>
            <option value="2">2nd Half</option>
          </select>
        </div>
      </div>

      {error && <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium border-b border-amber-200 dark:border-amber-900/50">{error}</div>}
      
      <div className="w-full px-4 md:px-0 max-h-[600px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 block lg:table">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-white/5 dark:text-gray-300 hidden lg:table-header-group sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th scope="col" className="px-6 py-4">Date</th>
              <th scope="col" className="px-6 py-4">Time In</th>
              <th scope="col" className="px-6 py-4">Time Out</th>
              <th scope="col" className="px-6 py-4 text-center">Late (Mins)</th>
              <th scope="col" className="px-6 py-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="block lg:table-row-group">
            {logs.length === 0 ? (
              <tr className="block lg:table-row">
                <td colSpan={5} className="block lg:table-cell px-6 py-12 text-center text-gray-500 italic">No attendance records found for this cutoff.</td>
              </tr>
            ) : (
              logs.map((log) => {
                const actualLateMins = calculateActualLateMins(log.timeIn);
                let cleanStatus = log.status || "Present";
                if (cleanStatus.toLowerCase().includes("force")) cleanStatus = "Admin Resolved";
                else if (cleanStatus.toLowerCase().includes("late")) cleanStatus = "Late";
                else if (actualLateMins > 0 && cleanStatus === "Working") cleanStatus = "Working";
                else if (actualLateMins > 0 && cleanStatus === "Present") cleanStatus = "Late";

                return (
                  <tr key={log.id} className="block lg:table-row border border-gray-100 dark:border-white/5 lg:border-x-0 lg:border-t-0 lg:border-b hover:bg-gray-50 dark:hover:bg-white/5 transition-colors mb-4 lg:mb-0 bg-white dark:bg-white/5 lg:bg-transparent rounded-2xl lg:rounded-none p-4 lg:p-0 shadow-sm lg:shadow-none relative">
                    <td className="flex justify-between items-center lg:table-cell px-2 lg:px-6 py-2 lg:py-4 font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 lg:border-none">
                      <span className="lg:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Date</span>
                      <span>{formatDate(log.timeIn)}</span>
                    </td>
                    
                    <td className="flex justify-between items-center lg:table-cell px-2 lg:px-6 py-2 lg:py-4 border-b border-gray-100 dark:border-white/5 lg:border-none text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                      <span className="lg:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Time In</span>
                      <span>{formatTime(log.timeIn)}</span>
                    </td>
                    
                    <td className="flex justify-between items-center lg:table-cell px-2 lg:px-6 py-2 lg:py-4 border-b border-gray-100 dark:border-white/5 lg:border-none font-bold whitespace-nowrap">
                      <span className="lg:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Time Out</span>
                      <span className={log.timeOut ? "text-rose-600 dark:text-rose-400" : "text-gray-400"}>
                        {formatTime(log.timeOut)}
                      </span>
                    </td>

                    <td className="flex justify-between items-center lg:table-cell px-2 lg:px-6 py-2 lg:py-4 lg:text-center border-b border-gray-100 dark:border-white/5 lg:border-none font-mono">
                      <span className="lg:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Late (Mins)</span>
                      <div className="flex items-center lg:justify-center gap-1.5">
                        {actualLateMins > 0 ? (
                          <span className={`font-bold ${log.isLateExcused ? 'text-emerald-500 line-through opacity-50' : 'text-rose-500'}`}>{actualLateMins}</span>
                        ) : (
                          <span className="text-emerald-600 font-bold">0</span>
                        )}
                        {log.isLateExcused && (
  <span title="Excused by Admin">
    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
  </span>
)}
                      </div>
                    </td>

                    <td className="flex justify-between items-center lg:table-cell px-2 lg:px-6 py-3 lg:py-4 border-b border-gray-100 dark:border-white/5 lg:border-none lg:text-center">
                      <span className="lg:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Status</span>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide ${getStatusStyles(cleanStatus)}`}>
                        {cleanStatus}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {logs.length > 0 && (
        <div className="bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 p-4 flex flex-col sm:flex-row justify-end gap-6 sm:gap-12 px-6">
          <div className="flex justify-between sm:flex-col sm:items-end gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Work Hours</span>
            <span className="text-base font-black text-gray-900 dark:text-white font-mono">{totalHrs}h {totalMins}m</span>
          </div>
          <div className="flex justify-between sm:flex-col sm:items-end gap-1">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Minutes Late</span>
            <span className={`text-base font-black font-mono ${totalLateMinsAccumulated > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {totalLateMinsAccumulated} mins
            </span>
          </div>
        </div>
      )}
    </div>
  );
}