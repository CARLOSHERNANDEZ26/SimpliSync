"use client";

import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Calendar, CheckCircle, ShieldAlert } from "lucide-react";

interface AttendanceLog {
  id: string;
  userId: string;
  timeIn: Date | null;
  timeOut: Date | null;
  status: string;
  fullName?: string;
}

export default function TimesheetsPage() {
  const { user } = useAuth();
  const isAdmin = user?.email === "admin@simplisync.local";
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth());
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!user?.uid) return;

    // Fetch logs for everyone if admin, or just the user if employee
    const baseQuery = isAdmin 
      ? query(collection(db, "attendanceLogs"), orderBy("timeIn", "desc")) 
      : query(collection(db, "attendanceLogs"), where("userId", "==", user.uid), orderBy("timeIn", "desc"));

    const unsubscribe = onSnapshot(baseQuery, (snapshot) => {
      const fetchedLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          timeIn: data.timeIn?.toDate ? data.timeIn.toDate() : null,
          timeOut: data.timeOut?.toDate ? data.timeOut.toDate() : null,
          status: data.status || "N/A",
          fullName: data.fullName || "Unknown",
        } as AttendanceLog;
      });
      setLogs(fetchedLogs);
    });

    return () => unsubscribe();
  }, [user?.uid, isAdmin]);

  // Filter logs by selected month/year
  const filteredLogs = logs.filter(log => {
      if (!log.timeIn) return false;
      return log.timeIn.getMonth() === targetMonth && log.timeIn.getFullYear() === targetYear;
  });

  // Calculate duration
  const getDurationString = (timeIn: Date | null, timeOut: Date | null) => {
    if (!timeIn || !timeOut) return "—";
    const diffMs = timeOut.getTime() - timeIn.getTime();
    if (diffMs < 0) return "Error";
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m`;
  };

  const getDurationMs = (timeIn: Date | null, timeOut: Date | null) => {
    if (!timeIn || !timeOut) return 0;
    const diffMs = timeOut.getTime() - timeIn.getTime();
    return diffMs > 0 ? diffMs : 0;
  };

  // Group logs by user if admin, otherwise group by day
  const employeeStats = filteredLogs.reduce((acc, log) => {
    const key = isAdmin ? log.userId : log.timeIn!.toLocaleDateString();
    const name = isAdmin ? log.fullName : log.timeIn!.toLocaleDateString();
    
    if (!acc[key]) {
      acc[key] = { name, totalMs: 0, logCount: 0, overtimeMs: 0, logs: [] };
    }
    
    const ms = getDurationMs(log.timeIn, log.timeOut);
    acc[key].totalMs += ms;
    acc[key].logCount += 1;
    acc[key].logs.push(log);
    
    // Naive overtime calculation: > 8 hours a day (for specific shifts, needs complex logic, simplifying here)
    if (!isAdmin) {
        if (ms > 8 * 60 * 60 * 1000) {
            acc[key].overtimeMs += (ms - (8 * 60 * 60 * 1000));
        }
    }
    
    return acc;
  }, {} as Record<string, any>);

  // If Admin, calculate overtime globally per user by summing daily overtime first
  if (isAdmin) {
      filteredLogs.forEach(log => {
         const ms = getDurationMs(log.timeIn, log.timeOut);
         if (ms > 8 * 60 * 60 * 1000) {
             employeeStats[log.userId].overtimeMs += (ms - (8 * 60 * 60 * 1000));
         }
      });
  }

  const formatMsToHrs = (ms: number) => {
      const hrs = (ms / (1000 * 60 * 60)).toFixed(1);
      return hrs;
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        {/* Dynamic Background Glows */}
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Clock className="w-10 h-10 text-teal-500" />
                Timesheets
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                {isAdmin ? "Monitor employee hours and calculate overtime." : "Track your clocked hours and daily performance."}
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white dark:bg-white/5 p-2 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                <select 
                    value={targetMonth} 
                    onChange={(e) => setTargetMonth(parseInt(e.target.value))}
                    className="p-2 bg-transparent text-gray-700 dark:text-white font-medium focus:outline-none cursor-pointer"
                >
                    {Array.from({length: 12}).map((_, i) => (
                        <option key={i} value={i} className="text-gray-900">{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                </select>
                <select 
                    value={targetYear} 
                    onChange={(e) => setTargetYear(parseInt(e.target.value))}
                    className="p-2 bg-transparent text-gray-700 dark:text-white font-medium focus:outline-none cursor-pointer border-l border-gray-200 dark:border-white/10 pl-4"
                >
                    {[targetYear - 1, targetYear, targetYear + 1].map(y => (
                        <option key={y} value={y} className="text-gray-900">{y}</option>
                    ))}
                </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            
            {/* Main Stats / Timesheet Table */}
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {isAdmin ? "Employee Aggregates" : "Daily Breakdown"}
               </h3>
               
               <div className="w-full">
                  <table className="w-full text-left border-collapse block lg:table">
                    <thead className="hidden lg:table-header-group">
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{isAdmin ? "Employee" : "Date"}</th>
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Clocked</th>
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Overtime</th>
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{isAdmin ? "Total Shifts" : "Shift Timeline"}</th>
                      </tr>
                    </thead>
                    <tbody className="block lg:table-row-group divide-y lg:divide-y dark:divide-white/5 divide-transparent lg:divide-gray-100">
                      {Object.keys(employeeStats).length > 0 ? (
                          Object.keys(employeeStats).map(key => {
                              const stat = employeeStats[key];
                              return (
                                <tr key={key} className="block lg:table-row group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors mb-4 lg:mb-0 bg-slate-50 dark:bg-white/5 lg:bg-transparent rounded-2xl lg:rounded-none p-4 lg:p-0 border border-gray-100 dark:border-white/5 lg:border-none shadow-sm lg:shadow-none">
                                    <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 lg:pr-4 border-b border-gray-100 dark:border-white/5 lg:border-none">
                                        <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold">{isAdmin ? "Employee" : "Date"}</span>
                                        <div className="font-semibold text-gray-900 dark:text-white">{stat.name}</div>
                                    </td>
                                    <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 lg:pr-4 border-b border-gray-100 dark:border-white/5 lg:border-none">
                                        <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold">Total Clocked</span>
                                        <div className="font-bold text-teal-600 dark:text-teal-400">{formatMsToHrs(stat.totalMs)} hrs</div>
                                    </td>
                                    <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 lg:pr-4 border-b border-gray-100 dark:border-white/5 lg:border-none">
                                        <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold">Overtime</span>
                                        {stat.overtimeMs > 0 ? (
                                             <div className="font-semibold text-rose-600 dark:text-rose-400">+{formatMsToHrs(stat.overtimeMs)} hrs</div>
                                        ) : (
                                             <div className="text-gray-400 dark:text-gray-600">—</div>
                                        )}
                                    </td>
                                    <td className="flex flex-col lg:table-cell py-3 lg:py-4 lg:pr-4">
                                        <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold mb-1">{isAdmin ? "Total Shifts" : "Shift Timeline"}</span>
                                        {isAdmin ? (
                                            <div className="text-gray-600 dark:text-gray-300">{stat.logCount} shifts logged</div>
                                        ) : (
                                            <div className="text-sm text-gray-600 dark:text-gray-300">
                                                {stat.logs.map((l: any, i: number) => (
                                                    <div key={i}>
                                                        {l.timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {l.timeOut ? l.timeOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Active"}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                              );
                          })
                      ) : (
                         <tr className="block lg:table-row">
                          <td colSpan={4} className="block lg:table-cell py-8 text-center text-gray-500 dark:text-gray-400 italic bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 mt-4 lg:w-full">
                            No logs found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
            
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
