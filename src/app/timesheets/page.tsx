"use client";

import { useState, useEffect, Suspense } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Navbar";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import { Clock, ArrowLeft, Download, ShieldCheck, FileText } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

interface CustomPDFCell {
  content: string;
  colSpan?: number;
  styles?: {
    fontStyle?: "normal" | "bold" | "italic" | "bolditalic";
    fillColor?: [number, number, number];
    textColor?: [number, number, number];
  };
}

type PDFRowInput = (string | CustomPDFCell)[];

export default function TimesheetsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-[#0a0a0a] text-teal-500 font-bold tracking-widest animate-pulse">Loading Timesheets...</div>}>
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
  const [cutoff, setCutoff] = useState<"1" | "2">(() => new Date().getDate() <= 15 ? "1" : "2");

  useEffect(() => {
    if (!user && !isAdmin) return;

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
        
        if (timeInDate && timeInDate >= startOfPeriod && timeInDate <= endOfPeriod) {
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
  }, [user, isAdmin, filterEmployeeId, selectedMonth, cutoff]);

  const calculateActualLateMins = (timeIn: Date | null) => {
    if (!timeIn) return 0;
    const targetTime = new Date(timeIn);
    targetTime.setHours(8, 0, 0, 0); 
    const diffMs = timeIn.getTime() - targetTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins > 0 ? diffMins : 0;
  };

  const formatTime = (date: Date | null) => date ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "---";
  const formatDate = (date: Date | null) => date ? date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "---";

  const getStatusStyle = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes("present")) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300";
    if (s.includes("working")) return "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300";
    if (s.includes("late")) return "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-300";
    if (s.includes("admin") || s.includes("force") || s.includes("resolved")) return "bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300";
    return "bg-gray-100 text-gray-800 dark:bg-white/10 dark:text-gray-300";
  };

  let totalMsWorked = 0;
  let totalLateMinsAccumulated = 0;
  
  logs.forEach(log => {
    const lateMins = calculateActualLateMins(log.timeIn);
    if (!log.isLateExcused) totalLateMinsAccumulated += lateMins;
    if (log.timeIn && log.timeOut) {
      totalMsWorked += log.timeOut.getTime() - log.timeIn.getTime();
    }
  });

  const totalHrs = Math.floor(totalMsWorked / (1000 * 60 * 60));
  const totalMins = Math.floor((totalMsWorked % (1000 * 60 * 60)) / (1000 * 60));

  const getSortedLogs = () => {
    return [...logs].sort((a, b) => {
      const nameA = (a.fullName || "").trim().toLowerCase();
      const nameB = (b.fullName || "").trim().toLowerCase();
      if (nameA !== nameB) return nameA.localeCompare(nameB);
      const dateA = a.timeIn ? a.timeIn.getTime() : 0;
      const dateB = b.timeIn ? b.timeIn.getTime() : 0;
      return dateA - dateB;
    });
  };

  // PDF Export Engine 
  const handleExportPDF = () => {
    if (logs.length === 0) return toast.error("No data to export.");
    const doc = new jsPDF("landscape");
    
    doc.setFontSize(18);
    doc.text(`SimpliSync Timesheet Report`, 14, 15);
    doc.setFontSize(11);
    doc.text(`Period: ${selectedMonth} | Cutoff: ${cutoff === "1" ? "1st - 15th" : "16th - End"}`, 14, 23);

    const formattedExportLogs = getSortedLogs();
    const tableData: PDFRowInput[] = [];
    
    let currentEmployeeName = formattedExportLogs[0]?.fullName || "Unknown Employee";
    let empLateMins = 0;
    let empMsWorked = 0;

    const appendSubtotalRow = (employeeName: string, lateMinsSum: number, msWorkedSum: number) => {
      const subHrs = Math.floor(msWorkedSum / (1000 * 60 * 60));
      const subMins = Math.floor((msWorkedSum % (1000 * 60 * 60)) / (1000 * 60));
      tableData.push([
        { content: `SUBTOTAL: ${employeeName}`, colSpan: 4, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } },
        { content: `${lateMinsSum} mins`, styles: { fontStyle: 'bold', fillColor: [240, 240, 240], textColor: lateMinsSum > 0 ? [200, 0, 0] : [0, 150, 0] } },
        { content: `${subHrs}h ${subMins}m`, colSpan: 3, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
      ]);
    };

    formattedExportLogs.forEach((log, index) => {
      const logEmployeeName = log.fullName || "Unknown Employee";

      if (logEmployeeName !== currentEmployeeName) {
        appendSubtotalRow(currentEmployeeName, empLateMins, empMsWorked);
        empLateMins = 0;
        empMsWorked = 0;
        currentEmployeeName = logEmployeeName;
      }

      const lateMins = calculateActualLateMins(log.timeIn);
      const durationMs = (log.timeIn && log.timeOut) ? log.timeOut.getTime() - log.timeIn.getTime() : 0;
      const durHrs = (durationMs / (1000 * 60 * 60)).toFixed(2);

      if (!log.isLateExcused) empLateMins += lateMins;
      empMsWorked += durationMs;

      const cleanStatus = log.isLateExcused ? "Admin Resolved" : log.status;

      tableData.push([
        logEmployeeName,
        formatDate(log.timeIn),
        formatTime(log.timeIn),
        formatTime(log.timeOut),
        log.isLateExcused ? "0 (Excused)" : lateMins.toString(),
        durHrs,
        cleanStatus,
        log.earlyOutReason || log.lateReason || ""
      ]);

      if (index === formattedExportLogs.length - 1) {
        appendSubtotalRow(currentEmployeeName, empLateMins, empMsWorked);
      }
    });

    // Directly invoking configuration using explicit strict typing matrix inputs
    autoTable(doc, {
      head: [["Employee", "Date", "Time In", "Time Out", "Late", "Duration (Hrs)", "Status", "Remarks"]],
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [13, 148, 136] }, 
      styles: { fontSize: 8 },
    });

    doc.save(`Timesheet_PDF_${selectedMonth}_Cutoff_${cutoff}.pdf`);
    toast.success("PDF Visualizer Downloaded!");
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return toast.error("No data to export.");
    const headers = ["Employee", "Date", "Time In", "Time Out", "Late (Mins)", "Duration (Hrs)", "Status", "Remarks"];
    const formattedExportLogs = getSortedLogs();
    const csvLines: string[] = [headers.join(",")];
    
    let currentEmployeeName = formattedExportLogs[0]?.fullName || "Unknown Employee";
    let empLateMins = 0;
    let empMsWorked = 0;
    let grandLateMins = 0;
    let grandMsWorked = 0;

    const appendSubtotalRow = (employeeName: string, lateMinsSum: number, msWorkedSum: number) => {
      const subHrs = Math.floor(msWorkedSum / (1000 * 60 * 60));
      const subMins = Math.floor((msWorkedSum % (1000 * 60 * 60)) / (1000 * 60));
      csvLines.push([`"SUBTOTAL: ${employeeName}"`, `""`, `""`, `""`, `"${lateMinsSum} mins"`, `"${subHrs}h ${subMins}m"`, `""`, `""`].join(","));
      csvLines.push(",,,,,,,");
    };

    formattedExportLogs.forEach((log, index) => {
      const logEmployeeName = log.fullName || "Unknown Employee";

      if (logEmployeeName !== currentEmployeeName) {
        appendSubtotalRow(currentEmployeeName, empLateMins, empMsWorked);
        empLateMins = 0;
        empMsWorked = 0;
        currentEmployeeName = logEmployeeName;
      }

      const lateMins = calculateActualLateMins(log.timeIn);
      const durationMs = (log.timeIn && log.timeOut) ? log.timeOut.getTime() - log.timeIn.getTime() : 0;
      const durHrs = (durationMs / (1000 * 60 * 60)).toFixed(2);

      if (!log.isLateExcused) {
        empLateMins += lateMins;
        grandLateMins += lateMins;
      }
      empMsWorked += durationMs;
      grandMsWorked += durationMs;

      const remarks = [];
      if (log.lateReason) remarks.push(`Late Reason: ${log.lateReason}`);
      if (log.earlyOutReason) remarks.push(`Admin: ${log.earlyOutReason}`);
      if (log.isLateExcused) remarks.push("Excused Late");

      csvLines.push([
        logEmployeeName,
        formatDate(log.timeIn),
        formatTime(log.timeIn),
        formatTime(log.timeOut),
        log.isLateExcused ? 0 : lateMins,
        durHrs,
        log.isLateExcused ? "Admin Resolved" : log.status,
        remarks.join(" | ") || "None"
      ].map(val => `"${val}"`).join(","));

      if (index === formattedExportLogs.length - 1) appendSubtotalRow(currentEmployeeName, empLateMins, empMsWorked);
    });

    const grandHrs = Math.floor(grandMsWorked / (1000 * 60 * 60));
    const grandMins = Math.floor((grandMsWorked % (1000 * 60 * 60)) / (1000 * 60));

    csvLines.push(",,,,,,,"); 
    csvLines.push([`"GRAND TOTALS"`, `""`, `""`, `""`, `"${grandLateMins} mins"`, `"${grandHrs}h ${grandMins}m"`, `""`, `""`].join(","));

    const blob = new Blob([csvLines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `Timesheet_Report_${selectedMonth}_Cutoff_${cutoff}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen w-full relative overflow-x-hidden pt-[73px] bg-slate-50 dark:bg-[#0a0a0a]">
        <Navbar />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
          
          {filterEmployeeId && (
             <Link href="/employees" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-teal-600 mb-6 transition-colors">
               <ArrowLeft className="w-4 h-4" /> Back to Directory
             </Link>
          )}

          <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-teal-500" />
                {filterEmployeeName ? `${filterEmployeeName}'s Logs` : 'Timesheets'}
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm sm:text-base">
                Historical attendance, durations, and cutoff summaries.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <input 
                type="month" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)} 
                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
              />
              <select 
                value={cutoff}
                onChange={(e) => setCutoff(e.target.value as "1" | "2")}
                className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 shadow-sm cursor-pointer"
              >
                <option value="1">1st Half (1st - 15th)</option>
                <option value="2">2nd Half (16th - End)</option>
              </select>

              <button 
                onClick={handleExportPDF}
                className="bg-rose-600 hover:bg-rose-500 text-white border border-rose-600 px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 font-bold active:scale-95" 
              >
                <FileText className="w-4 h-4" /> Export PDF
              </button>

              <button 
                onClick={handleExportCSV}
                className="bg-teal-600 hover:bg-teal-500 text-white border border-teal-600 px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 font-bold active:scale-95" 
              >
                <Download className="w-4 h-4" /> Export CSV
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
                        <th className="px-4 py-3 text-center rounded-tr-xl">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 block lg:table-row-group">
                      {isLoading ? (
                        <tr className="block lg:table-row">
                          <td colSpan={isAdmin && !filterEmployeeId ? 6 : 5} className="block lg:table-cell py-12 text-center text-teal-500 animate-pulse font-medium">Fetching cutoff records...</td>
                        </tr>
                      ) : logs.length > 0 ? (
                          logs.map((log) => {
                              const actualLateMins = calculateActualLateMins(log.timeIn);
                              let cleanStatus = log.isLateExcused ? "Admin Resolved" : (log.status || "Present");

                              if (!log.isLateExcused) {
                                if (cleanStatus.toLowerCase().includes("force")) cleanStatus = "Force Clocked Out";
                                else if (cleanStatus.toLowerCase().includes("late")) cleanStatus = "Late";
                                else if (actualLateMins > 0 && cleanStatus === "Working") cleanStatus = "Working";
                                else if (actualLateMins > 0 && cleanStatus === "Present") cleanStatus = "Late";
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
                                      </div>
                                    </td>
                                    <td className="block lg:table-cell py-2 lg:py-4 px-2 lg:px-4 lg:text-center font-mono text-gray-600 dark:text-gray-400">
                                      <span className="lg:hidden text-xs text-gray-500 uppercase font-semibold block mb-1">Late (Mins)</span>
                                      <div className="flex items-center lg:justify-center gap-1.5">
                                        {actualLateMins > 0 ? (
                                          <span className={`font-bold ${log.isLateExcused ? 'text-emerald-500 line-through opacity-50' : 'text-rose-500'}`}>
                                            {actualLateMins}
                                          </span>
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
                          <td colSpan={isAdmin && !filterEmployeeId ? 6 : 5} className="block lg:table-cell py-12 text-center text-gray-500 dark:text-gray-400 italic bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 mt-4 lg:w-full">
                            No logs found for this cutoff period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
               </div>
            </div>

            {/* Summary Footer */}
            {logs.length > 0 && filterEmployeeId && (
              <div className="mt-6 border-t border-gray-200 dark:border-white/10 pt-4 flex flex-col sm:flex-row justify-end gap-6 sm:gap-12 px-4">
                <div className="flex justify-between sm:flex-col sm:items-end gap-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Work Hours</span>
                  <span className="text-lg font-black text-gray-900 dark:text-white font-mono">{totalHrs}h {totalMins}m</span>
                </div>
                <div className="flex justify-between sm:flex-col sm:items-end gap-1">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Minutes Late</span>
                  <span className={`text-lg font-black font-mono ${totalLateMinsAccumulated > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {totalLateMinsAccumulated} mins
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}