"use client";

import { useState, useEffect, Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Clock, ArrowLeft, Download, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface AttendanceLog {
  id: string;
  userId: string;
  timeIn: Date | null;
  timeOut: Date | null;
  status: string;
  fullName?: string;
  earlyOutReason?: string; 
  lateReason?: string;
  isLateExcused?: boolean;
}

export default function TimesheetsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] text-gray-500">Loading Timesheets...</div>}>
      <TimesheetsContent />
    </Suspense>
  );
}

function TimesheetsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const filterEmployeeId = searchParams.get('employeeId');
  const filterEmployeeName = searchParams.get('employeeName');

  const isAdmin = user?.email === "admin@simplisync.local";
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!user && !isAdmin) return;

    const [year, month] = selectedMonth.split('-');
    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1, 0, 0, 0);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);

    let q;
    const logsRef = collection(db, "attendanceLogs");

    if (isAdmin && !filterEmployeeId) {
      q = query(logsRef, orderBy("timeIn", "desc"));
    } else {
      const targetId = filterEmployeeId || user?.uid;
      q = query(logsRef, where("userId", "==", targetId), orderBy("timeIn", "desc"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs: AttendanceLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        const timeInDate = data.timeIn?.toDate ? data.timeIn.toDate() : null;
        
        if (timeInDate && timeInDate >= startOfMonth && timeInDate <= endOfMonth) {
          fetchedLogs.push({
            id: doc.id,
            userId: data.userId,
            timeIn: timeInDate,
            timeOut: data.timeOut?.toDate ? data.timeOut.toDate() : null,
            status: data.status || "Present",
            fullName: data.fullName,
            earlyOutReason: data.earlyOutReason,
            lateReason: data.lateReason,
            isLateExcused: data.isLateExcused,
          });
        }
      });
      setLogs(fetchedLogs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, isAdmin, filterEmployeeId, selectedMonth]);

  // --- Dynamic Math Helpers ---
  const calculateActualLateMins = (timeIn: Date | null) => {
    if (!timeIn) return 0;
    const targetTime = new Date(timeIn);
    targetTime.setHours(8, 0, 0, 0); // 08:00 AM Standard Start
    const diffMs = timeIn.getTime() - targetTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins > 0 ? diffMins : 0;
  };

  const calculateDuration = (timeIn: Date | null, timeOut: Date | null) => {
    if (!timeIn || !timeOut) return "---";
    const diffMs = timeOut.getTime() - timeIn.getTime();
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hrs}h ${mins}m`;
  };

  const formatTime = (date: Date | null) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---";
  const formatDate = (date: Date | null) => date ? date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "---";

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("present")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";
    if (s.includes("working")) return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300";
    if (s.includes("late")) return "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300";
    if (s.includes("admin") || s.includes("force")) return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300";
    return "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300";
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-x-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-emerald-500/10 rounded-full blur-[150px] pointer-events-none"></div>
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          {filterEmployeeId && (
             <Link href="/payroll" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-emerald-600 mb-6 transition-colors">
               <ArrowLeft className="w-4 h-4" /> Back to Directory
             </Link>
          )}

          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-500" />
                {filterEmployeeName ? `${filterEmployeeName}'s Logs` : 'Timesheets'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
                Historical attendance, durations, and status reports.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm w-full md:w-auto"
              />
              <button className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-2.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 text-gray-600 dark:text-gray-300 transition-colors shadow-sm" title="Export CSV">
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="w-full overflow-x-auto">
               <div className="min-w-full inline-block align-middle">
                  <table className="w-full text-left border-collapse">
                    <thead className="hidden lg:table-header-group">
                      <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                        {isAdmin && !filterEmployeeId && <th className="px-4 py-3 rounded-tl-xl">Employee</th>}
                        <th className={`px-4 py-3 ${(!isAdmin || filterEmployeeId) ? 'rounded-tl-xl' : ''}`}>Date</th>
                        <th className="px-4 py-3">Time In</th>
                        <th className="px-4 py-3">Time Out</th>
                        <th className="px-4 py-3 text-center">Late (Mins)</th>
                        <th className="px-4 py-3 text-center">Duration</th>
                        <th className="px-4 py-3 text-center rounded-tr-xl">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 block lg:table-row-group">
                      {isLoading ? (
                        <tr className="block lg:table-row">
                          <td colSpan={isAdmin && !filterEmployeeId ? 7 : 6} className="block lg:table-cell py-12 text-center text-emerald-500 animate-pulse font-medium">Fetching secure records...</td>
                        </tr>
                      ) : logs.length > 0 ? (
                          logs.map((log) => {
                              // Dynamically calculate actual late minutes
                              const actualLateMins = calculateActualLateMins(log.timeIn);
                              //  Clean the status string so it doesnt shows the minutes text
                              let cleanStatus = log.status || "Present";
                              if (cleanStatus.toLowerCase().includes("force")) {
                                cleanStatus = "Admin Resolved";
                              } else if (cleanStatus.toLowerCase().includes("late")) {
                                cleanStatus = "Late";
                              } else if (actualLateMins > 0 && cleanStatus === "Working") {
                                cleanStatus = "Working";
                              } else if (actualLateMins > 0 && cleanStatus === "Present") {
                                cleanStatus = "Late";
                              }

                              return (
                                <tr key={log.id} className="block lg:table-row bg-white dark:bg-transparent border lg:border-none border-gray-100 dark:border-white/5 mb-4 lg:mb-0 rounded-2xl p-4 lg:p-0 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                                    {isAdmin && !filterEmployeeId && (
                                      <td className="block lg:table-cell py-2 lg:py-4 px-2 lg:px-4 font-bold text-gray-900 dark:text-white">
                                        <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold block mb-1">Employee</span>
                                        {log.fullName}
                                      </td>
                                    )}
                                    <td className="block lg:table-cell py-2 lg:py-4 px-2 lg:px-4 font-medium text-gray-700 dark:text-gray-300">
                                      <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold block mb-1">Date</span>
                                      {formatDate(log.timeIn)}
                                    </td>
                                    <td className="block lg:table-cell py-2 lg:py-4 px-2 lg:px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                      <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold block mb-1">Time In</span>
                                      {formatTime(log.timeIn)}
                                    </td>
                                    <td className="block lg:table-cell py-2 lg:py-4 px-2 lg:px-4">
                                      <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold block mb-1">Time Out</span>
                                      <div className="flex flex-col">
                                        <span className={`font-mono font-bold ${log.timeOut ? "text-rose-600 dark:text-rose-400" : "text-amber-500 animate-pulse"}`}>
                                          {log.timeOut ? formatTime(log.timeOut) : "WORKING..."}
                                        </span>
                                        {log.earlyOutReason && (
                                          <span className="text-[9px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 uppercase tracking-widest mt-1 w-fit">
                                            {log.earlyOutReason}
                                          </span>
                                        )}
                                      </div>
                                    </td>
                                    
                                    {/*  Displays just the Number. If Admin Excused it, it crosses the number out */}
                                    <td className="block lg:table-cell py-2 lg:py-4 px-2 lg:px-4 lg:text-center font-mono text-gray-600 dark:text-gray-400">
                                      <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold block mb-1">Late (Mins)</span>
                                      <div className="flex items-center lg:justify-center gap-1.5">
                                        {actualLateMins > 0 ? (
                                          <span className={`font-bold ${log.isLateExcused ? 'text-emerald-500 line-through opacity-50' : 'text-rose-500'}`}>
                                            {actualLateMins}
                                          </span>
                                        ) : (
                                          "---"
                                        )}
                                        {log.isLateExcused && (
  <span title="Excused by Admin">
    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
  </span>
)}
                                      </div>
                                    </td>
                                    
                                    <td className="block lg:table-cell py-2 lg:py-4 px-2 lg:px-4 lg:text-center font-mono font-medium text-gray-700 dark:text-gray-300">
                                      <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold block mb-1">Duration</span>
                                      {calculateDuration(log.timeIn, log.timeOut)}
                                    </td>
                                    
                                    {/* colorful badges */}
                                    <td className="block lg:table-cell py-2 lg:py-4 px-2 lg:px-4 lg:text-center">
                                        <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold block mb-1">Status</span>
                                        <div className="text-gray-700 dark:text-gray-300">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyle(cleanStatus)}`}>
                                            {cleanStatus}
                                          </span>
                                        </div>
                                    </td>
                                </tr>
                              );
                          })
                      ) : (
                         <tr className="block lg:table-row">
                          <td colSpan={isAdmin && !filterEmployeeId ? 7 : 6} className="block lg:table-cell py-12 text-center text-gray-500 dark:text-gray-400 italic bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 mt-4 lg:w-full">
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