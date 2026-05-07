"use client";

import { useState, useEffect, Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Clock, ArrowLeft, Download } from "lucide-react";
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
  const [targetMonth, setTargetMonth] = useState(new Date().getMonth());
  const [targetYear, setTargetYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!user?.uid) return;

    let baseQuery;
    
    if (isAdmin && filterEmployeeId) {
      baseQuery = query(collection(db, "attendanceLogs"), where("userId", "==", filterEmployeeId), orderBy("timeIn", "desc"));
    } else {
      baseQuery = isAdmin 
        ? query(collection(db, "attendanceLogs"), orderBy("timeIn", "desc")) 
        : query(collection(db, "attendanceLogs"), where("userId", "==", user.uid), orderBy("timeIn", "desc"));
    }

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
          earlyOutReason: data.earlyOutReason, 
        } as AttendanceLog;
      });
      setLogs(fetchedLogs);
    });

    return () => unsubscribe();
  }, [user?.uid, isAdmin, filterEmployeeId]);

  const filteredLogs = logs.filter(log => {
      if (!log.timeIn) return false;
      return log.timeIn.getMonth() === targetMonth && log.timeIn.getFullYear() === targetYear;
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getDurationMs = (timeIn: Date | null, timeOut: Date | null) => {
    if (!timeIn || !timeOut) return 0;
    const diffMs = timeOut.getTime() - timeIn.getTime();
    return diffMs > 0 ? diffMs : 0;
  };

  const exportToCSV = () => {
    const monthName = new Date(0, targetMonth).toLocaleString('default', { month: 'long' });
    const titleString = (isAdmin && filterEmployeeName) ? `${filterEmployeeName} Timesheet - ${monthName} ${targetYear}` : `Timesheets - ${monthName} ${targetYear}`;
    
    let csvContent = `${titleString}\n\n`;
    
    // 'Early Out Reason' to CSV Headers
    if (isAdmin && !filterEmployeeId) {
        csvContent += `Name,Date,Time In,Time Out,Late (mins),Status,Early Out Reason\n`;
    } else {
        csvContent += `Date,Time In,Time Out,Late (mins),Status,Early Out Reason\n`;
    }
    
    filteredLogs.forEach(log => {
      const lateMins = log.timeIn ? Math.max(0, (log.timeIn.getHours() - 9) * 60 + log.timeIn.getMinutes()) : 0;
      const status = log.status || (log.timeIn ? "Present" : "Absent");
      const dateStr = log.timeIn ? log.timeIn.toLocaleDateString() : "—";
      const timeInStr = log.timeIn ? log.timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
      const timeOutStr = log.timeOut ? log.timeOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—";
      const earlyOutStr = log.earlyOutReason || "—"; 
      
      // Pushing earlyOutStr to the CSV columns
      if (isAdmin && !filterEmployeeId) {
        csvContent += `"${log.fullName || "Unknown"}","${dateStr}","${timeInStr}","${timeOutStr}",${lateMins},"${status}","${earlyOutStr}"\n`;
      } else {
        csvContent += `"${dateStr}","${timeInStr}","${timeOutStr}",${lateMins},"${status}","${earlyOutStr}"\n`;
      }
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${titleString}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="absolute top-0 left-0 w-[40rem] h-[40rem] bg-teal-400/20 dark:bg-teal-600/10 rounded-full blur-[150px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-[30rem] h-[30rem] bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          <div className="flex flex-col md:flex-row justify-between gap-6 mb-8 mt-4">
            <div className="flex flex-col justify-end">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Clock className="w-10 h-10 text-teal-500" />
                {isAdmin && filterEmployeeName ? `${filterEmployeeName}'s Timesheet` : "Timesheets"}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">
                {isAdmin && !filterEmployeeId ? "Monitor employee hours and calculate overtime." : "Track your clocked hours and daily performance."}
              </p>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-3">
              {isAdmin && filterEmployeeId && (
                <Link href="/employees" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-xl transition-all shadow-sm group">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Directory
                </Link>
              )}
              <div className="flex items-center gap-2 sm:gap-4 bg-white dark:bg-white/5 p-2 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
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
                      className="p-2 bg-transparent text-gray-700 dark:text-white font-medium focus:outline-none cursor-pointer border-l border-gray-200 dark:border-white/10 pl-2 sm:pl-4"
                  >
                      {[targetYear - 1, targetYear, targetYear + 1].map(y => (
                          <option key={y} value={y} className="text-gray-900">{y}</option>
                      ))}
                  </select>
                  <button
                      onClick={exportToCSV}
                      className="ml-1 sm:ml-2 flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-500 hover:from-teal-500 hover:to-emerald-400 text-white rounded-xl font-medium transition-all shadow-sm active:scale-95 shrink-0"
                  >
                     <Download className="w-4 h-4" />
                     <span className="hidden sm:inline">Export CSV</span>
                  </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl">
               <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isAdmin && !filterEmployeeId ? "All Timesheets" : "Monthly Log"}
                 </h3>
                 {isAdmin && filterEmployeeId && (
                   <Link href="/timesheets" className="text-sm font-semibold text-teal-600 dark:text-teal-400 hover:underline">
                     Clear Filter (View All)
                   </Link>
                 )}
               </div>
               
               <div className="w-full">
                  <table className="w-full text-left border-collapse block lg:table">
                    <thead className="hidden lg:table-header-group">
                      <tr className="border-b border-gray-200 dark:border-white/10">
                        {isAdmin && !filterEmployeeId && <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>}
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time In</th>
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time Out</th>
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Late (mins)</th>
                        <th className="pb-3 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="block lg:table-row-group divide-y lg:divide-y dark:divide-white/5 divide-transparent lg:divide-gray-100">
                      {filteredLogs.length > 0 ? (
                          filteredLogs.map(log => {
                              const lateMins = log.timeIn ? Math.max(0, (log.timeIn.getHours() - 9) * 60 + log.timeIn.getMinutes()) : 0;
                              const status = log.status || (log.timeIn ? "Present" : "Absent");
                              
                              return (
                                <tr key={log.id} className="block lg:table-row group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors mb-4 lg:mb-0 bg-slate-50 dark:bg-white/5 lg:bg-transparent rounded-2xl lg:rounded-none p-4 lg:p-0 border border-gray-100 dark:border-white/5 lg:border-none shadow-sm lg:shadow-none">
                                    {isAdmin && !filterEmployeeId && (
                                      <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 lg:pr-4 border-b border-gray-100 dark:border-white/5 lg:border-none">
                                          <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold">Name</span>
                                          <div className="font-semibold text-gray-900 dark:text-white">{log.fullName || "Unknown"}</div>
                                      </td>
                                    )}
                                    <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 lg:pr-4 border-b border-gray-100 dark:border-white/5 lg:border-none">
                                        <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold">Date</span>
                                        <div className="font-semibold text-gray-900 dark:text-white">
                                          {log.timeIn ? log.timeIn.toLocaleDateString() : "—"}
                                        </div>
                                    </td>
                                    <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 lg:pr-4 border-b border-gray-100 dark:border-white/5 lg:border-none">
                                        <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold">Time In</span>
                                        <div className="text-gray-700 dark:text-gray-300">
                                          {log.timeIn ? log.timeIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                                        </div>
                                    </td>
                                    <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 lg:pr-4 border-b border-gray-100 dark:border-white/5 lg:border-none">
                                        <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold">Time Out</span>
                                        <div className="flex flex-col items-end lg:items-start">
                                          <span className="text-gray-700 dark:text-gray-300">
                                            {log.timeOut ? log.timeOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "—"}
                                          </span>
                                          {/*  UI badge for Early Out */}
                                          {log.earlyOutReason && (
                                            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 mt-1 uppercase tracking-wider">
                                              {log.earlyOutReason}
                                            </span>
                                          )}
                                        </div>
                                    </td>
                                    <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 lg:pr-4 border-b border-gray-100 dark:border-white/5 lg:border-none">
                                        <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold">Late (mins)</span>
                                        <div className={`font-medium ${lateMins > 0 ? "text-rose-600 dark:text-rose-400" : "text-green-600 dark:text-green-400"}`}>
                                           {lateMins}
                                        </div>
                                    </td>
                                    <td className="flex justify-between items-center lg:table-cell py-2 lg:py-4 lg:pr-4">
                                        <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold">Status</span>
                                        <div className="text-gray-700 dark:text-gray-300">
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.toLowerCase() === 'present' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'}`}>
                                            {status}
                                          </span>
                                        </div>
                                    </td>
                                </tr>
                              );
                          })
                      ) : (
                         <tr className="block lg:table-row">
                          <td colSpan={isAdmin && !filterEmployeeId ? 6 : 5} className="block lg:table-cell py-8 text-center text-gray-500 dark:text-gray-400 italic bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 mt-4 lg:w-full">
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