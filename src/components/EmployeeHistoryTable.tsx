"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { Calendar } from "lucide-react";

interface AttendanceLog {
  id: string;
  timeIn: Date | null;
  timeOut: Date | null;
  status: string;
  earlyOutReason?: string;
}

export default function EmployeeHistoryTable() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Month/Year Filter state
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!user?.uid) return; 

    // Compute Date Range for the query
    const [year, month] = selectedMonth.split('-');
    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    const q = query(
      collection(db, "attendanceLogs"),
      where("userId", "==", user.uid),
      where("timeIn", ">=", startOfMonth),
      where("timeIn", "<=", endOfMonth),
      orderBy("timeIn", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const liveLogs: AttendanceLog[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          liveLogs.push({
            id: doc.id,
            timeIn: data.timeIn?.toDate ? data.timeIn.toDate() : null,
            timeOut: data.timeOut?.toDate ? data.timeOut.toDate() : null,
            status: data.status || "N/A",
            earlyOutReason: data.earlyOutReason,
          });
        });
        
        setLogs(liveLogs);
        setIsLoading(false);
        setError(""); // Clear any previous errors on success
      },
      (err) => {
        // Handle Firebase Indexing Errors gracefully
        if (err.message.includes("failed: preflight")) {
             setError("Building database index... Please refresh in a minute.");
        } else {
             console.error("Firebase Listener Error:", err);
             setError("Unable to sync your history. Check your connection.");
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid, selectedMonth]);

  const formatTime = (date: Date | null) => {
    if (!date) return "--:--"; 
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const calculateDuration = (timeIn: Date | null, timeOut: Date | null) => {
    if (!timeIn || !timeOut) return "Working...";
    const diffMs = timeOut.getTime() - timeIn.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return diffHrs === 0 ? `${diffMins}m` : `${diffHrs}h ${diffMins}m`;
  };

  const getStatusStyles = (status: string) => {
    if (/^Late/.test(status)) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400';
    if (/^On Time/.test(status)) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400';
    if (status === 'Valid' || status === 'Completed') return 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  };

  if (isLoading) return <div className="text-center p-8 text-teal-600 animate-pulse font-medium">Syncing your records...</div>;

  return (
    <div className="w-full mt-8 bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden transition-all">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-white/10 flex justify-between items-center flex-wrap gap-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Attendance Logs</h3>
        
        {/* Calendar Filter */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            className="bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-sm pl-10 pr-4 py-2 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 transition-all cursor-pointer" 
          />
        </div>
      </div>

      {error && <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm font-medium border-b border-amber-200 dark:border-amber-900/50">{error}</div>}
      
      <div className="w-full px-4 md:px-0 max-h-[600px] overflow-y-auto custom-scrollbar">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400 block lg:table">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50/50 dark:bg-white/5 dark:text-gray-300 hidden lg:table-header-group sticky top-0 z-10 backdrop-blur-sm">
            <tr>
              <th scope="col" className="px-6 py-4">Date</th>
              <th scope="col" className="px-6 py-4">Status</th>
              <th scope="col" className="px-6 py-4">Time In</th>
              <th scope="col" className="px-6 py-4">Time Out</th>
              <th scope="col" className="px-6 py-4">Duration</th>
            </tr>
          </thead>
          <tbody className="block lg:table-row-group">
            {logs.length === 0 ? (
              <tr className="block lg:table-row">
                <td colSpan={5} className="block lg:table-cell px-6 py-12 text-center text-gray-500 italic">No attendance records found for {selectedMonth}.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="block lg:table-row border border-gray-100 dark:border-white/5 lg:border-x-0 lg:border-t-0 lg:border-b hover:bg-gray-50 dark:hover:bg-white/5 transition-colors mb-4 lg:mb-0 bg-white dark:bg-white/5 lg:bg-transparent rounded-2xl lg:rounded-none p-4 lg:p-0 shadow-sm lg:shadow-none relative">
                  <td className="flex justify-between items-center lg:table-cell px-2 lg:px-6 py-2 lg:py-4 font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-white/5 lg:border-none">
                    <span className="lg:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Date</span>
                    <span>{formatDate(log.timeIn)}</span>
                  </td>
                  
                  <td className="flex justify-between items-center lg:table-cell px-2 lg:px-6 py-3 lg:py-4 border-b border-gray-100 dark:border-white/5 lg:border-none">
                    <span className="lg:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Status</span>
                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide ${getStatusStyles(log.status)}`}>
                      {log.status}
                    </span>
                  </td>

                  <td className="flex justify-between items-center lg:table-cell px-2 lg:px-6 py-2 lg:py-4 border-b border-gray-100 dark:border-white/5 lg:border-none text-emerald-600 dark:text-emerald-400 font-bold whitespace-nowrap">
                    <span className="lg:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Time In</span>
                    <span>{formatTime(log.timeIn)}</span>
                  </td>
                  <td className="flex justify-between items-center lg:table-cell px-2 lg:px-6 py-2 lg:py-4 border-b border-gray-100 dark:border-white/5 lg:border-none font-bold whitespace-nowrap">
                    <span className="lg:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Time Out</span>
                    <div className="flex flex-col items-end lg:items-start">
                      <span className={log.timeOut ? "text-rose-600 dark:text-rose-400" : "text-gray-400"}>
                        {formatTime(log.timeOut)}
                      </span>
                      {log.earlyOutReason && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 mt-1 uppercase tracking-wider">
                          Early Out: {log.earlyOutReason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="flex justify-between items-center lg:table-cell px-2 lg:px-6 py-2 lg:py-4 border-b border-gray-100 dark:border-white/5 lg:border-none font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    <span className="lg:hidden text-xs text-gray-500 uppercase tracking-widest font-semibold">Duration</span>
                    <span>{calculateDuration(log.timeIn, log.timeOut)}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}